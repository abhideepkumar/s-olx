"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Upload, X } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { Spinner } from "@/components/ui/spinner";

// Define an interface for our form elements
interface ProductFormElements extends HTMLFormControlsCollection {
  title: HTMLInputElement;
  description: HTMLTextAreaElement;
  more_info: HTMLTextAreaElement;
  price: HTMLInputElement;
  tags: HTMLInputElement;
}

interface ProductFormElement extends HTMLFormElement {
  readonly elements: ProductFormElements;
}

export default function AddProductForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [condition, setCondition] = useState("");
  const [category, setCategory] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent<ProductFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate required fields for condition and category
    if (!condition || !category) {
      toast.error("Please select condition and category");
      return;
    }

    // Create FormData instance
    const formData = new FormData();

    try {
      // Append images
      images.forEach((image) => {
        formData.append("images", image);
      });

      // Append other form data from the form elements
      const { title, description, more_info, price, tags } = e.currentTarget.elements;

      formData.append("title", title.value);
      formData.append("description", description.value);
      formData.append("more_info", more_info.value || "");
      formData.append("price", price.value);
      formData.append("condition", condition);
      formData.append("category", category);

      // Process and append tags (split and append as array)
      const tagArray = tags.value.split(",");
      tagArray.forEach((tag) => {
        formData.append("tags", tag.trim());
      });

      // Append seller token from local storage
      const sellerToken = localStorage.getItem("token");
      if (sellerToken) {
        formData.append("seller", sellerToken);
      }

      // Submit data to the API endpoint
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/products/create`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log(response);
      if (response?.status > 200 && response?.status < 300) {
        // Handle success
        toast.success("Product added successfully!");
      } else {
        toast.error("Failed to add product. Please try again.");
      }
      // e.currentTarget.reset();
    } catch (error) {
      // Handle errors
      console.error(error);
      toast.error("Failed to add product. Please try again.");
    } finally {
      // Reset form state
      setImages([]);
      setCondition("");
      setCategory("");
      setIsOpen(false);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    setImages([]);
    setCondition("");
    setCategory("");
  };

  return (
    <div className="w-full mx-auto p-4">
      {!isOpen ? (
        <div className="flex ">
          <Button
            onClick={() => setIsOpen(true)}
            className="rounded-full px-6 py-3 text-lg font-medium shadow-lg hover:shadow-xl transition-shadow"
          >
            <PlusCircle className="h-5 w-5" />
            Add Product
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-900">Add New Product</h2>
            <Button variant="ghost" size="sm" onClick={handleCancel} className="h-8 w-8 p-0 hover:bg-gray-200">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 h-[500px] overflow-y-scroll">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" required />
            </div>
            <div>
              <Label htmlFor="more_info">Additional Information (Optional)</Label>
              <Textarea id="more_info" name="more_info" />
            </div>
            <div>
              <Label htmlFor="price">Price</Label>
              <Input id="price" name="price" type="number" min="0" step="0.01" required />
            </div>
            <div>
              <Label htmlFor="condition">Condition *</Label>
              <Select value={condition} onValueChange={setCondition} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="like-new">Like New</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="books">Books</SelectItem>
                  <SelectItem value="electronics">Electronics</SelectItem>
                  <SelectItem value="furniture">Furniture</SelectItem>
                  <SelectItem value="clothing">Clothing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input id="tags" name="tags" placeholder="Enter tags separated by commas" required />
            </div>
            <div>
              <Label htmlFor="images">Images *</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="images"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  required
                />
                <Button type="button" variant="outline" onClick={() => document.getElementById("images")?.click()}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Images
                </Button>
                <span>{images.length} image(s) selected</span>
              </div>
            </div>
            {!isLoading && (
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  Add Product
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel} className="flex-1">
                  Cancel
                </Button>
              </div>
            )}
            {isLoading && (
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Spinner />
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
