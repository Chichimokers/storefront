import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { AdminLayout } from './AdminLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Select } from '../../components/ui/Select';
import api from '../../services/api';
import type { User } from '../../services/types';

interface UsersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: User[];
}

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ordering, setOrdering] = useState('-created_at');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    phone: '',
    is_staff: false,
    is_active: true
  });
  const isFirstLoad = useRef(true);

  const itemsPerPage = 10;

  const fetchUsers = useCallback(async (pageNum: number = 1) => {
    setLoading(true);
    try {
      const data: UsersResponse = await api.getAdminUsers({ 
        search: search || undefined, 
        ordering,
        page: pageNum
      });
      setUsers(data.results || []);
      setTotalCount(data.count);
      
      if (data.results.length === 0 && data.count > 0 && pageNum > 1) {
        const lastPage = Math.ceil(data.count / itemsPerPage);
        if (lastPage > 0) {
          setPage(lastPage);
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
      setTotalCount(0);
      if (pageNum > 1) {
        setPage(1);
      }
    } finally {
      setLoading(false);
      isFirstLoad.current = false;
    }
  }, [search, ordering]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (!isFirstLoad.current) {
        setPage(1);
      }
      fetchUsers(1);
    }, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  useEffect(() => {
    fetchUsers(page);
  }, [ordering, page]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedUser) {
        await api.updateUser(selectedUser.id, {
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          is_staff: formData.is_staff,
          is_active: formData.is_active
        });
      } else {
        await api.createUser(formData);
      }
      setShowModal(false);
      resetForm();
      fetchUsers(page);
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Error al guardar usuario');
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      username: user.username,
      password: '',
      password_confirm: '',
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone || '',
      is_staff: user.is_staff,
      is_active: user.is_active
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
    try {
      await api.deleteUser(id);
      fetchUsers(page);
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const resetForm = () => {
    setSelectedUser(null);
    setFormData({
      email: '',
      username: '',
      password: '',
      password_confirm: '',
      first_name: '',
      last_name: '',
      phone: '',
      is_staff: false,
      is_active: true
    });
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  if (loading && users.length === 0) {
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
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <Button onClick={openCreateModal}>Crear Usuario</Button>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por email, usuario o nombre..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={ordering}
          onChange={e => setOrdering(e.target.value)}
          className="w-48"
        >
          <option value="-created_at">Más recientes</option>
          <option value="created_at">Más antiguos</option>
          <option value="email">Email (A-Z)</option>
          <option value="-email">Email (Z-A)</option>
          <option value="username">Usuario (A-Z)</option>
          <option value="-username">Usuario (Z-A)</option>
        </Select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Usuario</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Email</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Nombre</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Teléfono</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Estado</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Staff</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading && users.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  Cargando...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  No se encontraron usuarios
                </td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">#{user.id}</td>
                  <td className="px-4 py-3">{user.username}</td>
                  <td className="px-4 py-3 text-gray-500">{user.email}</td>
                  <td className="px-4 py-3">{user.first_name} {user.last_name}</td>
                  <td className="px-4 py-3 text-gray-500">{user.phone || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user.is_staff && (
                      <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                        Staff
                      </span>
                    )}
                    {user.is_superuser && (
                      <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-800 ml-1">
                        Admin
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(user)}>
                        Editar
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(user.id)}>
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
            {totalCount} usuario{totalCount !== 1 ? 's' : ''} • Página {page} de {totalPages}
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

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold">
                {selectedUser ? 'Editar Usuario' : 'Crear Usuario'}
              </h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {!selectedUser && (
                <>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="username">Usuario</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={e => setFormData({ ...formData, username: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      required={!selectedUser}
                    />
                  </div>
                  <div>
                    <Label htmlFor="password_confirm">Confirmar Contraseña</Label>
                    <Input
                      id="password_confirm"
                      type="password"
                      value={formData.password_confirm}
                      onChange={e => setFormData({ ...formData, password_confirm: e.target.value })}
                      required={!selectedUser}
                    />
                  </div>
                </>
              )}
              <div>
                <Label htmlFor="first_name">Nombre</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="last_name">Apellido</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_staff"
                    checked={formData.is_staff}
                    onChange={e => setFormData({ ...formData, is_staff: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="is_staff" className="mb-0">Staff</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="is_active" className="mb-0">Activo</Label>
                </div>
              </div>
              <div className="pt-4 flex gap-2">
                <Button type="submit" className="flex-1">
                  {selectedUser ? 'Guardar' : 'Crear'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => { setShowModal(false); resetForm(); }}>
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
