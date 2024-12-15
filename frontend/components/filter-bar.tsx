import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MapPin, DollarSign } from 'lucide-react'

export function FilterBar() {
  return (
    <div className="bg-white shadow-sm rounded-2xl p-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div>
          <Label htmlFor="location" className="mb-2 block text-sm font-medium">Location</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input id="location" placeholder="Enter location" className="pl-10 rounded-full" />
          </div>
        </div>
        <div>
          <Label htmlFor="category" className="mb-2 block text-sm font-medium">Category</Label>
          <Select>
            <SelectTrigger id="category" className="rounded-full">
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
          <Label htmlFor="price-range" className="mb-2 block text-sm font-medium">Price Range</Label>
          <div className="flex items-center space-x-2">
            <DollarSign size={18} className="text-gray-400" />
            <Slider
              id="price-range"
              defaultValue={[0, 1000]}
              max={1000}
              step={10}
              className="flex-grow"
            />
            <span className="text-sm text-gray-600">$1000</span>
          </div>
        </div>
        <div className="flex items-end">
          <Button className="w-full rounded-full">
            Search
          </Button>
        </div>
      </div>
    </div>
  )
}

