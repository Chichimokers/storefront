import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { AdminLayout } from './AdminLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import api from '../../services/api';
import type { Order } from '../../services/types';

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: { status?: string; search?: string } = {};
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const data = await api.getAllOrders(Object.keys(params).length > 0 ? params : undefined);
      const ords = data.results || [];
      setOrders(ords);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, search]);

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      await api.updateAdminOrderStatus(orderId, newStatus);
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus as any });
      }
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Pedidos</h1>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por ID o cliente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="w-40"
        >
          <option value="">Todos</option>
          <option value="pending">Pendiente</option>
          <option value="processing">Procesando</option>
          <option value="completed">Completado</option>
          <option value="cancelled">Cancelado</option>
        </Select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Cliente</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Teléfono</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Total</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Estado</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Fecha</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map(order => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">#{order.id}</td>
                <td className="px-4 py-3">{order.customer_name}</td>
                <td className="px-4 py-3 text-gray-500">{order.customer_phone}</td>
                <td className="px-4 py-3 font-medium">${order.total_amount}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(order.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedOrder(order)}
                  >
                    Ver
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold">Pedido #{selectedOrder.id}</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <h3 className="font-medium mb-2">Información del Cliente</h3>
                <p className="text-sm"><strong>Nombre:</strong> {selectedOrder.customer_name}</p>
                <p className="text-sm"><strong>Teléfono:</strong> {selectedOrder.customer_phone}</p>
                <p className="text-sm"><strong>Dirección:</strong> {selectedOrder.customer_address}</p>
                {selectedOrder.notes && (
                  <p className="text-sm"><strong>Notas:</strong> {selectedOrder.notes}</p>
                )}
              </div>

              <div>
                <h3 className="font-medium mb-2">Productos</h3>
                <div className="space-y-2">
                  {selectedOrder.products.map((product, index) => (
                    <div key={index} className="flex justify-between text-sm border-b pb-2">
                      <div>
                        <p>{product.name}</p>
                        <p className="text-gray-500">Cantidad: {product.quantity} × ${product.price}</p>
                      </div>
                      <p className="font-medium">${product.subtotal}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t">
                  <p className="font-bold text-lg">Total: ${selectedOrder.total_amount}</p>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Estado</h3>
                <Select
                  value={selectedOrder.status}
                  onChange={e => handleStatusChange(selectedOrder.id, e.target.value)}
                  className="w-full"
                >
                  <option value="pending">Pendiente</option>
                  <option value="processing">Procesando</option>
                  <option value="completed">Completado</option>
                  <option value="cancelled">Cancelado</option>
                </Select>
              </div>

              <div className="pt-4">
                <p className="text-sm text-gray-500">
                  Fecha: {new Date(selectedOrder.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
