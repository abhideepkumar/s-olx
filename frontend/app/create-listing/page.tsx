"use client";

import AddProductForm from "@/components/add-product-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import React, { useEffect, useState } from "react";
import { EditProductDialog } from "@/components/edit-product-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import Image from "next/image";
import axios from "axios";
import toast from "react-hot-toast";
import { Spinner } from "@/components/ui/spinner";

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

interface ApiResponse {
  success: boolean;
  message: string;
  data: Product[];
}

const ListingPage = () => {
  const [userProducts, setUserProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    product: Product | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    product: null,
    isLoading: false,
  });

  const fetchUserProducts = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await axios.get<ApiResponse>(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/products/seller/${token}`
      );

      if (response.data.success) {
        setUserProducts(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching user products:", error);
      toast.error("Failed to fetch your products");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProducts();
  }, [refreshKey]);

  const handleProductUpdate = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleDeleteClick = (product: Product) => {
    setDeleteDialog({
      isOpen: true,
      product,
      isLoading: false,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.product) return;

    setDeleteDialog(prev => ({ ...prev, isLoading: true }));

    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/products/delete/${deleteDialog.product._id}`
      );
      toast.success("Product deleted successfully");
      setRefreshKey(prev => prev + 1);
      setDeleteDialog({
        isOpen: false,
        product: null,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
      setDeleteDialog(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({
      isOpen: false,
      product: null,
      isLoading: false,
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-6">Your Products</h1>
        <AddProductForm onProductAdded={handleProductUpdate} />
      </div>

      <Tabs defaultValue="listed" className="space-y-4">
        <TabsList className="grid w-full grid-cols-1 max-w-md mx-auto">
          <TabsTrigger value="listed">Your Listed Products</TabsTrigger>
        </TabsList>
        
        <TabsContent value="listed" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : userProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg">No products listed yet.</p>
              <p className="text-sm">Add your first product using the button above!</p>
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
                        <p className="text-lg font-bold text-primary">${product.price}</p>
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
        </TabsContent>
      </Tabs>

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
};

export default ListingPage;
