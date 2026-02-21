import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white text-lg font-bold mb-4">Tienda Online</h3>
            <p className="text-sm">
              Tu tienda de confianza para productos de calidad.
            </p>
          </div>

          <div>
            <h4 className="text-white font-medium mb-4">Categorías</h4>
            <ul className="space-y-2">
              <li><Link to="/products" className="text-sm hover:text-white">Electrónica</Link></li>
              <li><Link to="/products" className="text-sm hover:text-white">Ropa</Link></li>
              <li><Link to="/products" className="text-sm hover:text-white">Hogar</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-medium mb-4">Cuenta</h4>
            <ul className="space-y-2">
              <li><Link to="/login" className="text-sm hover:text-white">Iniciar Sesión</Link></li>
              <li><Link to="/register" className="text-sm hover:text-white">Registrarse</Link></li>
              <li><Link to="/orders" className="text-sm hover:text-white">Mis Pedidos</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-medium mb-4">Contacto</h4>
            <p className="text-sm">Email: info@tienda.com</p>
            <p className="text-sm">Teléfono: +53 5 123 4567</p>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Tienda Online. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
