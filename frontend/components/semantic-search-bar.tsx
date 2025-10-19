'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Sparkles, Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import useSWR from 'swr'
import Link from 'next/link'
import Image from 'next/image'
import toast from 'react-hot-toast'

interface SearchResult {
  _id: string
  title: string
  description: string
  price: number
  images: string[]
  condition: string
  category: string
  tags: string[]
  seller: {
    name: string
    clg_name: string
    profile_url: string
  }
  similarity?: number
  searchScore?: number
}

interface SearchResponse {
  data: {
    query: string
    results: SearchResult[]
    total: number
    searchOptions?: any
  }
}

interface SemanticSearchBarProps {
  onSearch?: (results: SearchResult[]) => void
  placeholder?: string
  className?: string
}

const fetcher = async (url: string): Promise<SearchResponse> => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch: ${res.statusText}`)
  }
  return res.json()
}

export function SemanticSearchBar({ 
  onSearch, 
  placeholder = "Search products semantically...", 
  className = "" 
}: SemanticSearchBarProps) {
  const [query, setQuery] = useState('')
  const [searchType] = useState<'semantic'>('semantic')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    category: '',
    minPrice: 0,
    maxPrice: 10000,
    condition: '',
    threshold: 0.3,
  })
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setShowResults(false)
      return
    }

    const timeoutId = setTimeout(() => {
      performSearch()
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [query, searchType, filters])

  const performSearch = async () => {
    if (!query.trim()) return

    setIsSearching(true)
    try {
      const searchUrl = '/api/v1/products/search/semantic'

      const params = new URLSearchParams({
        query: query.trim(),
        limit: '10',
        threshold: filters.threshold.toString(),
        ...(filters.category && { category: filters.category }),
        ...(filters.minPrice > 0 && { minPrice: filters.minPrice.toString() }),
        ...(filters.maxPrice < 10000 && { maxPrice: filters.maxPrice.toString() }),
        ...(filters.condition && { condition: filters.condition }),
      })

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}${searchUrl}?${params}`)
      const data = await response.json()

      if (data.success) {
        setShowResults(true)
        onSearch?.(data.data.results)
      } else {
        toast.error('Search failed')
      }
    } catch (error) {
      toast.error('Search failed')
    } finally {
      setIsSearching(false)
    }
  }

  const clearSearch = () => {
    setQuery('')
    setShowResults(false)
    inputRef.current?.focus()
  }

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={searchRef} className={`relative w-full ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-20 py-2 w-full"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="h-6 w-6 p-0"
          >
            <Filter className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* AI Search Indicator */}
      <div className="flex items-center space-x-2 mt-2">
        <div className="flex items-center space-x-1 text-sm text-gray-600">
          <Sparkles className="h-3 w-3" />
          <span>AI-Powered Search</span>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50">
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any category</SelectItem>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="books">Books</SelectItem>
                    <SelectItem value="clothing">Clothing</SelectItem>
                    <SelectItem value="furniture">Furniture</SelectItem>
                    <SelectItem value="sports">Sports</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Condition</label>
                <Select value={filters.condition} onValueChange={(value) => handleFilterChange('condition', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any condition</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="like-new">Like New</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Price Range: ${filters.minPrice} - ${filters.maxPrice}
              </label>
              <div className="space-y-2">
                <Slider
                  value={[filters.minPrice, filters.maxPrice]}
                  onValueChange={([min, max]) => {
                    handleFilterChange('minPrice', min)
                    handleFilterChange('maxPrice', max)
                  }}
                  max={10000}
                  min={0}
                  step={100}
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Similarity Threshold: {(filters.threshold * 100).toFixed(0)}%
              </label>
              <Slider
                value={[filters.threshold]}
                onValueChange={([value]) => handleFilterChange('threshold', value)}
                max={1}
                min={0.1}
                step={0.1}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {showResults && query && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-40 max-h-96 overflow-y-auto">
          <CardContent className="p-0">
            {isSearching ? (
              <div className="p-4 text-center text-gray-500">
                <Sparkles className="h-6 w-6 mx-auto mb-2 animate-spin" />
                Searching...
              </div>
            ) : (
              <div className="divide-y">
                {/* Results will be populated by the search */}
                <div className="p-4 text-center text-gray-500">
                  Type to search...
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Search Results Component
export function SearchResults({ results }: { results: SearchResult[] }) {
  if (!results || results.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No results found. Try different keywords or adjust filters.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          AI Search Results
        </h3>
        <Badge variant="secondary">
          {results.length} results
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((product) => (
          <Link href={`/product/${product._id}`} key={product._id}>
            <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <CardContent className="p-0">
                <div className="aspect-w-4 aspect-h-3">
                  <Image
                    height={200}
                    width={200}
                    src={product.images[0] || "/placeholder.svg"}
                    alt={product.title}
                    className="object-cover w-full h-[200px]"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-xs">
                      AI Search
                    </Badge>
                    {product.searchScore && (
                      <Badge variant="secondary" className="text-xs">
                        {Math.round(product.searchScore)}% match
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold mb-1 line-clamp-2">{product.title}</h3>
                  <p className="text-xl font-bold mb-2 text-primary">${product.price}</p>
                  <div className="flex flex-wrap gap-1">
                    {product.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
