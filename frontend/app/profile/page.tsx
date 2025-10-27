"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AddProductForm from "@/components/add-product-dialog";
import { EditProductDialog } from "@/components/edit-product-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import Image from "next/image";
import axios from "axios";
import toast from "react-hot-toast";
import useSWR from "swr";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch: ${res.statusText}`);
  }
  return res.json();
};

interface Product {
  _id: string;
  title: string;
  price: number;
  images: string[];
  description: string;
  condition: string;
  category: string;
  tags: string[];
  createdAt: string;
}

export default function ProfilePage() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const { data: user, error, isLoading } = useSWR(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/profile/${token}`,
    fetcher
  );

  const [userProducts, setUserProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    product: Product | null;
    isLoading: boolean;
  }>({ isOpen: false, product: null, isLoading: false });

  const fetchUserProducts = async () => {
    try {
      const userId = localStorage.getItem("token");
      if (!userId) {
        setIsLoadingProducts(false);
        return;
      }

      const response = await axios.get<{ success: boolean; data: Product[] }>(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/products/seller/${userId}`
      );

      if (response.data?.data) {
        setUserProducts(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching user products:", err);
      toast.error("Failed to fetch your products");
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchUserProducts();
  }, [refreshKey]);

  const handleProductUpdate = () => setRefreshKey((prev) => prev + 1);

  const handleDeleteClick = (product: Product) => {
    setDeleteDialog({ isOpen: true, product, isLoading: false });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.product) return;
    setDeleteDialog((prev) => ({ ...prev, isLoading: true }));
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/products/delete/${deleteDialog.product._id}`
      );
      toast.success("Product deleted successfully");
      handleProductUpdate();
      setDeleteDialog({ isOpen: false, product: null, isLoading: false });
    } catch (err) {
      console.error("Error deleting product:", err);
      toast.error("Failed to delete product");
      setDeleteDialog((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleDeleteCancel = () =>
    setDeleteDialog({ isOpen: false, product: null, isLoading: false });

  // Loading state
  if (isLoading) {
    return <div className="text-center py-8">Loading User profile...</div>;
  }

  // Error state
  if (error) {
    console.error("Error fetching products:", error);
    return (
      <div className="text-center py-8 text-red-500">
        Failed to load user details. Please try again later.
      </div>
    );
  }

  // No user data
  if (!user) {
    return <div className="text-center py-8 text-gray-500">No User data found.</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-6">
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
          </div>
        </CardContent>
      </Card>

      {/* Create Listing + Your Products Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-semibold">Your Products</h3>
          <AddProductForm onProductAdded={handleProductUpdate} />
        </div>

        {isLoadingProducts ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : userProducts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg">You haven't listed anything yet.</p>
            <p className="text-sm">Use the button above to start selling.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {userProducts.map((product) => (
              <Card key={product._id} className="overflow-hidden">
                <div className="aspect-square relative">
                  <Image
                    src={product.images[0] || "/placeholder.svg"}
                    alt={product.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg truncate">{product.title}</h3>
                    <p className="text-gray-500 text-sm line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-bold text-primary">Rs {product.price}</p>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                        {product.condition}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-gray-400">
                        {new Date(product.createdAt).toLocaleDateString()}
                      </span>
                      <div className="flex gap-2">
                        <EditProductDialog
                          product={product}
                          onProductUpdated={handleProductUpdate}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(product)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteDialog.product?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={deleteDialog.isLoading}
      />
    </div>
  );
}
