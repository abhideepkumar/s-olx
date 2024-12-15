'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PlusCircle, Upload } from 'lucide-react'

export function AddProductDialog() {
  const [images, setImages] = useState<File[]>([])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files))
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // TODO: Implement product submission logic
    console.log('Product submitted')
  }

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
            <Input id="title" required />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" required />
          </div>
          <div>
            <Label htmlFor="more_info">Additional Information</Label>
            <Textarea id="more_info" />
          </div>
          <div>
            <Label htmlFor="price">Price</Label>
            <Input id="price" type="number" required />
          </div>
          <div>
            <Label htmlFor="condition">Condition</Label>
            <Select>
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
            <Label htmlFor="category">Category</Label>
            <Select>
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
            <Input id="tags" required />
          </div>
          <div>
            <Label htmlFor="images">Images</Label>
            <div className="flex items-center space-x-2">
              <Input id="images" type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
              <Button type="button" variant="outline" onClick={() => document.getElementById('images')?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Images
              </Button>
              <span>{images.length} image(s) selected</span>
            </div>
          </div>
          <Button type="submit" className="w-full">Add Product</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

