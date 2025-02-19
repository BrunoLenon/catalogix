import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { AlertCircle, Mail, Lock } from 'lucide-react'
import { useCompanySettings } from '../contexts/CompanySettingsContext'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn } = useAuth()
  const { settings } = useCompanySettings()

  const from = location.state?.from?.pathname || '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim() || !password) {
      setError('Por favor, preencha todos os campos')
      return
    }

    setError('')
    setLoading(true)
    
    try {
      await signIn(email.trim(), password)
      navigate(from, { replace: true })
    } catch (error: any) {
      console.error('Login error:', error)
      setError(error.message || 'Ocorreu um erro ao fazer login. Por favor, tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Imagem lateral */}
      {settings?.login_image_url && (
        <div className="hidden lg:block lg:w-1/2 relative">
          <img
            src={settings.login_image_url}
            alt="Login"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-8">
            {settings?.login_image_text && (
              <p className="text-white text-xl font-medium">
                {settings.login_image_text}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Formulário de login */}
      <div className={`flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-blue-100 ${settings?.login_image_url ? 'lg:w-1/2' : 'w-full'}`}>
        <div className="max-w-md w-full space-y-8 bg-white rounded-xl shadow-lg p-8">
          <div>
            {settings?.logo_url ? (
              <img
                src={settings.logo_url}
                alt={settings?.name}
                className="h-12 mx-auto"
              />
            ) : (
              <h2 className="text-3xl font-bold text-center text-gray-900">Login</h2>
            )}
            <p className="mt-2 text-center text-gray-600">
              Faça login para acessar o catálogo
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-4 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200 flex items-start gap-2 animate-fade-in-up">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}
            
            <div className="space-y-4">
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
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}