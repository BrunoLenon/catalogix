import { Outlet } from 'react-router-dom'
import { Navigation } from './Navigation'
import { useCompanySettings } from '../contexts/CompanySettingsContext'

export function Layout() {
  const { settings } = useCompanySettings()

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: settings?.theme?.backgroundColor || '#f3f4f6' }}
    >
      {/* Navigation with theme color */}
      <div style={{ backgroundColor: settings?.theme?.headerColor || '#ffffff' }}>
        <Navigation />
      </div>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8 flex-grow">
        <Outlet />
      </main>
      
      {/* Footer with theme color */}
      <footer 
        className="mt-auto py-8 px-4"
        style={{ backgroundColor: settings?.theme?.footerColor || '#ffffff' }}
      >
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center space-y-2">
            {settings?.footer?.companyName && (
              <p className="text-gray-700 font-medium">
                {settings.footer.companyName}
              </p>
            )}
            {settings?.footer?.cnpj && (
              <p className="text-gray-600 text-sm">
                CNPJ: {settings.footer.cnpj}
              </p>
            )}
            {settings?.footer?.address && (
              <p className="text-gray-600 text-sm">
                {settings.footer.address}
              </p>
            )}
            <p className="text-gray-500 text-xs mt-4">
              © {new Date().getFullYear()} {settings?.name || 'Todos os direitos reservados'}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}