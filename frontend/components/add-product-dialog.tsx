"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Upload } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

export function AddProductDialog() {
  const [images, setImages] = useState<File[]>([]);
  const [condition, setCondition] = useState(""); // State for condition
  const [category, setCategory] = useState(""); // State for category

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate required fields
    if (!condition || !category) {
      toast.error("Please select condition and category");
      return;
    }

    // Create FormData
    const formData = new FormData();
    try {
      // Append images
      images.forEach((image) => {
        formData.append("images", image);
      });

      // Append other form data
      formData.append("title", e.currentTarget.title.value);
      formData.append("description", e.currentTarget.description.value);
      formData.append("more_info", e.currentTarget.more_info.value || "");
      formData.append("price", e.currentTarget.price.value);
      formData.append("condition", condition);
      formData.append("category", category);

      // Split tags and trim whitespace
      const tagsInput = (e.currentTarget.tags as HTMLInputElement).value;
      const tags = tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag)
        .join(",");
      formData.append("tags", tags);

      // Add seller
      formData.append("seller", localStorage.getItem("token"));

      // Submit data to API
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/products/create`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Handle success
      toast.success("Product added successfully!");
      console.log(response.data);

      // Reset form
      // to add
      // e.currentTarget.reset();
      setImages([]);
      setCondition("");
      setCategory("");
    } catch (error) {
      // Handle errors
      console.error(error);
      toast.error("Failed to add product. Please try again.");
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="rounded-full">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 h-[500px] overflow-y-scroll">
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
          <Button type="submit" className="w-full">
            Add Product
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
