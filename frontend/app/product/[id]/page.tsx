"use client";

// import { useState } from "react";
// import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageCarousel } from "@/components/image-carousel";
// import { Heart } from "lucide-react";
import useSWR from "swr";
// import toast from "react-hot-toast";
// import { useRouter } from "next/navigation";
import Link from "next/link";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch: ${res.statusText}`);
  }
  return res.json();
};

export default function ProductPage({ params }: { params: { id: string } }) {
  // const [isWishlisted, setIsWishlisted] = useState(false);
  // const router = useRouter();

  console.log(params.id);
  const { data: product, error, isLoading } = useSWR(`${process.env.BACKEND_URL}/api/v1/products/id/${params.id}`, fetcher);
  console.log(product?.data?.images);
  // when loading
  if (isLoading) {
    return <div>Loading...</div>;
  }
  //error
  if (error) {
    return <div>Error: {error.message}</div>;
  }

  // No products
  if (!product || product.data.length === 0) {
    return <div className="text-center py-8 text-gray-500">No products available at the moment.</div>;
  }
  // TODO: Implement actual wishlist logic
  // const toggleWishlist = () => {
  //   setIsWishlisted(!isWishlisted);
  // };
  try {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-8">
              <ImageCarousel images={product?.data?.images} />
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{product?.data?.title}</h1>
                  <p className="text-4xl font-bold text-primary">Rs {product?.data?.price}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={product?.data?.seller?.profile_url} alt={product?.data?.seller.name} />
                    <AvatarFallback>{product?.data?.seller.name}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{product?.data?.seller.name}</p>
                    <p className="text-sm text-gray-500">{product?.data?.seller.clg_name}</p>
                  </div>
                </div>
                <div>
                  <h2 className="text-lg font-semibold mb-2">Description</h2>
                  <p className="text-gray-600">{product?.data?.description}</p>
                </div>
                <div>
                  <h2 className="text-lg font-semibold mb-2">Additional Information</h2>
                  <p className="text-gray-600">{product?.data?.more_info}</p>
                </div>
                <div>
                  <h2 className="text-lg font-semibold mb-2">Details</h2>
                  <p>
                    <strong>Condition:</strong> {product?.data?.condition}
                  </p>
                  <p>
                    <strong>Category:</strong> {product?.data?.category}
                  </p>
                </div>
                <div>
                  <h2 className="text-lg font-semibold mb-2">Tags</h2>
                  <div className="flex flex-wrap gap-2">
                    {product?.data?.tags.map((tag:string,index:number) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end space-x-4">
          <Link
            href={`https://mail.google.com/mail/?view=cm&fs=1&to=${product?.data?.seller.email}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-primary text-white px-4 py-2"
          >
            Contact Seller
          </Link>
          {/* to add wishlist support */}

          {/* <Button className="rounded-full" onClick={() => router.push(`mailto:${product?.data?.seller.email}`)}>Contact Seller</Button> */}
          {/* <Button variant={isWishlisted ? "default" : "outline"} className="rounded-full" onClick={toggleWishlist}>
          <Heart className={`mr-2 h-4 w-4 ${isWishlisted ? "fill-current" : ""}`} />
          {isWishlisted ? "Wishlisted" : "Add to Wishlist"}
        </Button> */}
        </div>
      </div>
    );
  } catch {
    return (
      <div className="text-center py-8 text-gray-500">
        Some data of the product is missing. So we are unable to display it
      </div>
    );
  } 
}
