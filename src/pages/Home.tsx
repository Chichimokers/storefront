import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { ProductGrid } from '../components/product/ProductGrid';
import api from '../services/api';
import type { Product, Category } from '../services/types';

const API_BASE_URL = 'https://inventory.cloduns.be';

export function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featured, recent, cats] = await Promise.all([
          api.getFeaturedProducts(),
          api.getProducts({ ordering: '-created_at', page: 1 }),
          api.getCategories()
        ]);
        setFeaturedProducts(featured);
        setRecentProducts(recent.results.slice(0, 8));
        setCategories(cats.slice(0, 6));
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Bienvenido a Nuestra Tienda
          </h1>
          <p className="text-xl mb-8 text-blue-100">
            Encuentra los mejores productos al mejor precio
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors"
          >
            Ver Productos
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">Categorías</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map(category => (
              <Link
                key={category.id}
                to={`/category/${category.id}`}
                className="group"
              >
                <div className="border border-gray-200 rounded-lg p-4 text-center hover:shadow-lg transition-shadow">
                  {category.image && (
                    <img
                      src={`${API_BASE_URL}${category.image}`}
                      alt={category.name}
                      className="w-16 h-16 mx-auto mb-2 object-cover rounded-full"
                    />
                  )}
                  <h3 className="font-medium text-gray-900 group-hover:text-blue-600">
                    {category.name}
                  </h3>
                  <p className="text-xs text-gray-500">{category.products_count} productos</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {featuredProducts.length > 0 && (
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Productos Destacados</h2>
              <Link to="/products?featured=true" className="text-blue-600 hover:underline">
                Ver todos
              </Link>
            </div>
            <ProductGrid products={featuredProducts.slice(0, 4)} />
          </div>
        </section>
      )}

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">Productos Recientes</h2>
            <Link to="/products?ordering=-created_at" className="text-blue-600 hover:underline">
              Ver todos
            </Link>
          </div>
          <ProductGrid products={recentProducts} />
        </div>
      </section>
    </Layout>
  );
}
