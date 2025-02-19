import { Link } from 'react-router-dom'
import { Users, Package, LayoutGrid, TrendingUp, DollarSign, ShoppingCart, Clock } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface DashboardStats {
  totalUsers: number
  totalProducts: number
  totalCategories: number
  recentOrders: number
}

export function AdminDashboard() {
  const { isAdmin } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProducts: 0,
    totalCategories: 0,
    recentOrders: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError('')

      // Load users count
      const { count: usersCount, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      if (usersError) throw usersError

      // Load products count
      const { count: productsCount, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })

      if (productsError) throw productsError

      // Load categories count
      const { count: categoriesCount, error: categoriesError } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true })

      if (categoriesError) throw categoriesError

      setStats({
        totalUsers: usersCount || 0,
        totalProducts: productsCount || 0,
        totalCategories: categoriesCount || 0,
        recentOrders: 0 // Placeholder for future orders feature
      })
    } catch (error: any) {
      console.error('Error loading dashboard data:', error)
      setError('Erro ao carregar dados do dashboard')
    } finally {
      setLoading(false)
    }
  }

  const menuItems = [
    {
      title: 'Usuários',
      description: 'Gerenciar usuários e permissões',
      icon: Users,
      link: '/admin/users',
      color: 'bg-blue-500',
      stat: stats.totalUsers,
      statLabel: 'Total de Usuários'
    },
    {
      title: 'Produtos',
      description: 'Gerenciar catálogo de produtos',
      icon: Package,
      link: '/admin/products',
      color: 'bg-green-500',
      stat: stats.totalProducts,
      statLabel: 'Produtos Cadastrados'
    },
    {
      title: 'Categorias',
      description: 'Organizar categorias de produtos',
      icon: LayoutGrid,
      link: '/admin/categories',
      color: 'bg-purple-500',
      stat: stats.totalCategories,
      statLabel: 'Categorias Ativas'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">{error}</h3>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
        <p className="mt-2 text-gray-600">
          Gerencie todos os aspectos do seu catálogo de produtos
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Vendas do Mês</p>
              <p className="text-2xl font-semibold text-gray-900">R$ 0,00</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <DollarSign className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Receita Total</p>
              <p className="text-2xl font-semibold text-gray-900">R$ 0,00</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pedidos Hoje</p>
              <p className="text-2xl font-semibold text-gray-900">0</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <Clock className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pedidos Pendentes</p>
              <p className="text-2xl font-semibold text-gray-900">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Menu Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => (
          <Link
            key={item.title}
            to={item.link}
            className="block group hover:shadow-lg transition-all duration-200"
          >
            <div className="bg-white border rounded-lg overflow-hidden group-hover:border-gray-300 h-full">
              <div className={`${item.color} p-4`}>
                <item.icon className="w-8 h-8 text-white" />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                  {item.title}
                </h3>
                <p className="mt-1 text-gray-600">
                  {item.description}
                </p>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-2xl font-bold text-gray-900">{item.stat}</p>
                  <p className="text-sm text-gray-500">{item.statLabel}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}