import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { AlertCircle, Mail, Lock, User } from 'lucide-react'

export function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signUp(email.trim(), password, fullName.trim())
      navigate('/login', { 
        state: { message: 'Cadastro realizado com sucesso! Faça login para continuar.' }
      })
    } catch (error: any) {
      console.error('Registration error:', error)
      setError(error.message || 'Erro ao criar conta. Por favor, tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="max-w-md w-full m-4 space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div>
          <h2 className="text-3xl font-bold text-center text-gray-900">Criar Conta</h2>
          <p className="mt-2 text-center text-gray-600">
            Cadastre-se para acessar o catálogo
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="p-4 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Nome Completo
              </label>
              <div className="mt-1 relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-10 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400
                    focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                    disabled:bg-gray-50 disabled:text-gray-500"
                  disabled={loading}
                  placeholder="Seu nome completo"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400
                    focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                    disabled:bg-gray-50 disabled:text-gray-500"
                  disabled={loading}
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <div className="mt-1 relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400
                    focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                    disabled:bg-gray-50 disabled:text-gray-500"
                  disabled={loading}
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Mínimo de 6 caracteres
              </p>
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={loading}
          >
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>

          <div className="text-center">
            <Link 
              to="/login" 
              className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              Já tem uma conta? Faça login
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}