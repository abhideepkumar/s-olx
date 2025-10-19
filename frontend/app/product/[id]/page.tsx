"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageCarousel } from "@/components/image-carousel";
import { ProductRecommendations } from "@/components/product-recommendations";
import ChatButton from "@/components/ChatButton";
import useSWR from "swr";
import Link from "next/link";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch: ${res.statusText}`);
  }
  return res.json();
};

export default function ProductPage({ params }: { params: { id: string } }) {
  const {
    data: product,
    error,
    isLoading,
  } = useSWR(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/products/id/${params.id}`, fetcher);
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
  try {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4 flex flex-col">
                <div>
                  <ImageCarousel images={product?.data?.images} />
                </div>
                <div className="flex justify-end space-x-4">
                  <Link
                    href={`https://mail.google.com/mail/?view=cm&fs=1&to=${product?.data?.seller.email}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-primary text-white px-4 py-2"
                  >
                    Contact Seller
                  </Link>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{product?.data?.title}</h1>
                  <p className="text-4xl font-bold text-primary">Rs {product?.data?.price}</p>
                </div>
                <div className="flex items-center justify-between">
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
                  <ChatButton
                    productId={params.id}
                    sellerId={product?.data?.seller._id}
                    sellerEmail={product?.data?.seller.email}
                    productTitle={product?.data?.title}
                    productPrice={product?.data?.price}
                    productImages={product?.data?.images}
                  />
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
                    {product?.data?.tags.map((tag: string, index: number) => (
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
        
        {/* AI-Powered Recommendations */}
        <ProductRecommendations 
          productId={params.id}
          title="You Might Also Like"
          limit={4}
          threshold={0.4}
          excludeSameSeller={true}
          className="mt-8"
        />
        
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
