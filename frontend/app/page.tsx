import { FilterBar } from '@/components/filter-bar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AddProductDialog } from '@/components/add-product-dialog'
import { Button } from '@/components/ui/button'
import { PencilIcon } from 'lucide-react'
import Image from 'next/image'

const products = [
  { 
    id: 1, 
    title: 'Introduction to Computer Science Textbook', 
    price: 25, 
    image: '/placeholder.svg',
    seller: {
      name: 'John Doe',
      avatar: '/placeholder.svg',
      college: 'Example University'
    },
    tags: ['textbook', 'computer science']
  },
  // Add more sample products...
]

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">Find What You Need</h1>
        <AddProductDialog />
      </div>
      <FilterBar />
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Latest Listings</h2>
        <Button variant="outline" className="rounded-full">
          Manage Products
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <Card key={product.id} className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <CardContent className="p-0">
              <div className="aspect-w-4 aspect-h-3">
                <Image height={200} width={200} src={product.image} alt={product.title} className="object-cover w-full h-full rounded-t-lg" />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage src={product.seller.avatar} alt={product.seller.name} />
                      <AvatarFallback>{product.seller.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{product.seller.name}</p>
                      <p className="text-xs text-gray-500">{product.seller.college}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                </div>
                <h3 className="text-lg font-semibold mb-1 line-clamp-2">{product.title}</h3>
                <p className="text-xl font-bold mb-2 text-primary">${product.price}</p>
                <div className="flex flex-wrap gap-1">
                  {product.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

