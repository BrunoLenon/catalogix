import { Outlet } from 'react-router-dom'

interface ProtectedRouteProps {
  allowedRole?: 'admin' | 'customer'
}

export function ProtectedRoute({ allowedRole }: ProtectedRouteProps) {
  // Temporarily allow all access
  return <Outlet />
}