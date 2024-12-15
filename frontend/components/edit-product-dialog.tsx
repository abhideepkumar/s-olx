'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PencilIcon, Upload, X } from 'lucide-react'
import Image from 'next/image'


interface Product {
  id: number
  title: string
  description: string
  more_info?: string
  price: number
  condition: string
  category: string
  tags: string[]
  images: string[]
}

interface EditProductDialogProps {
  product: Product
}

export function EditProductDialog({ product }: EditProductDialogProps) {
  const [editedProduct, setEditedProduct] = useState(product)
  const [newImages, setNewImages] = useState<File[]>([])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditedProduct({ ...editedProduct, [e.target.id]: e.target.value })
  }

  const handleSelectChange = (value: string, field: string) => {
    setEditedProduct({ ...editedProduct, [field]: value })
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewImages(Array.from(e.target.files))
    }
  }

  const handleRemoveImage = (index: number) => {
    setEditedProduct({
      ...editedProduct,
      images: editedProduct.images.filter((_, i) => i !== index),
    })
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // TODO: Implement product update logic
    console.log('Product updated', editedProduct, newImages)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <PencilIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={editedProduct.title} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={editedProduct.description} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="more_info">Additional Information</Label>
            <Textarea id="more_info" value={editedProduct.more_info} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="price">Price</Label>
            <Input id="price" type="number" value={editedProduct.price} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="condition">Condition</Label>
            <Select value={editedProduct.condition} onValueChange={(value) => handleSelectChange(value, 'condition')}>
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
            <Select value={editedProduct.category} onValueChange={(value) => handleSelectChange(value, 'category')}>
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
            <Input id="tags" value={editedProduct.tags.join(', ')} onChange={(e) => setEditedProduct({ ...editedProduct, tags: e.target.value.split(',').map(tag => tag.trim()) })} required />
          </div>
          <div>
            <Label>Current Images</Label>
            <div className="flex flex-wrap gap-2">
              {editedProduct.images.map((image, index) => (
                <div key={index} className="relative">
                  <Image  height={200} width={200} src={image} alt={`Product ${index + 1}`} className="w-16 h-16 object-cover rounded" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 rounded-full w-6 h-6"
                    onClick={() => handleRemoveImage(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="new-images">Add New Images</Label>
            <div className="flex items-center space-x-2">
              <Input id="new-images" type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
              <Button type="button" variant="outline" onClick={() => document.getElementById('new-images')?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Images
              </Button>
              <span>{newImages.length} new image(s) selected</span>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline">Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

