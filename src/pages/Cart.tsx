import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { ShoppingCart, Trash2, FileText, Download, Printer, Check, Building2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import * as XLSX from 'xlsx'

interface CartItem {
  id: string
  quantity: number
  product: {
    id: string
    name: string
    code: string
    description: string
    image_url?: string
    price: number
  }
}

interface CompanySettings {
  name: string
  cnpj: string
  address: string
  logo_url: string
}

interface OrderSummary {
  orderNumber: number
  items: CartItem[]
  total: number
  date: string
}

export function Cart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null)
  const [showOrderSummary, setShowOrderSummary] = useState(false)
  const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null)
  const [processingOrder, setProcessingOrder] = useState(false)

  useEffect(() => {
    loadCartItems()
    loadCompanySettings()
  }, [])

  const loadCartItems = async () => {
    try {
      setLoading(true)
      setError('')

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          quantity,
          product:products (
            id,
            name,
            code,
            description,
            image_url,
            price
          )
        `)
        .eq('user_id', user.id)

      if (error) throw error

      setCartItems(data || [])
    } catch (error: any) {
      console.error('Error loading cart items:', error)
      setError('Erro ao carregar itens do carrinho')
    } finally {
      setLoading(false)
    }
  }

  const loadCompanySettings = async () => {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .single()

      if (error) throw error

      setCompanySettings(data)
    } catch (error: any) {
      console.error('Error loading company settings:', error)
    }
  }

  const handleQuantityChange = async (itemId: string, value: string) => {
    const quantity = parseInt(value)
    if (isNaN(quantity) || quantity < 1) return

    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', itemId)

      if (error) throw error

      await loadCartItems()
    } catch (error: any) {
      console.error('Error updating quantity:', error)
      setError('Erro ao atualizar quantidade')
    }
  }

  const removeFromCart = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error

      await loadCartItems()
    } catch (error: any) {
      console.error('Error removing item:', error)
      setError('Erro ao remover item do carrinho')
    }
  }

  const finalizeOrder = async () => {
    try {
      setProcessingOrder(true)
      setError('')

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const total = cartItems.reduce((sum, item) => 
        sum + (item.product.price * item.quantity), 0
      )

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: total,
          status: 'completed'
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.price
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      // Clear cart
      const { error: clearCartError } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)

      if (clearCartError) throw clearCartError

      // Set order summary
      setOrderSummary({
        orderNumber: order.order_number,
        items: cartItems,
        total,
        date: new Date().toLocaleDateString()
      })

      setShowOrderSummary(true)
      setCartItems([])
    } catch (error: any) {
      console.error('Error finalizing order:', error)
      setError('Erro ao finalizar pedido')
    } finally {
      setProcessingOrder(false)
    }
  }

  const exportToExcel = () => {
    if (!companySettings || !orderSummary) return

    const header = [
      ['PEDIDO DE COMPRA'],
      [''],
      ['Número do Pedido:', orderSummary.orderNumber],
      ['Data:', orderSummary.date],
      [''],
      ['Empresa:', companySettings.name],
      ['CNPJ:', companySettings.cnpj],
      ['Endereço:', companySettings.address],
      [''],
      ['ITENS DO PEDIDO'],
      [''],
      ['Código', 'Produto', 'Quantidade', 'Preço Unit.', 'Total']
    ]

    const rows = orderSummary.items.map(item => [
      item.product.code,
      item.product.name,
      item.quantity,
      item.product.price.toFixed(2),
      (item.product.price * item.quantity).toFixed(2)
    ])

    rows.push(['', '', '', 'Total:', orderSummary.total.toFixed(2)])

    const worksheet = XLSX.utils.aoa_to_sheet([...header, ...rows])

    const colWidths = [
      { wch: 15 }, // Code
      { wch: 40 }, // Product
      { wch: 12 }, // Quantity
      { wch: 12 }, // Unit Price
      { wch: 12 }  // Total
    ]
    worksheet['!cols'] = colWidths

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pedido')

    XLSX.writeFile(workbook, `Pedido_${orderSummary.orderNumber}.xlsx`)
  }

  const printOrder = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (showOrderSummary && orderSummary) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Pedido #{orderSummary.orderNumber}
                </h2>
                <p className="text-sm text-gray-500">
                  {orderSummary.date}
                </p>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={exportToExcel}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Download className="h-5 w-5 mr-2" />
                  Excel
                </button>
                <button
                  onClick={printOrder}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Printer className="h-5 w-5 mr-2" />
                  Imprimir
                </button>
              </div>
            </div>

            {companySettings && (
              <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  {companySettings.logo_url ? (
                    <img
                      src={companySettings.logo_url}
                      alt={companySettings.name}
                      className="h-16 w-16 object-contain"
                    />
                  ) : (
                    <div className="h-16 w-16 flex items-center justify-center bg-gray-200 rounded-lg">
                      <Building2 className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {companySettings.name}
                    </h3>
                    {companySettings.cnpj && (
                      <p className="text-sm text-gray-600">CNPJ: {companySettings.cnpj}</p>
                    )}
                    {companySettings.address && (
                      <p className="text-sm text-gray-600">{companySettings.address}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produto
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantidade
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preço Unit.
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orderSummary.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.product.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.product.code}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                      R$ {item.product.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      R$ {(item.product.price * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50">
                  <td colSpan={3} className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                    Total do Pedido
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                    R$ {orderSummary.total.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="mt-8 flex justify-center">
              <Link
                to="/products"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Check className="h-5 w-5 mr-2" />
                Continuar Comprando
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Carrinho vazio</h3>
          <p className="mt-1 text-sm text-gray-500">
            Seu carrinho está vazio. Que tal adicionar alguns produtos?
          </p>
          <div className="mt-6">
            <Link
              to="/products"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Ver produtos
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const total = cartItems.reduce((sum, item) => 
    sum + (item.product.price * item.quantity), 0
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Carrinho de Compras</h1>
          <p className="mt-1 text-sm text-gray-500">
            Revise seus itens e continue para o checkout
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <ul role="list" className="divide-y divide-gray-200">
            {cartItems.map((item) => (
              <li key={item.id} className="p-4 sm:p-6">
                <div className="flex items-center sm:items-start">
                  <div className="flex-shrink-0 w-24 h-24 bg-gray-200 rounded-md overflow-hidden">
                    {item.product.image_url ? (
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-full h-full object-center object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingCart className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  <div className="ml-6 flex-1 flex flex-col">
                    <div className="flex">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-medium text-gray-900">
                          <Link to={`/products/${item.product.id}`} className="hover:text-blue-600">
                            {item.product.name}
                          </Link>
                        </h4>
                        <p className="mt-1 text-sm text-gray-500">
                          {item.product.code}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          {item.product.description}
                        </p>
                      </div>
                      <div className="ml-4 flex-shrink-0 flex flex-col items-end">
                        <p className="text-sm font-medium text-gray-900">
                          R$ {item.product.price?.toFixed(2)}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          Total: R$ {(item.product.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <label htmlFor={`quantity-${item.id}`} className="text-sm font-medium text-gray-700">
                          Quantidade:
                        </label>
                        <input
                          type="number"
                          id={`quantity-${item.id}`}
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                          className="w-20 px-2 py-1 text-center border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-sm font-medium text-red-600 hover:text-red-500 flex items-center"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white shadow sm:rounded-lg p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-lg font-medium text-gray-900">Total do Carrinho</p>
              <p className="text-sm text-gray-500">
                {cartItems.length} {cartItems.length === 1 ? 'item' : 'itens'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                R$ {total.toFixed(2)}
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row sm:space-x-4">
            <button
              type="button"
              onClick={finalizeOrder}
              disabled={processingOrder}
              className="w-full sm:w-auto flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {processingOrder ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processando...
                </>
              ) : (
                <>
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Finalizar Compra
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}