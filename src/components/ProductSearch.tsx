import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface SearchResult {
  id: string
  code: string
  name: string
  description: string
  barcode?: string
}

export function ProductSearch() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceTimeout = useRef<NodeJS.Timeout>()

  // Handle click outside to close results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Update search term when URL changes
  useEffect(() => {
    const currentSearch = searchParams.get('search') || ''
    setSearchTerm(currentSearch)
  }, [searchParams])

  const searchProducts = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([])
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, code, name, description, barcode')
        .or(`code.ilike.%${query}%,name.ilike.%${query}%,barcode.ilike.%${query}%,description.ilike.%${query}%`)
        .eq('active', true)
        .limit(5)
        .order('name')

      if (error) throw error
      setResults(data || [])
    } catch (error) {
      console.error('Error searching products:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setShowResults(true)

    // Clear previous timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }

    // Debounce search
    debounceTimeout.current = setTimeout(() => {
      searchProducts(value)
      
      // Update URL if we're on the products page
      if (location.pathname.includes('/products')) {
        const newSearchParams = new URLSearchParams(searchParams)
        if (value) {
          newSearchParams.set('search', value)
        } else {
          newSearchParams.delete('search')
        }
        navigate(`${location.pathname}?${newSearchParams.toString()}`)
      }
    }, 300)
  }

  const handleResultClick = (result: SearchResult) => {
    setShowResults(false)
    navigate(`/products/${result.id}`)
  }

  const clearSearch = () => {
    setSearchTerm('')
    setResults([])
    setShowResults(false)
    
    if (location.pathname.includes('/products')) {
      const newSearchParams = new URLSearchParams(searchParams)
      newSearchParams.delete('search')
      navigate(`${location.pathname}?${newSearchParams.toString()}`)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchTerm) {
      setShowResults(false)
      navigate(`/products?search=${encodeURIComponent(searchTerm)}`)
    }
  }

  // Hide search bar on settings and categories pages
  const hiddenPaths = ['/admin/settings', '/categories']
  if (hiddenPaths.some(path => location.pathname.includes(path))) {
    return null
  }

  return (
    <div ref={searchRef} className="relative w-full max-w-xs">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar produtos..."
          className="pl-10 pr-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setShowResults(true)}
          onKeyDown={handleKeyDown}
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && (searchTerm || isLoading) && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : results.length > 0 ? (
            <ul className="max-h-60 overflow-auto">
              {results.map((result) => (
                <li
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="text-sm font-medium text-gray-900">
                    {result.name}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center space-x-2">
                    <span>Código: {result.code}</span>
                    {result.barcode && (
                      <>
                        <span>•</span>
                        <span>Barcode: {result.barcode}</span>
                      </>
                    )}
                  </div>
                </li>
              ))}
              {searchTerm && (
                <li
                  onClick={() => {
                    setShowResults(false)
                    navigate(`/products?search=${encodeURIComponent(searchTerm)}`)
                  }}
                  className="px-4 py-2 text-blue-600 hover:bg-blue-50 cursor-pointer text-sm font-medium border-t"
                >
                  Ver todos os resultados
                </li>
              )}
            </ul>
          ) : searchTerm ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              Nenhum produto encontrado
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}