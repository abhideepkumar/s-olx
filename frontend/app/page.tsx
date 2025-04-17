// page.tsx - The main server component
import { Suspense } from "react";
import ProductGrid from "@/client-codes/product-grid";

// Define types
export type Product = {
  _id: string;
  title: string;
  price: number;
  images: string[];
  tags: string[];
  seller: {
    name: string | null;
    college: string | null;
    profile_url: string | null;
  } | null;
};

export type ApiResponse = {
  data: Product[];
};

// Server component to fetch data
async function getProducts(): Promise<ApiResponse> {
  try {
    const res = await fetch(`${process.env.BACKEND_URL}/api/v1/products/homepage`, { 
      cache: 'no-store' // Ensures fresh data on each request
    });
    
    if (!res.ok) {
      throw new Error(`Failed to fetch: ${res.statusText}`);
    }
    
    return res.json();
  } catch (error) {
    console.error("Error fetching products:", error);
    return { data: [] };
  }
}

// Main component (server)
export default async function HomePage() {
  const products = await getProducts();

  // No products case
  if (!products || products.data.length === 0) {
    return <div className="text-center py-8 text-gray-500">No products available at the moment.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">Find What You Need</h1>
      </div>
      {/* to add */}
      {/* <FilterBar /> */}
      <Suspense fallback={<div className="text-center py-8">Loading products...</div>}>
        <ProductGrid products={products.data} />
      </Suspense>
    </div>
  );
}