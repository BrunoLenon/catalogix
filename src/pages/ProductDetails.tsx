import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Package, ArrowLeft, ShoppingCart } from 'lucide-react'
import { useCompanySettings } from '../contexts/CompanySettingsContext'
import { ImageModal } from '../components/ImageModal'

interface Product {
  id: string
  code: string
  name: string
  description: string
  image_url?: string
  price: number
  active: boolean
}

export function ProductDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { settings } = useCompanySettings()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [showImageModal, setShowImageModal] = useState(false)
  const [notification, setNotification] = useState<{show: boolean, message: string}>({
    show: false,
    message: ''
  })

  useEffect(() => {
    loadProduct()
  }, [id])

  const loadProduct = async () => {
    try {
      setLoading(true)
      setError('')

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      setProduct(data)
    } catch (error: any) {
      console.error('Error loading product:', error)
      setError('Erro ao carregar produto')
    } finally {
      setLoading(false)
    }
  }

  const handleQuantityChange = (value: string) => {
    const newQuantity = parseInt(value)
    if (isNaN(newQuantity) || newQuantity < 1) return
    setQuantity(newQuantity)
  }

  const showNotification = (message: string) => {
    setNotification({ show: true, message })
    setTimeout(() => {
      setNotification({ show: false, message: '' })
    }, 3000)
  }

  const addToCart = async () => {
    if (!product) return

    try {
      const userId = (await supabase.auth.getUser()).data.user?.id
      if (!userId) {
        setError('Você precisa estar logado para adicionar itens ao carrinho')
        return
      }

      // Check if product is already in cart
      const { data: existingItems, error: queryError } = await supabase
        .from('cart_items')
        .select('quantity')
        .eq('user_id', userId)
        .eq('product_id', product.id)

      if (queryError) throw queryError

      const existingQuantity = existingItems?.[0]?.quantity || 0
      const totalQuantity = existingQuantity + quantity

      const { error: upsertError } = await supabase
        .from('cart_items')
        .upsert({
          user_id: userId,
          product_id: product.id,
          quantity: totalQuantity
        }, {
          onConflict: 'user_id,product_id'
        })

      if (upsertError) throw upsertError

      showNotification('Produto adicionado ao carrinho!')
      setQuantity(1) // Reset quantity after adding to cart
    } catch (error: any) {
      console.error('Error adding to cart:', error)
      setError('Erro ao adicionar item ao carrinho')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Produto não encontrado</h3>
          <button
            onClick={() => navigate('/products')}
            className="mt-4 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar para produtos
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/products')}
        className="mb-6 inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Voltar para produtos
      </button>

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

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="md:flex">
          <div className="md:flex-shrink-0 md:w-1/2">
            {product.image_url ? (
              <div 
                className="relative cursor-pointer group"
                onClick={() => setShowImageModal(true)}
              >
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-96 object-contain bg-gray-50 group-hover:opacity-90 transition-opacity"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all">
                  <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    Clique para ampliar
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-full h-96 flex items-center justify-center bg-gray-100">
                <Package className="h-24 w-24 text-gray-400" />
              </div>
            )}
          </div>
          <div className="p-8 md:w-1/2">
            <div className="uppercase tracking-wide text-sm text-blue-600 font-semibold">
              {product.code}
            </div>
            <h1 className="mt-2 text-3xl font-bold text-gray-900">
              {product.name}
            </h1>
            <div className="mt-4 prose prose-sm text-gray-500">
              {product.description}
            </div>
            {settings?.show_prices && (
              <div className="mt-4 text-2xl font-bold text-gray-900">
                R$ {product.price.toFixed(2)}
              </div>
            )}

            <div className="mt-8">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label htmlFor="quantity" className="text-sm font-medium text-gray-700">
                    Quantidade:
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    min="1"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    className="w-20 px-2 py-1 text-center border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-500">unid.</span>
                </div>
                <button
                  onClick={addToCart}
                  className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Adicionar ao Carrinho
                </button>
              </div>
              {settings?.show_prices && (
                <div className="mt-4 text-sm text-gray-500">
                  Total: R$ {(product.price * quantity).toFixed(2)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && product.image_url && (
        <ImageModal
          src={product.image_url}
          alt={product.name}
          onClose={() => setShowImageModal(false)}
        />
      )}
    </div>
  )
}