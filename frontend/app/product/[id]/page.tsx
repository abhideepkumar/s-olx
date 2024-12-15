'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ImageCarousel } from '@/components/image-carousel'
import { Heart } from 'lucide-react'

export default function ProductPage({ params }: { params: { id: string } }) {
  // TODO: Fetch product data based on params.id
  const product = {
    id: params.id,
    title: 'Introduction to Computer Science Textbook',
    description: 'This comprehensive textbook covers all the fundamental concepts of computer science, perfect for beginners and intermediate learners.',
    more_info: 'Published in 2022, this edition includes the latest developments in the field of computer science, with practical examples and exercises.',
    price: 50,
    condition: 'Like New',
    tags: ['textbook', 'computer science', 'programming'],
    category: 'Books',
    images: ['/placeholder.svg', '/placeholder.svg', '/placeholder.svg'],
    seller: {
      name: 'John Doe',
      avatar: '/placeholder.svg',
      email: 'john@example.com',
      college: 'Example University'
    },
  }

  const [isWishlisted, setIsWishlisted] = useState(false)

  const toggleWishlist = () => {
    setIsWishlisted(!isWishlisted)
    // TODO: Implement actual wishlist logic
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-8">
            <ImageCarousel images={product.images} />
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
                <p className="text-4xl font-bold text-primary">${product.price}</p>
              </div>
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={product.seller.avatar} alt={product.seller.name} />
                  <AvatarFallback>{product.seller.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{product.seller.name}</p>
                  <p className="text-sm text-gray-500">{product.seller.college}</p>
                </div>
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-2">Description</h2>
                <p className="text-gray-600">{product.description}</p>
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-2">Additional Information</h2>
                <p className="text-gray-600">{product.more_info}</p>
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-2">Details</h2>
                <p><strong>Condition:</strong> {product.condition}</p>
                <p><strong>Category:</strong> {product.category}</p>
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-2">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end space-x-4">
        <Button className="rounded-full">Contact Seller</Button>
        <Button
          variant={isWishlisted ? "default" : "outline"}
          className="rounded-full"
          onClick={toggleWishlist}
        >
          <Heart className={`mr-2 h-4 w-4 ${isWishlisted ? "fill-current" : ""}`} />
          {isWishlisted ? "Wishlisted" : "Add to Wishlist"}
        </Button>
      </div>
    </div>
  )
}

