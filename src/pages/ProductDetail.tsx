import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, Minus, Plus, ArrowLeft } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { ProductGallery } from '../../components/product/ProductGallery';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useCart } from '../../context/CartContext';
import api from '../../services/api';
import type { Product } from '../../services/types';

const API_BASE_URL = 'https://inventory.cloduns.be';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        const data = await api.getProduct(parseInt(id));
        setProduct(data);
      } catch (error) {
        console.error('Error fetching product:', error);
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, navigate]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      quantity,
      image: product.main_image?.image 
        ? `${API_BASE_URL}${product.main_image.image}`
        : null,
      maxStock: product.stock
    });
    setQuantity(1);
  };

  const handleBuyNow = () => {
    if (!product) return;
    addItem({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      quantity,
      image: product.main_image?.image 
        ? `${API_BASE_URL}${product.main_image.image}`
        : null,
      maxStock: product.stock
    });
    navigate('/checkout');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <p>Producto no encontrado</p>
        </div>
      </Layout>
    );
  }

  const images = product.images?.length > 0 
    ? product.images 
    : product.main_image ? [product.main_image] : [];

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ProductGallery images={images} />

          <div>
            <p className="text-sm text-gray-500 mb-2">
              {product.category?.name}
              {product.subcategory && ` / ${product.subcategory.name}`}
            </p>
            <h1 className="text-3xl font-bold mb-4">{product.name}</h1>

            <div className="flex items-center gap-4 mb-6">
              <span className="text-3xl font-bold text-blue-600">
                ${product.price}
              </span>
              {product.compare_price && parseFloat(product.compare_price) > parseFloat(product.price) && (
                <span className="text-xl text-gray-500 line-through">
                  ${product.compare_price}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mb-6">
              {product.stock > 0 ? (
                <Badge variant="success">{product.stock} disponibles</Badge>
              ) : (
                <Badge variant="destructive">Sin stock</Badge>
              )}
            </div>

            <p className="text-gray-700 mb-8">{product.description}</p>

            <div className="flex items-center gap-4 mb-6">
              <label className="text-sm font-medium">Cantidad:</label>
              <div className="flex items-center border border-gray-300 rounded-md">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="p-2 hover:bg-gray-100"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-4">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                  className="p-2 hover:bg-gray-100"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Agregar al Carrito
              </Button>
              <Button
                onClick={handleBuyNow}
                disabled={product.stock === 0}
                variant="secondary"
                className="flex-1"
              >
                Comprar Ahora
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
