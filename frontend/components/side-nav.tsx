'use client'

import { Home, Users, User, LogOut, PlusCircle, LogIn } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

// Define types for our components
type NavItemProps = {
  href: string
  icon: React.ReactNode
  text: string
  isActive?: boolean
}

type SideNavProps = {
  className?: string
}

// Define navigation items centrally
const getNavItems = (isLoggedIn: boolean) => [
  { href: '/', icon: <Home className="w-5 h-5" />, text: 'Home' },
  { href: '/community', icon: <Users className="w-5 h-5" />, text: 'Community' },
  { href: '/profile', icon: <User className="w-5 h-5" />, text: 'Profile', requiresAuth: true },
  { href: '/create-listing', icon: <PlusCircle className="w-5 h-5" />, text: 'Create Listing', requiresAuth: true },
  ...(isLoggedIn 
    ? [{ href: '/logout', icon: <LogOut className="w-5 h-5" />, text: 'Logout' }]
    : [{ href: '/login', icon: <LogIn className="w-5 h-5" />, text: 'Login' }]
  )
]

function NavItem({ href, icon, text, isActive }: NavItemProps) {
  return (
    <li>
      <Link
        href={href}
        className={`
          flex items-center space-x-3 p-2 rounded-lg
          transition-colors duration-200
          ${isActive 
            ? 'bg-primary/10 text-primary font-medium' 
            : 'text-gray-700 hover:text-primary hover:bg-gray-100'
          }
        `}
        aria-current={isActive ? 'page' : undefined}
      >
        {icon}
        <span>{text}</span>
      </Link>
    </li>
  )
}

export function SideNav({ className = '' }: SideNavProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('token')
        setIsLoggedIn(!!token)
      } catch (error) {
        console.error('Error checking authentication:', error)
        setIsLoggedIn(false)
      }
    }

    checkAuth()
    // Listen for storage changes in other tabs/windows
    window.addEventListener('storage', checkAuth)
    return () => window.removeEventListener('storage', checkAuth)
  }, [])

  const navItems = getNavItems(isLoggedIn)

  return (
    <nav 
      className={`w-64 bg-white shadow-lg h-screen sticky top-0 ${className}`}
      aria-label="Main navigation"
    >
      <div className="p-4 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-primary">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            S-OLX
          </Link>
        </h1>
      </div>
      <ul className="space-y-1 p-4">
        {navItems.map(item => {
          // Don't show auth-required items when logged out
          if (item.requiresAuth && !isLoggedIn) return null

          return (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              text={item.text}
              isActive={pathname === item.href}
            />
          )
        })}
      </ul>
    </nav>
  )
}