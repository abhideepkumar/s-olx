'use client'

import { Home, Users, User, LogOut, LogIn, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

// Define types for our components
type SideNavProps = {
  className?: string
}

// Define navigation items centrally
const getNavItems = (isLoggedIn: boolean) => [
  { href: '/', icon: <Home className="w-5 h-5" />, text: 'Home' },
  { href: '/community', icon: <Users className="w-5 h-5" />, text: 'Community' },
  //for  chat
  { href: '/chat', icon: <MessageCircle className="w-5 h-5" />, text: 'Chat', requiresAuth: true },
  { href: '/profile', icon: <User className="w-5 h-5" />, text: 'Profile', requiresAuth: true },
  ...(isLoggedIn 
    ? [{ href: '/logout', icon: <LogOut className="w-5 h-5" />, text: 'Logout' }]
    : [{ href: '/login', icon: <LogIn className="w-5 h-5" />, text: 'Login' }]
  )
]

export function SideNav({ className = '' }: SideNavProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
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
      className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white shadow-lg h-screen sticky top-0 ${className}`}
      aria-label="Main navigation"
    >
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <h1 className={`text-2xl font-bold text-primary ${isCollapsed ? 'sr-only' : ''}`}>
          <Link href="/" className="hover:opacity-80 transition-opacity">
            S-OLX
          </Link>
        </h1>
        <button
          type="button"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={() => setIsCollapsed(prev => !prev)}
          className="p-2 rounded-md hover:bg-gray-100"
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
      <ul className="space-y-1 p-4">
        {navItems.map(item => {
          if (item.requiresAuth && !isLoggedIn) return null

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`
                  flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} p-2 rounded-lg
                  transition-colors duration-200
                  ${pathname === item.href 
                    ? 'bg-primary/10 text-primary font-medium' 
                    : 'text-gray-700 hover:text-primary hover:bg-gray-100'}
                `}
                aria-current={pathname === item.href ? 'page' : undefined}
                title={item.text}
              >
                {item.icon}
                {!isCollapsed && <span>{item.text}</span>}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}