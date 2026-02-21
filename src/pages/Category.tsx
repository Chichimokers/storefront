import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { ProductGrid } from '../components/product/ProductGrid';
import { Button } from '../components/ui/Button';
import api from '../services/api';
import type { Product, Category } from '../services/types';

export function CategoryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        const [allCategories, productsData] = await Promise.all([
          api.getCategories(),
          api.getProducts({ category: parseInt(id), page: 1 })
        ]);
        
        const safeCategories = Array.isArray(allCategories) 
          ? allCategories 
          : (allCategories as unknown as { results?: Category[] })?.results || [];
        
        const categoryData = safeCategories.find(c => c.id === parseInt(id));
        
        const safeProducts = productsData && typeof productsData === 'object' && 'results' in productsData
          ? (productsData as unknown as { results: Product[] }).results
          : Array.isArray(productsData) ? productsData : [];

        setCategory(categoryData || null);
        setProducts(safeProducts);
        
        const total = productsData && typeof productsData === 'object' && 'count' in productsData
          ? (productsData as unknown as { count: number }).count
          : safeProducts.length;
        setTotalPages(Math.ceil(total / 20));
      } catch (error) {
        console.error('Error fetching category:', error);
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!id) return;
      
      try {
        const response = await api.getProducts({ 
          category: parseInt(id), 
          page: currentPage 
        });
        setProducts(response.results);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, [id, currentPage]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!category) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <p>Categoría no encontrada</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </button>

        <h1 className="text-3xl font-bold mb-2">{category.name}</h1>
        {category.description && (
          <p className="text-gray-600 mb-8">{category.description}</p>
        )}

        {category.subcategories && category.subcategories.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-medium mb-4">Subcategorías</h2>
            <div className="flex flex-wrap gap-2">
              {category.subcategories.map(sub => (
                <Link key={sub.id} to={`/products?subcategory=${sub.id}`}>
                  <Button variant="outline" size="sm">
                    {sub.name}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        )}

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
      </div>
    </Layout>
  );
}
