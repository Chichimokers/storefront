import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import api from '../../services/api';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, total, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { showNotification } = useNotification();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    notes: ''
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(`/login?next=/checkout`);
      return;
    }

    if (user) {
      setFormData(prev => ({
        ...prev,
        customer_name: `${user.first_name} ${user.last_name}`.trim(),
        customer_phone: user.phone || '',
        customer_address: user.address || ''
      }));
    }
  }, [user, isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customer_name || !formData.customer_phone || !formData.customer_address) {
      showNotification('Por favor complete todos los campos requeridos', 'error');
      return;
    }

    if (items.length === 0) {
      showNotification('El carrito está vacío', 'error');
      return;
    }

    setLoading(true);
    try {
      const products = items.map(item => ({
        id: item.id,
        quantity: item.quantity
      }));

      const response = await api.checkout({
        products,
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        customer_address: formData.customer_address,
        notes: formData.notes
      });

      localStorage.setItem('last_order_id', response.order_id.toString());
      clearCart();
      
      window.open(response.whatsapp_url, '_blank');
      
      showNotification('Pedido creado exitosamente', 'success');
      navigate('/orders');
    } catch (error) {
      console.error('Checkout error:', error);
      showNotification('Error al procesar el pedido', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Información de Entrega</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="customer_name">Nombre Completo *</Label>
                    <Input
                      id="customer_name"
                      value={formData.customer_name}
                      onChange={e => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer_phone">Teléfono *</Label>
                    <Input
                      id="customer_phone"
                      type="tel"
                      placeholder="+53 5 123 4567"
                      value={formData.customer_phone}
                      onChange={e => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer_address">Dirección de Entrega *</Label>
                    <Input
                      id="customer_address"
                      placeholder="Calle 123, La Habana"
                      value={formData.customer_address}
                      onChange={e => setFormData(prev => ({ ...prev, customer_address: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Notas Adicionales</Label>
                    <Input
                      id="notes"
                      placeholder="Notas especiales para la entrega..."
                      value={formData.notes}
                      onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resumen del Carrito</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {items.map(item => (
                      <div key={item.id} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-500">Cantidad: {item.quantity}</p>
                        </div>
                        <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4">Total a Pagar</h2>
                  <div className="flex justify-between text-lg font-bold mb-6">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                    Al hacer clic en "Finalizar Compra" serás redirigido a WhatsApp para completar el pedido.
                  </p>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading || items.length === 0}
                  >
                    {loading ? 'Procesando...' : 'Finalizar Compra'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}
