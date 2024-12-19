import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Image from 'next/image'

export default function WishlistPage() {
  // TODO: Fetch wishlist items
  const wishlistItems = [
    { 
      _id: 1, 
      title: 'Laptop', 
      price: 800, 
      images: ['/placeholder.svg',],
      seller: {
        name: 'Jane Smith',
        profile_url: '/placeholder.svg',
        college: 'Tech University'
      },
      tags: ['electronics', 'computer']
    },
    { 
      _id: 2, 
      title: 'Introduction to Computer Science Textbook', 
      price: 50, 
      images: ['/placeholder.svg',],
      seller: {
        name: 'John Doe',
        profile_url: '/placeholder.svg',
        college: 'Example College'
      },
      tags: ['textbook', 'computer science']
    },
    { 
      _id: 3, 
      title: 'Bicycle', 
      price: 200, 
      images: ['/placeholder.svg',],
      seller: {
        name: 'Alice Johnson',
        profile_url: '/placeholder.svg',
        college: 'State University'
      },
      tags: ['sports', 'transportation']
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Your Wishlist</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {wishlistItems.map((item) => (
          <Link href={`/item/${item._id}`} key={item._id}>
            <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <CardContent className="p-0">
                <div className="aspect-w-4 aspect-h-3">
                  <Image
                    height={200}
                    width={200}
                    src={item?.images[0] || "/placeholder.svg"}
                    alt={item.title}
                    className="object-cover w-full h-[250px] rounded-t-lg"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage
                          src={item.seller?.profile_url || "/placeholder.svg"}
                          alt={item.seller?.name || "Deleted User"}
                        />
                        <AvatarFallback>{item.seller?.name?.charAt(0) || "?"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{item.seller?.name || "Deleted User"}</p>
                        <p className="text-xs text-gray-500">{item.seller?.college}</p>
                      </div>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-1 line-clamp-2">{item.title}</h3>
                  <p className="text-xl font-bold mb-2 text-primary">${item.price}</p>
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map((tag) => (
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

