import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Package } from 'lucide-react'
import { useCompanySettings } from '../contexts/CompanySettingsContext'

interface Product {
  id: string
  name: string
  description: string
  image_url?: string
  price: number
  featured: boolean
}

export function Home() {
  const { settings } = useCompanySettings()
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFeaturedProducts()
  }, [])

  const loadFeaturedProducts = async () => {
    try {
      setLoading(true)

      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('featured', true)
        .eq('active', true)
        .order('name')

      if (productsError) throw productsError

      setFeaturedProducts(products || [])
    } catch (error) {
      console.error('Error loading featured products:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Featured Products */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Produtos em Destaque</h2>
        {featuredProducts.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">Nenhum produto em destaque</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-48 object-cover group-hover:opacity-90 transition-opacity"
                    />
                  ) : (
                    <div className="w-full h-48 flex items-center justify-center bg-gray-100">
                      <Package className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                    {product.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                    {product.description}
                  </p>
                  {settings?.show_prices && (
                    <p className="mt-2 text-lg font-bold text-gray-900">
                      R$ {product.price.toFixed(2)}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}