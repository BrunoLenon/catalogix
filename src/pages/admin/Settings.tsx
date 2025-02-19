import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Building2, Upload, X, DollarSign, Palette, Image as ImageIcon, CheckCircle, Eye } from 'lucide-react'

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

const defaultTheme = {
  backgroundColor: '#f3f4f6',
  headerColor: '#ffffff',
  footerColor: '#ffffff'
}

export function Settings() {
  const [settings, setSettings] = useState<CompanySettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [previewMode, setPreviewMode] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      setError('')

      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .single()

      if (error) throw error

      // Ensure theme and footer objects exist
      setSettings({
        ...data,
        theme: data.theme || defaultTheme,
        footer: data.footer || {
          companyName: data.name,
          cnpj: data.cnpj,
          address: data.address
        }
      })
    } catch (error: any) {
      console.error('Error loading settings:', error)
      setError('Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setError('')
      setSaving(true)

      const fileExt = file.name.split('.').pop()
      const fileName = `logo-${Date.now()}.${fileExt}`
      const filePath = `company/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('company-assets')
        .getPublicUrl(filePath)

      setSettings(prev => prev ? { ...prev, logo_url: publicUrl } : null)
    } catch (error: any) {
      console.error('Error uploading logo:', error)
      setError('Erro ao fazer upload do logo')
    } finally {
      setSaving(false)
    }
  }

  const handleLoginImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setError('')
      setSaving(true)

      const fileExt = file.name.split('.').pop()
      const fileName = `login-${Date.now()}.${fileExt}`
      const filePath = `company/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('company-assets')
        .getPublicUrl(filePath)

      setSettings(prev => prev ? { ...prev, login_image_url: publicUrl } : null)
    } catch (error: any) {
      console.error('Error uploading login image:', error)
      setError('Erro ao fazer upload da imagem de login')
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveLogo = async () => {
    if (!settings?.logo_url) return

    try {
      setError('')
      setSaving(true)

      const filePath = settings.logo_url.split('/').pop()
      if (!filePath) return

      const { error: deleteError } = await supabase.storage
        .from('company-assets')
        .remove([`company/${filePath}`])

      if (deleteError) throw deleteError

      setSettings(prev => prev ? { ...prev, logo_url: '' } : null)
    } catch (error: any) {
      console.error('Error removing logo:', error)
      setError('Erro ao remover logo')
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveLoginImage = async () => {
    if (!settings?.login_image_url) return

    try {
      setError('')
      setSaving(true)

      const filePath = settings.login_image_url.split('/').pop()
      if (!filePath) return

      const { error: deleteError } = await supabase.storage
        .from('company-assets')
        .remove([`company/${filePath}`])

      if (deleteError) throw deleteError

      setSettings(prev => prev ? { ...prev, login_image_url: null, login_image_text: null } : null)
    } catch (error: any) {
      console.error('Error removing login image:', error)
      setError('Erro ao remover imagem de login')
    } finally {
      setSaving(false)
    }
  }

  const handleThemeChange = (key: keyof CompanySettings['theme'], value: string) => {
    setSettings(prev => {
      if (!prev) return null
      return {
        ...prev,
        theme: {
          ...prev.theme,
          [key]: value
        }
      }
    })
  }

  const handleFooterChange = (key: keyof CompanySettings['footer'], value: string) => {
    setSettings(prev => {
      if (!prev) return null
      return {
        ...prev,
        footer: {
          ...prev.footer,
          [key]: value
        }
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!settings) return

    try {
      setError('')
      setSuccess('')
      setSaving(true)

      // Prepare data for update, removing login image fields if not set
      const updateData = {
        ...settings,
        updated_at: new Date().toISOString()
      }

      if (!updateData.login_image_url) {
        delete updateData.login_image_url
        delete updateData.login_image_text
      }

      const { error } = await supabase
        .from('company_settings')
        .upsert(updateData)

      if (error) throw error

      setSuccess('Configurações salvas com sucesso!')
      
      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' })
      
      // Remove success message after 3 seconds
      setTimeout(() => {
        setSuccess('')
      }, 3000)
    } catch (error: any) {
      console.error('Error saving settings:', error)
      setError(error.message || 'Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configurações da Empresa</h2>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie as informações e aparência do sistema
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-md bg-green-50 p-4 animate-fade-in-up">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">{success}</h3>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Informações da Empresa</h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Logo da Empresa
              </label>
              <div className="mt-2 flex items-center space-x-4">
                {settings?.logo_url ? (
                  <div className="relative">
                    <img
                      src={settings.logo_url}
                      alt="Logo da empresa"
                      className="h-32 w-32 object-contain rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="absolute -top-2 -right-2 p-1 bg-red-100 rounded-full text-red-600 hover:bg-red-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 w-32 border-2 border-dashed border-gray-300 rounded-lg">
                    {saving ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    ) : (
                      <div className="text-center">
                        <Building2 className="mx-auto h-8 w-8 text-gray-400" />
                        <label
                          htmlFor="logo-upload"
                          className="mt-2 cursor-pointer rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        >
                          <span>Upload</span>
                          <input
                            id="logo-upload"
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            disabled={saving}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Imagem de Login
              </label>
              <p className="text-sm text-gray-500 mb-2">
                Esta imagem será exibida na lateral da tela de login
              </p>
              <div className="mt-2 flex items-center space-x-4">
                {settings?.login_image_url ? (
                  <div className="relative">
                    <img
                      src={settings.login_image_url}
                      alt="Imagem de login"
                      className="h-48 w-64 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveLoginImage}
                      className="absolute -top-2 -right-2 p-1 bg-red-100 rounded-full text-red-600 hover:bg-red-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 w-64 border-2 border-dashed border-gray-300 rounded-lg">
                    {saving ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    ) : (
                      <div className="text-center">
                        <ImageIcon className="mx-auto h-8 w-8 text-gray-400" />
                        <label
                          htmlFor="login-image-upload"
                          className="mt-2 cursor-pointer rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        >
                          <span>Upload</span>
                          <input
                            id="login-image-upload"
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={handleLoginImageUpload}
                            disabled={saving}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {settings?.login_image_url && (
              <div>
                <label htmlFor="login_image_text" className="block text-sm font-medium text-gray-700">
                  Texto da Imagem de Login
                </label>
                <input
                  type="text"
                  id="login_image_text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={settings?.login_image_text || ''}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, login_image_text: e.target.value } : null)}
                  placeholder="Digite um texto para aparecer sobre a imagem de login"
                />
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nome da Empresa
              </label>
              <input
                type="text"
                id="name"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={settings?.name || ''}
                onChange={(e) => setSettings(prev => prev ? { ...prev, name: e.target.value } : null)}
              />
            </div>

            <div>
              <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700">
                CNPJ
              </label>
              <input
                type="text"
                id="cnpj"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={settings?.cnpj || ''}
                onChange={(e) => setSettings(prev => prev ? { ...prev, cnpj: e.target.value } : null)}
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Endereço
              </label>
              <textarea
                id="address"
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={settings?.address || ''}
                onChange={(e) => setSettings(prev => prev ? { ...prev, address: e.target.value } : null)}
              />
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center h-5">
                <input
                  id="show_prices"
                  type="checkbox"
                  checked={settings?.show_prices ?? true}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, show_prices: e.target.checked } : null)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="flex items-center">
                <label htmlFor="show_prices" className="font-medium text-gray-700 flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-gray-400" />
                  Mostrar preços dos produtos
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Palette className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Personalização</h3>
            </div>
            <button
              type="button"
              onClick={() => setPreviewMode(!previewMode)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Eye className="h-4 w-4 mr-2" />
              {previewMode ? 'Ocultar Preview' : 'Mostrar Preview'}
            </button>
          </div>

          <div className="space-y-6">
            {/* Theme Preview */}
            {previewMode && (
              <div className="border rounded-lg overflow-hidden">
                {/* Header Preview */}
                <div
                  className="p-4 flex items-center justify-between"
                  style={{ backgroundColor: settings?.theme.headerColor || defaultTheme.headerColor }}
                >
                  <div className="flex items-center space-x-4">
                    {settings?.logo_url && (
                      <img
                        src={settings.logo_url}
                        alt={settings.name}
                        className="h-8 w-auto"
                      />
                    )}
                    <span className="font-medium">{settings?.name || 'Nome da Empresa'}</span>
                  </div>
                </div>

                {/* Content Preview */}
                <div
                  className="p-8 min-h-[200px] flex items-center justify-center"
                  style={{ backgroundColor: settings?.theme.backgroundColor || defaultTheme.backgroundColor }}
                >
                  <div className="text-center text-gray-500">
                    <p>Área de conteúdo</p>
                    <p className="text-sm">Cor de fundo personalizada</p>
                  </div>
                </div>

                {/* Footer Preview */}
                <div
                  className="p-4 text-center"
                  style={{ backgroundColor: settings?.theme.footerColor || defaultTheme.footerColor }}
                >
                  <p className="text-sm text-gray-600">{settings?.footer.companyName || settings?.name}</p>
                  {settings?.footer.cnpj && (
                    <p className="text-xs text-gray-500">CNPJ: {settings.footer.cnpj}</p>
                  )}
                  {settings?.footer.address && (
                    <p className="text-xs text-gray-500">{settings.footer.address}</p>
                  )}
                </div>
              </div>
            )}

            <div>
              <label htmlFor="backgroundColor" className="block text-sm font-medium text-gray-700">
                Cor de Fundo
              </label>
              <div className="mt-1 flex items-center space-x-2">
                <input
                  type="color"
                  id="backgroundColor"
                  value={settings?.theme.backgroundColor || defaultTheme.backgroundColor}
                  onChange={(e) => handleThemeChange('backgroundColor', e.target.value)}
                  className="h-8 w-8 rounded-md border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={settings?.theme.backgroundColor || defaultTheme.backgroundColor}
                  onChange={(e) => handleThemeChange('backgroundColor', e.target.value)}
                  className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="headerColor" className="block text-sm font-medium text-gray-700">
                Cor do Cabeçalho
              </label>
              <div className="mt-1 flex items-center space-x-2">
                <input
                  type="color"
                  id="headerColor"
                  value={settings?.theme.headerColor || defaultTheme.headerColor}
                  onChange={(e) => handleThemeChange('headerColor', e.target.value)}
                  className="h-8 w-8 rounded-md border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={settings?.theme.headerColor || defaultTheme.headerColor}
                  onChange={(e) => handleThemeChange('headerColor', e.target.value)}
                  className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="footerColor" className="block text-sm font-medium text-gray-700">
                Cor do Rodapé
              </label>
              <div className="mt-1 flex items-center space-x-2">
                <input
                  type="color"
                  id="footerColor"
                  value={settings?.theme.footerColor || defaultTheme.footerColor}
                  onChange={(e) => handleThemeChange('footerColor', e.target.value)}
                  className="h-8 w-8 rounded-md border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={settings?.theme.footerColor || defaultTheme.footerColor}
                  onChange={(e) => handleThemeChange('footerColor', e.target.value)}
                  className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Informações do Rodapé</h3>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="footerCompanyName" className="block text-sm font-medium text-gray-700">
                Nome da Empresa no Rodapé
              </label>
              <input
                type="text"
                id="footerCompanyName"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={settings?.footer.companyName || ''}
                onChange={(e) => handleFooterChange('companyName', e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="footerCnpj" className="block text-sm font-medium text-gray-700">
                CNPJ no Rodapé
              </label>
              <input
                type="text"
                id="footerCnpj"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={settings?.footer.cnpj || ''}
                onChange={(e) => handleFooterChange('cnpj', e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="footerAddress" className="block text-sm font-medium text-gray-700">
                Endereço no Rodapé
              </label>
              <textarea
                id="footerAddress"
                rows={2}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={settings?.footer.address || ''}
                onChange={(e) => handleFooterChange('address', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </form>
    </div>
  )
}