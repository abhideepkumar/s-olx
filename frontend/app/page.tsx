import Link from 'next/link'
import { FilterBar } from '@/components/filter-bar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

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
      <h1 className="text-4xl font-bold text-center">Find What You Need</h1>
      <FilterBar />
      <h2 className="text-2xl font-semibold">Latest Listings</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <Link href={`/product/${product.id}`} key={product.id} className="group">
            <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <CardContent className="p-0">
                <div className="aspect-w-4 aspect-h-3">
                  <img src={product.image} alt={product.title} className="object-cover w-full h-full rounded-t-lg" />
                </div>
                <div className="p-4">
                  <div className="flex items-center mb-2">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage src={product.seller.avatar} alt={product.seller.name} />
                      <AvatarFallback>{product.seller.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{product.seller.name}</p>
                      <p className="text-xs text-gray-500">{product.seller.college}</p>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-1 line-clamp-2 group-hover:text-primary transition-colors">{product.title}</h3>
                  <p className="text-xl font-bold mb-2 text-primary">${product.price}</p>
                  <div className="flex flex-wrap gap-1">
                    {product.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
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

