import { useState, useEffect, useCallback, useRef } from 'react';
import { Upload, Trash2, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { AdminLayout } from './AdminLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import api, { getMediaUrl } from '../../services/api';

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

export function AdminImages() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [uploadingNew, setUploadingNew] = useState(false);
  const isFirstLoad = useRef(true);

  const itemsPerPage = 20;

  const fetchImages = useCallback(async (pageNum: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAdminImages({ page: pageNum });
      const imageList = data?.results || [];
      setImages(imageList);
      setTotalCount(data.count);
      
      if (imageList.length === 0 && data.count > 0 && pageNum > 1) {
        const lastPage = Math.ceil(data.count / itemsPerPage);
        if (lastPage > 0) {
          setPage(lastPage);
        }
      }
    } catch (err) {
      console.error('Error fetching images:', err);
      setError('Error al cargar imágenes');
      setImages([]);
    } finally {
      setLoading(false);
      isFirstLoad.current = false;
    }
  }, []);

  useEffect(() => {
    fetchImages(page);
  }, [page]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setUploading(true);
    try {
      await api.uploadImage(selectedFile);
      setSelectedFile(null);
      fetchImages(page);
      alert('Imagen subida correctamente');
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error al subir imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta imagen?')) return;
    try {
      await api.deleteImage(id);
      fetchImages(page);
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  const copyImageUrl = (url: string) => {
    const fullUrl = getMediaUrl(url);
    navigator.clipboard.writeText(fullUrl || url);
    alert('URL copiada al portapapeles');
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">Imágenes</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Subir nueva imagen</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="image">Archivo</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
            />
          </div>
          <Button onClick={handleUpload} disabled={!selectedFile || uploading}>
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Subiendo...' : 'Subir Imagen'}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Imágenes ({totalCount})</h2>
          <p className="text-sm text-gray-500">
            Página {page} de {totalPages}
          </p>
        </div>
        {error && (
          <div className="p-4 bg-red-100 text-red-700 text-center">
            {error}
          </div>
        )}
        {!error && loading ? (
          <div className="p-8 text-center text-gray-500">
            Cargando...
          </div>
        ) : !error && images.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay imágenes disponibles</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
              {images.map(image => (
                <div key={image.id} className="relative group border rounded-lg overflow-hidden">
                  <img
                    src={getMediaUrl(image.image) ?? '/placeholder.png'}
                    alt={image.alt_text || 'Imagen'}
                    className="w-full h-32 object-cover"
                  />
                  <div className="p-2 bg-gray-50">
                    <p className="text-xs text-gray-500">ID: {image.id}</p>
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(image.id)}
                      className="w-full"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Eliminar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyImageUrl(image.image)}
                      className="w-full bg-white text-gray-800 hover:bg-gray-100"
                    >
                      Copiar URL
                    </Button>
                  </div>
                  {image.is_primary && (
                    <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                      Principal
                    </span>
                  )}
                </div>
              ))}
            </div>
            
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t">
                <p className="text-sm text-gray-500">
                  {totalCount} imágenes • Página {page} de {totalPages}
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
          </>
        )}
      </div>
    </AdminLayout>
  );
}
