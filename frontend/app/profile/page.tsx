"use client";
// import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { EditProfileDialog } from "@/components/edit-profile-dialog";
// import { EditProductDialog } from "@/components/edit-product-dialog";
// import Image from "next/image";
import useSWR from "swr";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch: ${res.statusText}`);
  }
  return res.json();
};
export default function ProfilePage() {
  // TODO: Fetch user data and products
  // const user = {
  //   name: 'John Doe',
  //   usn: '1MS18CS001',
  //   email: 'john@example.com',
  //   branch: 'Computer Science',
  //   clg_name: 'Example College',
  //   profile_url: '/placeholder.svg',
  // }

  // const listedProducts = [
  //   {
  //     id: 1,
  //     title: "Textbook",
  //     price: 25,
  //     image: "/placeholder.svg",
  //     description: "A great textbook",
  //     condition: "good",
  //     category: "books",
  //     tags: ["textbook", "cs"],
  //     images: ["/placeholder.svg"],
  //   },
  //   {
  //     id: 2,
  //     title: "Laptop",
  //     price: 500,
  //     image: "/placeholder.svg",
  //     description: "Powerful laptop",
  //     condition: "like-new",
  //     category: "electronics",
  //     tags: ["laptop", "tech"],
  //     images: ["/placeholder.svg"],
  //   },
  // ];

  // const boughtProducts = [
  //   { id: 3, title: "Calculator", price: 15, image: "/placeholder.svg" },
  //   { id: 4, title: "Backpack", price: 30, image: "/placeholder.svg" },
  // ];
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const { data: user, error, isLoading } = useSWR(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/profile/${token}`, fetcher);
  console.log(user);
  // Loading state
  if (isLoading) {
    return <div className="text-center py-8">Loading User profile...</div>;
  }

  // Error state
  if (error) {
    console.error("Error fetching products:", error);
    return <div className="text-center py-8 text-red-500">Failed to load user details. Please try again later.</div>;
  }

  // No user data
  if (!user) {
    return <div className="text-center py-8 text-gray-500">No User data found.</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8 p-6">
          <Avatar className="w-32 h-32">
            <AvatarImage src={user.data.profile_url} alt={user.data.name} />
            <AvatarFallback>{user.data.name}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-3xl font-bold">{user.data.name}</h2>
              <p className="text-gray-500">{user.data.usn}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p>{user.data.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Branch</p>
                <p>{user.data.branch}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">College</p>
                <p>{user.data.clg_name}</p>
              </div>
            </div>
            {/* to add */}
            {/* <EditProfileDialog user={user} /> */}
          </div>
        </CardContent>
      </Card>
      {/* to add */}
      {/* <Tabs defaultValue="listed" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="listed">Listed Products</TabsTrigger>
          <TabsTrigger value="bought">Bought Products</TabsTrigger>
        </TabsList>
        <TabsContent value="listed" className="space-y-4">
          {listedProducts.map((product) => (
            <Card key={product.id}>
              <CardContent className="flex items-center space-x-4 p-4">
                <Image
                  height={200}
                  width={200}
                  src={product.image}
                  alt={product.title}
                  className="w-16 h-16 object-cover rounded-lg"
                />
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
                <Image
                  height={200}
                  width={200}
                  src={product.image}
                  alt={product.title}
                  className="w-16 h-16 object-cover rounded-lg"
                />
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
      </Tabs> */}
    </div>
  );
}
