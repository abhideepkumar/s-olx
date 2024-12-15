import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export function SearchBar() {
  return (
    <div className="relative">
      <Input type="search" placeholder="Search products..." className="pl-10 pr-4 py-2 w-full max-w-md" />
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
    </div>
  )
}

