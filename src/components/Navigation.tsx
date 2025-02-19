import { Link } from 'react-router-dom'
import { ShoppingCart, LogOut, Menu, Settings, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCompanySettings } from '../contexts/CompanySettingsContext'
import { useState } from 'react'
import { ProductSearch } from './ProductSearch'

export function Navigation() {
  const { signOut, isAdmin } = useAuth()
  const { settings } = useCompanySettings()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  return (
    <nav className="relative">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              {settings?.logo_url ? (
                <img
                  src={settings.logo_url}
                  alt={settings.name}
                  className="h-8 w-auto object-contain"
                />
              ) : null}
              <span className="text-lg font-bold text-gray-900 truncate max-w-[150px] md:max-w-none">
                {settings?.name || 'LOGO'}
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <div className="flex space-x-4">
              <Link to="/products" className="text-gray-700 hover:text-gray-900">
                Produtos
              </Link>
              <Link to="/categories" className="text-gray-700 hover:text-gray-900">
                Categorias
              </Link>
              {isAdmin() && (
                <>
                  <Link to="/admin" className="text-gray-700 hover:text-gray-900">
                    Admin
                  </Link>
                  <Link to="/admin/settings" className="text-gray-700 hover:text-gray-900">
                    <Settings className="h-5 w-5" />
                  </Link>
                </>
              )}
            </div>
            <ProductSearch />
            <div className="flex items-center space-x-2">
              <Link 
                to="/cart" 
                className="text-gray-700 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100 transition-colors"
                title="Carrinho"
              >
                <ShoppingCart className="h-6 w-6" />
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-700 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100 transition-colors"
                title="Sair"
              >
                <LogOut className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <Link 
              to="/cart" 
              className="text-gray-700 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100 transition-colors"
              title="Carrinho"
            >
              <ShoppingCart className="h-6 w-6" />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg z-50 animate-fade-in-up">
          <div className="px-4 pt-2 pb-3 space-y-1 border-t">
            <div className="px-3 py-2">
              <ProductSearch />
            </div>
            <Link
              to="/products"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              Produtos
            </Link>
            <Link
              to="/categories"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              Categorias
            </Link>
            {isAdmin() && (
              <>
                <Link
                  to="/admin"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin
                </Link>
                <Link
                  to="/admin/settings"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Configurações
                </Link>
              </>
            )}
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
            >
              Sair
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}