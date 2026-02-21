import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingCart, Users, DollarSign } from 'lucide-react';
import { AdminLayout } from './AdminLayout';
import api from '../../services/api';

interface DashboardStats {
  orders: { total: number; pending: number; processing: number; completed: number; cancelled: number };
  products: { total: number; active: number };
  users: { total: number };
  revenue: string;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.getAdminDashboard();
        setStats(data);
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  const statCards = [
    { 
      label: 'Pedidos Totales', 
      value: stats?.orders.total || 0, 
      icon: ShoppingCart, 
      color: 'bg-blue-500',
      link: '/panel/orders'
    },
    { 
      label: 'Pedidos Pendientes', 
      value: stats?.orders.pending || 0, 
      icon: Package, 
      color: 'bg-yellow-500',
      link: '/panel/orders?status=pending'
    },
    { 
      label: 'Productos', 
      value: stats?.products.total || 0, 
      icon: Package, 
      color: 'bg-green-500',
      link: '/panel/products'
    },
    { 
      label: 'Usuarios', 
      value: stats?.users.total || 0, 
      icon: Users, 
      color: 'bg-purple-500',
      link: '/panel/users'
    },
    { 
      label: 'Ingresos', 
      value: `$${stats?.revenue || '0'}`, 
      icon: DollarSign, 
      color: 'bg-emerald-500',
      link: '/panel/orders'
    },
  ];

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {statCards.map(card => (
          <Link key={card.label} to={card.link} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className={`${card.color} p-3 rounded-lg`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold">{card.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Estado de Pedidos</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pendientes</span>
              <span className="font-medium text-yellow-600">{stats?.orders.pending || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Procesando</span>
              <span className="font-medium text-blue-600">{stats?.orders.processing || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Completados</span>
              <span className="font-medium text-green-600">{stats?.orders.completed || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Cancelados</span>
              <span className="font-medium text-red-600">{stats?.orders.cancelled || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Productos</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Productos</span>
              <span className="font-medium">{stats?.products.total || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Productos Activos</span>
              <span className="font-medium text-green-600">{stats?.products.active || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Productos Inactivos</span>
              <span className="font-medium text-red-600">{(stats?.products.total || 0) - (stats?.products.active || 0)}</span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
