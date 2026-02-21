import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { Button } from '../ui/Button';
import { useCart } from '../../context/CartContext';
import type { Product } from '../../services/types';

const API_BASE_URL = 'https://inventory.cloudns.be';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();

  const imageUrl = product.main_image?.image 
    ? `${API_BASE_URL}${product.main_image.image}`
    : '/placeholder.png';

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      quantity: 1,
      image: imageUrl,
      maxStock: product.stock
    });
  };

  return (
    <Link to={`/product/${product.id}`} className="group">
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-lg transition-shadow">
        <div className="aspect-square overflow-hidden bg-gray-100">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        </div>
        <div className="p-4">
          <p className="text-xs text-gray-500 mb-1">{product.category?.name}</p>
          <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg font-bold text-blue-600">${product.price}</span>
            {product.compare_price && parseFloat(product.compare_price) > parseFloat(product.price) && (
              <span className="text-sm text-gray-500 line-through">${product.compare_price}</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {product.stock > 0 ? `${product.stock} disponibles` : 'Sin stock'}
            </span>
            <Button
              size="sm"
              onClick={handleAddToCart}
              disabled={product.stock === 0}
            >
              <ShoppingCart className="h-4 w-4 mr-1" />
              Agregar
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
