import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search, X, ChevronLeft, ChevronRight, Folder, FolderOpen } from 'lucide-react';
import { AdminLayout } from './AdminLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Select } from '../../components/ui/Select';
import api from '../../services/api';
import type { Category } from '../../services/types';

export function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ordering, setOrdering] = useState('name');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent: '',
    is_active: true
  });

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getAdminCategories({ 
        search: search || undefined, 
        ordering 
      });
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  }, [search, ordering]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchCategories();
    }, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  useEffect(() => {
    fetchCategories();
  }, [ordering, fetchCategories]);

  const toggleExpand = (id: number) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(String(id))) {
        next.delete(String(id));
      } else {
        next.add(String(id));
      }
      return next;
    });
  };

  const getChildren = (parentId: number | null): Category[] => {
    return categories.filter(c => c.parent === parentId);
  };

  const hasChildren = (categoryId: number): boolean => {
    return categories.some(c => c.parent === categoryId);
  };

  const getLevel = (category: Category): number => {
    let level = 0;
    let current = category;
    while (current.parent) {
      level++;
      const parent = categories.find(c => c.id === current.parent);
      if (!parent) break;
      current = parent;
    }
    return level;
  };

  const flattenCategories = (parentId: number | null = null): Category[] => {
    const children = getChildren(parentId);
    const result: Category[] = [];
    for (const child of children) {
      result.push(child);
      if (expandedCategories.has(String(child.id))) {
        result.push(...flattenCategories(child.id));
      }
    }
    return result;
  };

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        parent: category.parent?.toString() || '',
        is_active: category.is_active
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        parent: '',
        is_active: true
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        name: formData.name,
        description: formData.description,
        parent: formData.parent ? parseInt(formData.parent) : null,
        is_active: formData.is_active
      };

      if (editingCategory) {
        await api.updateCategory(editingCategory.id, data);
      } else {
        await api.createCategory(data);
      }

      setShowModal(false);
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Error al guardar categoría');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta categoría?')) return;
    try {
      await api.deleteCategory(id);
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const handleToggleActive = async (category: Category) => {
    try {
      await api.updateCategory(category.id, { is_active: !category.is_active });
      fetchCategories();
    } catch (error) {
      console.error('Error toggling category:', error);
    }
  };

  const rootCategories = getChildren(null);
  const flatCategories = flattenCategories(null);
  const availableParents = categories.filter(c => 
    c.id !== editingCategory?.id
  );

  if (loading && categories.length === 0) {
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
        <h1 className="text-2xl font-bold">Categorías</h1>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Categoría
        </Button>
      </div>

      <div className="flex gap-4 mb-4 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar categorías..."
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
          <option value="name">Nombre (A-Z)</option>
          <option value="-name">Nombre (Z-A)</option>
          <option value="-created_at">Más recientes</option>
          <option value="created_at">Más antiguos</option>
        </Select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 w-8"></th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Nombre</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Descripción</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Nivel</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Productos</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Estado</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {flatCategories.map(category => {
              const level = getLevel(category);
              const isExpanded = expandedCategories.has(String(category.id));
              const hasKids = hasChildren(category.id);
              
              return (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {hasKids && (
                      <button
                        onClick={() => toggleExpand(category.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        {isExpanded ? (
                          <ChevronLeft className="h-4 w-4" />
                        ) : (
                          <Folder className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 24}px` }}>
                      {isExpanded ? (
                        <FolderOpen className="h-5 w-5 text-blue-500" />
                      ) : (
                        <Folder className="h-5 w-5 text-gray-400" />
                      )}
                      <span className="font-medium">{category.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{category.description || '-'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-800">
                      {level === 0 ? 'Raíz' : `Nivel ${level + 1}`}
                    </span>
                  </td>
                  <td className="px-4 py-3">{category.products_count}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(category)}
                      className={`text-xs px-2 py-1 rounded cursor-pointer ${
                        category.is_active 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {category.is_active ? 'Activa' : 'Inactiva'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenModal(category)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(category.id)} className="text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold">
                {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Descripción</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="parent">Categoría padre</Label>
                <Select
                  id="parent"
                  value={formData.parent}
                  onChange={e => setFormData({ ...formData, parent: e.target.value })}
                >
                  <option value="">Raíz (sin padre)</option>
                  {availableParents.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Deja vacío para crear una categoría raíz
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="is_active"
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="is_active">Categoría activa</Label>
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingCategory ? 'Guardar' : 'Crear'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
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
