import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { CompanySettingsProvider } from './contexts/CompanySettingsContext'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { Home } from './pages/Home'
import { Products } from './pages/Products'
import { ProductDetails } from './pages/ProductDetails'
import { Categories } from './pages/Categories'
import { Cart } from './pages/Cart'
import { AdminDashboard } from './pages/admin/Dashboard'
import { Users } from './pages/admin/Users'
import { Products as AdminProducts } from './pages/admin/Products'
import { Categories as AdminCategories } from './pages/admin/Categories'
import { Settings } from './pages/admin/Settings'

function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) {
  const { user, isAdmin, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requireAdmin && !isAdmin()) {
    return <Navigate to="/" replace />
  }
  
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <CompanySettingsProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            
            {/* Protected routes */}
            <Route element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetails />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/cart" element={<Cart />} />
              
              {/* Admin routes */}
              <Route path="/admin" element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedRoute requireAdmin>
                  <Users />
                </ProtectedRoute>
              } />
              <Route path="/admin/products" element={
                <ProtectedRoute requireAdmin>
                  <AdminProducts />
                </ProtectedRoute>
              } />
              <Route path="/admin/categories" element={
                <ProtectedRoute requireAdmin>
                  <AdminCategories />
                </ProtectedRoute>
              } />
              <Route path="/admin/settings" element={
                <ProtectedRoute requireAdmin>
                  <Settings />
                </ProtectedRoute>
              } />
            </Route>

            {/* Redirect all other routes to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </CompanySettingsProvider>
      </AuthProvider>
    </Router>
  )
}

export default App