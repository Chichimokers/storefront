import { useState } from 'react';

const API_BASE_URL = 'https://inventory.cloudns.be';

interface ProductGalleryProps {
  images: { id: number; image: string; is_primary: boolean }[];
}

export function ProductGallery({ images }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Sin imagen</p>
      </div>
    );
  }

  const selectedImage = images[selectedIndex];
  const mainImageUrl = selectedImage ? `${API_BASE_URL}${selectedImage.image}` : '/placeholder.png';

  return (
    <div className="space-y-4">
      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
        <img
          src={mainImageUrl}
          alt="Producto"
          className="w-full h-full object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedIndex(index)}
              className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 ${
                index === selectedIndex ? 'border-blue-600' : 'border-gray-200'
              }`}
            >
              <img
                src={`${API_BASE_URL}${image.image}`}
                alt={`Imagen ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
