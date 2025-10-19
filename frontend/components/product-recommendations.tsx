'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Sparkles, TrendingUp } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import useSWR from 'swr'
import toast from 'react-hot-toast'

interface Recommendation {
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
  similarity: number
  recommendationScore: number
}

interface ProductRecommendationsProps {
  productId: string
  title?: string
  limit?: number
  threshold?: number
  excludeSameSeller?: boolean
  className?: string
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch: ${res.statusText}`)
  }
  return res.json()
}

export function ProductRecommendations({
  productId,
  title = "Similar Products",
  limit = 4,
  threshold = 0.4,
  excludeSameSeller = true,
  className = ""
}: ProductRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const { data, error } = useSWR(
    productId ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/products/recommendations/${productId}?limit=${limit}&threshold=${threshold}&excludeSameSeller=${excludeSameSeller}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  )

  useEffect(() => {
    if (data?.success) {
      setRecommendations(data.data.recommendations)
    }
  }, [data])

  if (error) {
    return null
  }

  if (!recommendations || recommendations.length === 0) {
    return null
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center space-x-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">{title}</h3>
        <Badge variant="secondary" className="text-xs">
          AI Powered
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {recommendations.map((product) => (
          <Link href={`/product/${product._id}`} key={product._id}>
            <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
              <CardContent className="p-0">
                <div className="relative">
                  <Image
                    height={150}
                    width={150}
                    src={product.images[0] || "/placeholder.svg"}
                    alt={product.title}
                    className="object-cover w-full h-[150px]"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="text-xs bg-white/90">
                      {Math.round(product.recommendationScore)}% match
                    </Badge>
                  </div>
                </div>
                
                <div className="p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        src={product.seller?.profile_url || "/placeholder.svg"}
                        alt={product.seller?.name || "User"}
                      />
                      <AvatarFallback className="text-xs">
                        {product.seller?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        {product.seller?.name || "Deleted User"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {product.seller?.clg_name}
                      </p>
                    </div>
                  </div>

                  <h4 className="text-sm font-semibold mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                    {product.title}
                  </h4>
                  
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-lg font-bold text-primary">
                      ${product.price}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {product.condition}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {product.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {product.tags.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{product.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {recommendations.length > 0 && (
        <div className="text-center">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/search?q=${encodeURIComponent(title)}&type=semantic`}>
              <TrendingUp className="h-4 w-4 mr-2" />
              View More Recommendations
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}

// Trending Products Component
export function TrendingProducts({ className = "" }: { className?: string }) {
  const { data, error } = useSWR(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/products/homepage`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  )

  if (error) {
    return null
  }

  if (!data?.success || !data.data.length) {
    return null
  }

  const trendingProducts = data.data.slice(0, 4)

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center space-x-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Trending Now</h3>
        <Badge variant="secondary" className="text-xs">
          Popular
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {trendingProducts.map((product: any) => (
          <Link href={`/product/${product._id}`} key={product._id}>
            <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
              <CardContent className="p-0">
                <div className="relative">
                  <Image
                    height={150}
                    width={150}
                    src={product.images[0] || "/placeholder.svg"}
                    alt={product.title}
                    className="object-cover w-full h-[150px]"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="text-xs bg-white/90">
                      Trending
                    </Badge>
                  </div>
                </div>
                
                <div className="p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        src={product.seller?.profile_url || "/placeholder.svg"}
                        alt={product.seller?.name || "User"}
                      />
                      <AvatarFallback className="text-xs">
                        {product.seller?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        {product.seller?.name || "Deleted User"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {product.seller?.clg_name}
                      </p>
                    </div>
                  </div>

                  <h4 className="text-sm font-semibold mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                    {product.title}
                  </h4>
                  
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-lg font-bold text-primary">
                      ${product.price}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {product.condition}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {product.tags.slice(0, 2).map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {product.tags.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{product.tags.length - 2}
                      </Badge>
                    )}
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
