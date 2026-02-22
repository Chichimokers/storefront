import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, Trash2, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { AdminLayout } from './AdminLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import api from '../../services/api';
import type { Order } from '../../services/types';

interface OrdersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Order[];
}

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [ordering, setOrdering] = useState('-created_at');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const isFirstLoad = useRef(true);

  const itemsPerPage = 10;

  const fetchOrders = useCallback(async (pageNum: number = 1) => {
    setLoading(true);
    try {
      const params: { status?: string; search?: string; ordering?: string; page?: number } = {
        ordering,
        page: pageNum
      };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      
      const data: OrdersResponse = await api.getAllOrders(params);
      setOrders(data.results || []);
      setTotalCount(data.count);
      
      if (data.results.length === 0 && data.count > 0 && pageNum > 1) {
        const lastPage = Math.ceil(data.count / itemsPerPage);
        if (lastPage > 0) {
          setPage(lastPage);
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
      setTotalCount(0);
      if (pageNum > 1) {
        setPage(1);
      }
    } finally {
      setLoading(false);
      isFirstLoad.current = false;
    }
  }, [statusFilter, search, ordering]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (!isFirstLoad.current) {
        setPage(1);
      }
      fetchOrders(1);
    }, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  useEffect(() => {
    fetchOrders(page);
  }, [statusFilter, ordering, page]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      await api.updateAdminOrderStatus(orderId, newStatus);
      fetchOrders(page);
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus as Order['status'] });
      }
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este pedido?')) return;
    try {
      await api.deleteAdminOrder(id);
      fetchOrders(page);
      if (selectedOrder?.id === id) {
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error('Error deleting order:', error);
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'processing': return 'Procesando';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  if (loading && orders.length === 0) {
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

      <div className="flex gap-4 mb-4 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por cliente, teléfono o email..."
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
          <option value="">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="processing">Procesando</option>
          <option value="completed">Completado</option>
          <option value="cancelled">Cancelado</option>
        </Select>
        <Select
          value={ordering}
          onChange={e => setOrdering(e.target.value)}
          className="w-48"
        >
          <option value="-created_at">Más recientes</option>
          <option value="created_at">Más antiguos</option>
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
            {loading && orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  Cargando...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No se encontraron pedidos
                </td>
              </tr>
            ) : (
              orders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">#{order.id}</td>
                  <td className="px-4 py-3">{order.customer_name}</td>
                  <td className="px-4 py-3 text-gray-500">{order.customer_phone}</td>
                  <td className="px-4 py-3 font-medium">${order.total_amount}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-red-600"
                        onClick={() => handleDelete(order.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            {totalCount} pedido{totalCount !== 1 ? 's' : ''} • Página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

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
                        <p className="font-medium">{product.name}</p>
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

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500">
                  Fecha: {new Date(selectedOrder.created_at).toLocaleString()}
                </p>
                {selectedOrder.updated_at && (
                  <p className="text-sm text-gray-500">
                    Actualizado: {new Date(selectedOrder.updated_at).toLocaleString()}
                  </p>
                )}
              </div>

              <div className="pt-4">
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={() => handleDelete(selectedOrder.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar Pedido
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
