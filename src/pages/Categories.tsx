import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { LayoutGrid, Package } from 'lucide-react'
import { Link } from 'react-router-dom'

interface Category {
  id: string
  name: string
  description: string
  featured: boolean
  products: {
    id: string
    name: string
    image_url?: string
  }[]
}

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      setError('')

      const { data, error } = await supabase
        .from('categories')
        .select(`
          *,
          products (
            id,
            name,
            image_url
          )
        `)
        .order('name')

      if (error) throw error

      setCategories(data || [])
    } catch (error: any) {
      console.error('Error loading categories:', error)
      setError('Erro ao carregar categorias')
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

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <LayoutGrid className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Sem categorias</h3>
          <p className="mt-1 text-sm text-gray-500">
            Não há categorias disponíveis no momento.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Categorias</h1>
        <p className="mt-2 text-gray-600">
          Explore nossos produtos por categoria
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div
            key={category.id}
            className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="aspect-w-16 aspect-h-9 bg-gray-100">
              {category.products[0]?.image_url ? (
                <img
                  src={category.products[0].image_url}
                  alt={category.name}
                  className="w-full h-48 object-cover group-hover:opacity-90 transition-opacity"
                />
              ) : (
                <div className="w-full h-48 flex items-center justify-center">
                  <Package className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-semibold text-gray-900">
                  {category.name}
                </h3>
                {category.featured && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Destaque
                  </span>
                )}
              </div>

              <p className="text-gray-600 mb-4 line-clamp-2">
                {category.description || 'Sem descrição'}
              </p>

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {category.products.length}{' '}
                  {category.products.length === 1 ? 'produto' : 'produtos'}
                </div>
                <Link
                  to={`/products?category=${category.id}`}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Ver Produtos
                </Link>
              </div>

              {category.products.length > 0 && (
                <div className="mt-4 flex -space-x-2 overflow-hidden">
                  {category.products.slice(0, 5).map((product) => (
                    <div
                      key={product.id}
                      className="inline-block h-8 w-8 rounded-full ring-2 ring-white overflow-hidden bg-gray-100"
                    >
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Package className="h-4 w-4 m-2 text-gray-400" />
                      )}
                    </div>
                  ))}
                  {category.products.length > 5 && (
                    <div className="inline-flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-white bg-gray-100">
                      <span className="text-xs font-medium text-gray-500">
                        +{category.products.length - 5}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}