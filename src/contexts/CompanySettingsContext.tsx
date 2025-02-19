import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface CompanySettings {
  id: string
  name: string
  cnpj: string
  address: string
  logo_url: string
  login_image_url: string | null
  login_image_text: string | null
  show_prices: boolean
  theme: {
    backgroundColor: string
    headerColor: string
    footerColor: string
  }
  footer: {
    companyName: string
    cnpj: string
    address: string
  }
}

interface CompanySettingsContextType {
  settings: CompanySettings | null
  loading: boolean
  error: string | null
  refreshSettings: () => Promise<void>
}

const CompanySettingsContext = createContext<CompanySettingsContextType | undefined>(undefined)

const defaultTheme = {
  backgroundColor: '#f3f4f6',
  headerColor: '#ffffff',
  footerColor: '#ffffff'
}

export function CompanySettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<CompanySettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const loadSettings = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('company_settings')
        .select('*')
        .single()

      if (fetchError) {
        throw fetchError
      }

      if (!data) {
        throw new Error('Nenhuma configuração encontrada')
      }

      // Ensure all required fields have default values
      const processedSettings: CompanySettings = {
        ...data,
        theme: data.theme || defaultTheme,
        footer: data.footer || {
          companyName: data.name || 'Minha Empresa',
          cnpj: data.cnpj || '',
          address: data.address || ''
        },
        login_image_url: data.login_image_url || null,
        login_image_text: data.login_image_text || null,
        show_prices: data.show_prices ?? true
      }

      setSettings(processedSettings)
      setRetryCount(0) // Reset retry count on success
    } catch (error: any) {
      console.error('Error loading company settings:', error)
      setError('Erro ao carregar configurações')
      
      // Increment retry count
      setRetryCount(prev => prev + 1)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()

    // Set up retry mechanism
    const retryTimeout = setTimeout(() => {
      if (error && retryCount < 3) {
        loadSettings()
      }
    }, 3000) // Retry after 3 seconds

    return () => clearTimeout(retryTimeout)
  }, [error, retryCount])

  // Set up real-time subscription for settings updates
  useEffect(() => {
    const channel = supabase.channel('company_settings_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'company_settings'
        },
        (payload) => {
          setSettings(prev => {
            if (!prev) return null
            const newData = payload.new as any
            return {
              ...prev,
              ...newData,
              theme: newData.theme || prev.theme,
              footer: newData.footer || prev.footer
            }
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <CompanySettingsContext.Provider 
      value={{ 
        settings, 
        loading, 
        error,
        refreshSettings: loadSettings
      }}
    >
      {children}
    </CompanySettingsContext.Provider>
  )
}

export function useCompanySettings() {
  const context = useContext(CompanySettingsContext)
  if (context === undefined) {
    throw new Error('useCompanySettings must be used within a CompanySettingsProvider')
  }
  return context
}