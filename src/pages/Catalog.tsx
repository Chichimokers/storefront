import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { ProductGrid } from '../../components/product/ProductGrid';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import api from '../../services/api';
import type { Product, Category } from '../../services/types';

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [categoryId, setCategoryId] = useState<number | null>(
    searchParams.get('category') ? parseInt(searchParams.get('category')!) : null
  );
  const [ordering, setOrdering] = useState(searchParams.get('ordering') || '');

  useEffect(() => {
    api.getCategories().then(setCategories).catch(console.error);
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params: Parameters<typeof api.getProducts>[0] = {
          page: currentPage,
        };

        if (search) params.search = search;
        if (categoryId) params.category = categoryId;
        if (ordering) params.ordering = ordering;

        const response = await api.getProducts(params);
        setProducts(response.results);
        setTotalPages(Math.ceil(response.count / 20));
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [currentPage, search, categoryId, ordering]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (categoryId) params.set('category', categoryId.toString());
    if (ordering) params.set('ordering', ordering);
    setSearchParams(params);
  };

  const selectedCategory = categories.find(c => c.id === categoryId);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">
          {selectedCategory ? selectedCategory.name : 'Todos los Productos'}
        </h1>

        <div className="flex flex-col md:flex-row gap-8">
          <aside className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="font-medium mb-4">Filtros</h3>
              
              <form onSubmit={handleSearch} className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Buscar</label>
                  <Input
                    type="text"
                    placeholder="Buscar productos..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Categoría</label>
                  <Select
                    value={categoryId || ''}
                    onChange={e => setCategoryId(e.target.value ? parseInt(e.target.value) : null)}
                  >
                    <option value="">Todas las categorías</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Ordenar por</label>
                  <Select value={ordering} onChange={e => setOrdering(e.target.value)}>
                    <option value="">Más recientes</option>
                    <option value="price">Precio: menor a mayor</option>
                    <option value="-price">Precio: mayor a menor</option>
                    <option value="name">Nombre: A-Z</option>
                    <option value="-name">Nombre: Z-A</option>
                  </Select>
                </div>

                <Button type="submit" className="w-full">
                  Aplicar Filtros
                </Button>

                {(search || categoryId || ordering) && (
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    onClick={() => {
                      setSearch('');
                      setCategoryId(null);
                      setOrdering('');
                      setSearchParams({});
                      setCurrentPage(1);
                    }}
                  >
                    Limpiar Filtros
                  </Button>
                )}
              </form>
            </div>
          </aside>

          <div className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                <ProductGrid products={products} />

                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => p - 1)}
                    >
                      Anterior
                    </Button>
                    <span className="flex items-center px-4">
                      Página {currentPage} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => p + 1)}
                    >
                      Siguiente
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
