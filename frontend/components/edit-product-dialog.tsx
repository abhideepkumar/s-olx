'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PencilIcon, Upload, X } from 'lucide-react'
import Image from 'next/image'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Spinner } from '@/components/ui/spinner'


interface Product {
  _id: string
  title: string
  description: string
  more_info?: string
  price: number
  condition: string
  category: string
  tags: string[]
  images: string[]
  createdAt?: string
}

interface EditProductDialogProps {
  product: Product
  onProductUpdated?: () => void
}

export function EditProductDialog({ product, onProductUpdated }: EditProductDialogProps) {
  const [editedProduct, setEditedProduct] = useState(product)
  const [newImages, setNewImages] = useState<File[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData()
      
      // Append basic product data
      formData.append('title', editedProduct.title)
      formData.append('description', editedProduct.description)
      formData.append('more_info', editedProduct.more_info || '')
      formData.append('price', editedProduct.price.toString())
      formData.append('condition', editedProduct.condition)
      formData.append('category', editedProduct.category)
      
      // Append tags
      editedProduct.tags.forEach(tag => {
        formData.append('tags', tag)
      })

      // Append new images if any
      newImages.forEach(image => {
        formData.append('images', image)
      })

      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/products/update/${product._id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      if (response.status >= 200 && response.status < 300) {
        toast.success('Product updated successfully!')
        onProductUpdated?.()
        setIsOpen(false)
        setNewImages([])
      } else {
        toast.error('Failed to update product')
      }
    } catch (error) {
      console.error('Error updating product:', error)
      toast.error('Failed to update product')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setIsOpen(false)
    setEditedProduct(product)
    setNewImages([])
  }

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        handleCancel()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <>
      <Button 
        variant="ghost" 
        size="icon" 
        className="rounded-full"
        onClick={() => setIsOpen(true)}
      >
        <PencilIcon className="h-4 w-4" />
      </Button>

      {isOpen && (
        <>
          {/* Modal Overlay */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={handleCancel}
          >
            <div 
              className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden w-full max-w-4xl max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                <h2 className="text-xl font-semibold text-gray-900">Edit Product</h2>
                <Button variant="ghost" size="sm" onClick={handleCancel} className="h-8 w-8 p-0 hover:bg-gray-200">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input id="title" value={editedProduct.title} onChange={handleChange} required />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" value={editedProduct.description} onChange={handleChange} required className="min-h-[100px]" />
                    </div>
                    <div>
                      <Label htmlFor="more_info">Additional Information</Label>
                      <Textarea id="more_info" value={editedProduct.more_info} onChange={handleChange} className="min-h-[80px]" />
                    </div>
                    <div>
                      <Label htmlFor="price">Price</Label>
                      <Input id="price" type="number" value={editedProduct.price} onChange={handleChange} required />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
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
                            <Image height={200} width={200} src={image} alt={`Product ${index + 1}`} className="w-16 h-16 object-cover rounded" />
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
                      <div className="flex flex-col space-y-2">
                        <Input id="new-images" type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                        <Button type="button" variant="outline" onClick={() => document.getElementById('new-images')?.click()}>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Images
                        </Button>
                        <span className="text-sm text-gray-500">{newImages.length} new image(s) selected</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 mt-6 flex-shrink-0">
                  {!isLoading ? (
                    <>
                      <Button type="submit" className="flex-1">
                        Save Changes
                      </Button>
                      <Button type="button" variant="outline" onClick={handleCancel} className="flex-1">
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <div className="flex justify-center w-full">
                      <Spinner />
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  )
}

