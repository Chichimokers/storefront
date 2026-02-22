import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Pencil, Trash2, Search, X, ChevronLeft, ChevronRight, Upload, Check, Image as ImageIcon } from 'lucide-react';
import { AdminLayout } from './AdminLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Select } from '../../components/ui/Select';
import api, { getMediaUrl } from '../../services/api';
import type { Product, Category } from '../../services/types';

interface ProductsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Product[];
}

interface UploadedImage {
  id: number;
  image: string;
  alt_text: string;
  is_primary: boolean;
  created_at: string;
}

interface ImagesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: UploadedImage[];
}

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [ordering, setOrdering] = useState('-created_at');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const isFirstLoad = useRef(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    compare_price: '',
    stock: '',
    category: '',
    subcategory: '',
    is_active: true,
    image_ids: [] as number[]
  });

  const [showImageModal, setShowImageModal] = useState(false);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [imagePage, setImagePage] = useState(1);
  const [totalImages, setTotalImages] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const itemsPerPage = 10;

  const fetchData = useCallback(async (pageNum: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        search: search || undefined,
        category: categoryFilter ? parseInt(categoryFilter) : undefined,
        ordering,
        page: pageNum
      };
      
      const [productsData, categoriesData] = await Promise.all([
        api.getAdminProducts(params),
        api.getAdminCategories()
      ]);
      
      const productsRes = productsData as ProductsResponse;
      setProducts(productsRes.results || []);
      setTotalCount(productsRes.count);
      setCategories(categoriesData || []);
      
      if (productsRes.results.length === 0 && productsRes.count > 0 && pageNum > 1) {
        const lastPage = Math.ceil(productsRes.count / itemsPerPage);
        if (lastPage > 0) {
          setPage(lastPage);
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setProducts([]);
      setTotalCount(0);
      if (pageNum > 1) {
        setPage(1);
      }
    } finally {
      setLoading(false);
      isFirstLoad.current = false;
    }
  }, [search, categoryFilter, ordering]);

  const fetchImages = useCallback(async (pageNum: number = 1) => {
    setImagesLoading(true);
    try {
      const data = await api.getAdminImages({ page: pageNum });
      setImages(data.results || []);
      setTotalImages(data.count);
    } catch (err) {
      console.error('Error fetching images:', err);
    } finally {
      setImagesLoading(false);
    }
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (!isFirstLoad.current) {
        const filtersChanged = 
          prevFiltersRef.current.search !== search ||
          prevFiltersRef.current.category !== categoryFilter ||
          prevFiltersRef.current.ordering !== ordering;
        
        if (filtersChanged) {
          setPage(1);
          prevFiltersRef.current = { search, category: categoryFilter, ordering };
        }
      }
      fetchData(1);
    }, 300);
    return () => clearTimeout(debounce);
  }, [search, categoryFilter, ordering]);

  useEffect(() => {
    fetchData(page);
  }, [page]);

  const prevFiltersRef = useRef({ search: '', category: '', ordering: '' });

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const openImageModal = () => {
    setImagePage(1);
    fetchImages(1);
    setShowImageModal(true);
  };

  const handleUploadImageInModal = async () => {
    if (!selectedFile) return;
    setUploadingImage(true);
    try {
      const uploaded = await api.uploadImage(selectedFile);
      setFormData(prev => ({
        ...prev,
        image_ids: [...prev.image_ids, uploaded.id]
      }));
      setSelectedFile(null);
      fetchImages(imagePage);
    } catch (err) {
      console.error('Error uploading:', err);
      alert('Error al subir imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  const toggleImageSelection = (imageId: number) => {
    setFormData(prev => ({
      ...prev,
      image_ids: prev.image_ids.includes(imageId)
        ? prev.image_ids.filter(id => id !== imageId)
        : [...prev.image_ids, imageId]
    }));
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      const productImageIds = product.images?.map(img => img.id) || [];
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        compare_price: product.compare_price || '',
        stock: product.stock.toString(),
        category: product.category?.id?.toString() || '',
        subcategory: product.subcategory?.id?.toString() || '',
        is_active: product.is_active,
        image_ids: productImageIds
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        compare_price: '',
        stock: '',
        category: '',
        subcategory: '',
        is_active: true,
        image_ids: []
      });
    }
    setShowModal(true);
    fetchImages(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        compare_price: formData.compare_price ? parseFloat(formData.compare_price) : null,
        stock: parseInt(formData.stock),
        category: formData.category ? parseInt(formData.category) : null,
        subcategory: formData.subcategory ? parseInt(formData.subcategory) : null,
        is_active: formData.is_active,
        image_ids: formData.image_ids.length > 0 ? formData.image_ids : undefined
      };

      if (editingProduct) {
        await api.updateProduct(editingProduct.id, data);
      } else {
        await api.createProduct(data);
      }

      setShowModal(false);
      fetchData(page);
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error al guardar producto');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;
    try {
      await api.deleteProduct(id);
      fetchData(page);
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      await api.updateProduct(product.id, { is_active: !product.is_active });
      fetchData(page);
    } catch (error) {
      console.error('Error toggling product:', error);
    }
  };

  const selectedCategory = categories.find(c => c.id === parseInt(formData.category));

  if (loading && products.length === 0) {
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
        <h1 className="text-2xl font-bold">Productos</h1>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Producto
        </Button>
      </div>

      <div className="flex gap-4 mb-4 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar productos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="w-48"
        >
          <option value="">Todas las categorías</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </Select>
        <Select
          value={ordering}
          onChange={e => setOrdering(e.target.value)}
          className="w-48"
        >
          <option value="-created_at">Más recientes</option>
          <option value="created_at">Más antiguos</option>
          <option value="name">Nombre (A-Z)</option>
          <option value="-name">Nombre (Z-A)</option>
          <option value="price">Precio (menor)</option>
          <option value="-price">Precio (mayor)</option>
          <option value="stock">Stock (menor)</option>
          <option value="-stock">Stock (mayor)</option>
        </Select>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Imagen</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Nombre</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Categoría</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Precio</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Stock</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Estado</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading && products.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  Cargando...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No se encontraron productos
                </td>
              </tr>
            ) : (
              products.map(product => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {product.main_image && (
                      <img 
                        src={getMediaUrl(product.main_image.image) ?? '/placeholder.png'} 
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{product.name}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {product.category?.name || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium">${product.price}</span>
                    {product.compare_price && product.compare_price !== product.price && (
                      <span className="ml-2 text-sm text-gray-400 line-through">
                        ${product.compare_price}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={product.stock === 0 ? 'text-red-600 font-medium' : ''}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(product)}
                      className={`text-xs px-2 py-1 rounded cursor-pointer ${
                        product.is_active 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {product.is_active ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleOpenModal(product)} className="mr-2">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(product.id)} className="text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
            {totalCount} producto{totalCount !== 1 ? 's' : ''} • Página {page} de {totalPages}
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
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold">
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Precio</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="compare_price">Precio anterior</Label>
                  <Input
                    id="compare_price"
                    type="number"
                    step="0.01"
                    value={formData.compare_price}
                    onChange={e => setFormData({ ...formData, compare_price: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={e => setFormData({ ...formData, stock: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Categoría</Label>
                  <Select
                    id="category"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value, subcategory: '' })}
                  >
                    <option value="">Sin categoría</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </Select>
                </div>
              </div>
              {selectedCategory && selectedCategory.subcategories && selectedCategory.subcategories.length > 0 && (
                <div>
                  <Label htmlFor="subcategory">Subcategoría</Label>
                  <Select
                    id="subcategory"
                    value={formData.subcategory}
                    onChange={e => setFormData({ ...formData, subcategory: e.target.value })}
                  >
                    <option value="">Sin subcategoría</option>
                    {selectedCategory.subcategories.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </Select>
                </div>
              )}
              
              <div>
                <Label>Imágenes del producto</Label>
                <div className="mt-2">
                  {formData.image_ids.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.image_ids.map(imgId => {
                        const img = images.find(i => i.id === imgId);
                        return (
                          <div key={imgId} className="relative group">
                            <img 
                              src={img ? getMediaUrl(img.image) : `/placeholder.png`}
                              alt=""
                              className="w-16 h-16 object-cover rounded border-2 border-green-500"
                            />
                            <button
                              type="button"
                              onClick={() => toggleImageSelection(imgId)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                            >
                              ×
                            </button>
                            <span className="absolute -bottom-2 -left-2 bg-gray-800 text-white text-xs px-1 rounded">
                              ID: {imgId}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={openImageModal}
                    className="w-full"
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    {formData.image_ids.length > 0 ? 'Cambiar imágenes' : 'Seleccionar imágenes'}
                  </Button>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.image_ids.length} imagen(es) seleccionada(s)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="is_active"
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="is_active">Producto activo</Label>
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingProduct ? 'Guardar' : 'Crear'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showImageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold">Seleccionar Imágenes</h2>
              <button onClick={() => setShowImageModal(false)} className="text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 border-b bg-gray-50">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="uploadImage">Subir nueva imagen</Label>
                  <Input
                    id="uploadImage"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                </div>
                <Button 
                  onClick={handleUploadImageInModal}
                  disabled={!selectedFile || uploadingImage}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadingImage ? 'Subiendo...' : 'Subir'}
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {imagesLoading ? (
                <div className="text-center py-8">Cargando...</div>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {images.map(image => {
                    const isSelected = formData.image_ids.includes(image.id);
                    return (
                      <div 
                        key={image.id}
                        onClick={() => toggleImageSelection(image.id)}
                        className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                          isSelected ? 'border-green-500 ring-2 ring-green-300' : 'border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        <img
                          src={getMediaUrl(image.image) ?? '/placeholder.png'}
                          alt={image.alt_text || ''}
                          className="w-full h-24 object-cover"
                        />
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center">
                          ID: {image.id}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 border-t flex justify-between items-center">
              <p className="text-sm text-gray-500">
                {formData.image_ids.length} seleccionada(s)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setImagePage(p => Math.max(1, p - 1));
                    fetchImages(imagePage - 1);
                  }}
                  disabled={imagePage === 1 || imagesLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm py-1">Página {imagePage}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setImagePage(p => p + 1);
                    fetchImages(imagePage + 1);
                  }}
                  disabled={images.length < 20 || imagesLoading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="p-4 border-t">
              <Button onClick={() => setShowImageModal(false)} className="w-full">
                Confirmar selección
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
