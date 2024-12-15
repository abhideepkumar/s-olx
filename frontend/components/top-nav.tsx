'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { SideNav } from './side-nav'

export function TopNav() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="bg-white shadow-sm lg:hidden">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <SideNav />
          </SheetContent>
        </Sheet>
        <div className="flex-1 max-w-md mx-4">
          <div className="relative">
            <Input type="search" placeholder="Search products..." className="pl-10 pr-4 py-2 w-full" />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          </div>
        </div>
      </div>
    </header>
  )
}

