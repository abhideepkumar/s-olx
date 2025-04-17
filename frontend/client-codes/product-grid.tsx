"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { Product } from "@/app/page";

export default function ProductGrid({ products }: { products: Product[] }) {
  // Client-side error handling
  if (!products || products.length === 0) {
    toast.error("No products found");
    return <div className="text-center py-8 text-gray-500">No products available.</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <Link href={`/product/${product._id}`} key={product._id}>
          <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <CardContent className="p-0">
              <div className="aspect-w-4 aspect-h-3">
                <Image
                  height={200}
                  width={200}
                  src={product.images[0] || "/placeholder.svg"}
                  alt={product.title}
                  className="object-cover w-full h-[250px] rounded-t-lg"
                />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage
                        src={product.seller?.profile_url || "/placeholder.svg"}
                        alt={product.seller?.name || "Deleted User"}
                      />
                      <AvatarFallback>{product.seller?.name?.charAt(0) || "?"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{product.seller?.name || "Deleted User"}</p>
                      <p className="text-xs text-gray-500">{product.seller?.college}</p>
                    </div>
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-1 line-clamp-2">{product.title}</h3>
                <p className="text-xl font-bold mb-2 text-primary">${product.price}</p>
                <div className="flex flex-wrap gap-1">
                  {product.tags.map((tag) => (
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
  );
}