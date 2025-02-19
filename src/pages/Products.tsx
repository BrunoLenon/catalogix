import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Package, Search, ShoppingCart, ArrowLeft } from 'lucide-react'
import { useCompanySettings } from '../contexts/CompanySettingsContext'

interface Product {
  id: string
  code: string
  name: string
  description: string
  image_url?: string
  price: number
  active: boolean
  barcode?: string
}

interface CartItem {
  productId: string
  quantity: number
}

export function Products() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { settings } = useCompanySettings()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [notification, setNotification] = useState<{show: boolean, message: string}>({
    show: false,
    message: ''
  })
  const [categoryName, setCategoryName] = useState<string>('')

  useEffect(() => {
    loadProducts()
    loadCartItems()
  }, [searchParams])

  const loadProducts = async () => {
    try {
      setLoading(true)
      setError('')

      const searchTerm = searchParams.get('search')?.toLowerCase() || ''
      const categoryId = searchParams.get('category')

      let query = supabase
        .from('products')
        .select('*, categories!inner(name)')
        .eq('active', true)
      
      if (categoryId) {
        query = query.eq('category_id', categoryId)
        
        // Load category name
        const { data: category } = await supabase
          .from('categories')
          .select('name')
          .eq('id', categoryId)
          .single()
        
        if (category) {
          setCategoryName(category.name)
        }
      }
      
      if (searchTerm) {
        query = query.or(`code.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      }

      const { data, error } = await query.order('name')

      if (error) throw error

      setProducts(data || [])
      
      // Initialize quantities
      const initialQuantities: Record<string, number> = {}
      data?.forEach(product => {
        initialQuantities[product.id] = 1
      })
      setQuantities(initialQuantities)
    } catch (error: any) {
      console.error('Error loading products:', error)
      setError('Erro ao carregar produtos')
    } finally {
      setLoading(false)
    }
  }

  const loadCartItems = async () => {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)

      if (error) throw error

      setCartItems(data?.map(item => ({
        productId: item.product_id,
        quantity: item.quantity
      })) || [])
    } catch (error: any) {
      console.error('Error loading cart items:', error)
    }
  }

  const handleQuantityChange = (productId: string, value: string) => {
    const quantity = parseInt(value)
    if (isNaN(quantity) || quantity < 1) return

    setQuantities(prev => ({
      ...prev,
      [productId]: quantity
    }))
  }

  const showNotification = (message: string) => {
    setNotification({ show: true, message })
    setTimeout(() => {
      setNotification({ show: false, message: '' })
    }, 3000)
  }

  const addToCart = async (productId: string) => {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id
      if (!userId) {
        setError('Você precisa estar logado para adicionar itens ao carrinho')
        return
      }

      const quantity = quantities[productId] || 1
      const existingItem = cartItems.find(item => item.productId === productId)
      const totalQuantity = existingItem ? existingItem.quantity + quantity : quantity

      const { error } = await supabase
        .from('cart_items')
        .upsert({
          user_id: userId,
          product_id: productId,
          quantity: totalQuantity
        }, {
          onConflict: 'user_id,product_id'
        })

      if (error) throw error

      await loadCartItems()
      showNotification('Produto adicionado ao carrinho!')
    } catch (error: any) {
      console.error('Error adding to cart:', error)
      setError('Erro ao adicionar item ao carrinho')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center gap-2">
            {searchParams.get('category') && (
              <button
                onClick={() => navigate('/categories')}
                className="inline-flex items-center text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <h1 className="text-3xl font-bold text-gray-900">
              {categoryName || 'Produtos'}
            </h1>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {categoryName ? `Produtos da categoria ${categoryName}` : 'Explore nosso catálogo de produtos'}
          </p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar produtos..."
            className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            value={searchParams.get('search') || ''}
            onChange={(e) => {
              const search = e.target.value
              const newSearchParams = new URLSearchParams(searchParams)
              if (search) {
                newSearchParams.set('search', search)
              } else {
                newSearchParams.delete('search')
              }
              navigate({ search: newSearchParams.toString() })
            }}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification.show && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in-up">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5" />
            <p>{notification.message}</p>
          </div>
        </div>
      )}

      {products.length === 0 ? (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum produto encontrado</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchParams.get('search')
              ? 'Tente buscar por outros termos'
              : categoryName
                ? `Não há produtos cadastrados na categoria ${categoryName}`
                : 'Não há produtos cadastrados'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => {
            const cartItem = cartItems.find(item => item.productId === product.id)
            return (
              <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div 
                  className="aspect-w-16 aspect-h-9 bg-gray-200 cursor-pointer"
                  onClick={() => navigate(`/products/${product.id}`)}
                >
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 flex items-center justify-center bg-gray-100">
                      <Package className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 
                    className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-blue-600"
                    onClick={() => navigate(`/products/${product.id}`)}
                  >
                    {product.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">{product.description}</p>
                  {settings?.show_prices && (
                    <div className="mt-2 text-lg font-bold text-gray-900">
                      R$ {product.price.toFixed(2)}
                    </div>
                  )}
                  {cartItem && (
                    <p className="mt-1 text-sm text-blue-600">
                      {cartItem.quantity} {cartItem.quantity === 1 ? 'item' : 'itens'} no carrinho
                    </p>
                  )}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="1"
                        value={quantities[product.id] || 1}
                        onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                        className="w-16 px-2 py-1 text-center border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-500">unid.</span>
                    </div>
                    <button
                      onClick={() => addToCart(product.id)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Adicionar
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}