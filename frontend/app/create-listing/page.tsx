import { AddProductDialog } from "@/components/add-product-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import React from "react";
import { EditProductDialog } from "@/components/edit-product-dialog";
import Image from "next/image";
const ListingPage = () => {
  const listedProducts = [
    {
      id: 1,
      title: "Textbook",
      price: 25,
      image: "/placeholder.svg",
      description: "A great textbook",
      condition: "good",
      category: "books",
      tags: ["textbook", "cs"],
      images: ["/placeholder.svg"],
    },
    {
      id: 2,
      title: "Laptop",
      price: 500,
      image: "/placeholder.svg",
      description: "Powerful laptop",
      condition: "like-new",
      category: "electronics",
      tags: ["laptop", "tech"],
      images: ["/placeholder.svg"],
    },
  ];

  const boughtProducts = [
    { id: 3, title: "Calculator", price: 15, image: "/placeholder.svg" },
    { id: 4, title: "Backpack", price: 30, image: "/placeholder.svg" },
  ];
  return (
    <div className="space-y-8">
      <div className="space-y-8">
        <h1 className="text-4xl font-bold">Products around you</h1>
        <AddProductDialog />
      </div>
      <Tabs defaultValue="listed" className="space-y-4 max-w-4xl mx-auto">
        <TabsList className="grid w-full grid-cols-2 max-w-2xl mx-auto ">
          <TabsTrigger value="listed">Listed Products</TabsTrigger>
          <TabsTrigger value="bought">Bought Products</TabsTrigger>
        </TabsList>
        <TabsContent value="listed" className="space-y-4">
          {listedProducts.map((product) => (
            <Card key={product.id}>
              <CardContent className="flex items-center space-x-4 p-4">
              <Image src={product.image} alt={product.title} width={64} height={64} className="object-cover rounded-lg" />
                <div className="flex-1">
                  <h3 className="font-semibold">{product.title}</h3>
                  <p className="text-gray-500">${product.price}</p>
                </div>
                <EditProductDialog product={product} />
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="bought" className="space-y-4">
          {boughtProducts.map((product) => (
            <Card key={product.id}>
              <CardContent className="flex items-center space-x-4 p-4">
                <Image height={200} width={200} src={product.image} alt={product.title} className="w-16 h-16 object-cover rounded-lg" />
                <div className="flex-1">
                  <h3 className="font-semibold">{product.title}</h3>
                  <p className="text-gray-500">${product.price}</p>
                </div>
                <Button variant="outline" className="rounded-full">
                  Leave Review
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ListingPage;
