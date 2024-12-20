import Link from 'next/link'
import { Home, Users, Heart, User, LogOut, PlusCircle } from 'lucide-react'

export function SideNav({ className }: { className?: string }) {
  return (
    <nav className={`w-64 bg-white shadow-lg h-screen sticky top-0 ${className}`}>
      <div className="p-4">
        <h1 className="text-2xl font-bold text-primary">S-OLX</h1>
      </div>
      <ul className="space-y-2 p-4">
        <NavItem href="/" icon={<Home size={20} />} text="Home" />
        <NavItem href="/community" icon={<Users size={20} />} text="Community" />
        {/* to add */}
        {/* <NavItem href="/wishlist" icon={<Heart size={20} />} text="Wishlist" /> */}
        <NavItem href="/profile" icon={<User size={20} />} text="Profile" />
        <NavItem href="/create-listing" icon={<PlusCircle size={20} />} text="Create Listing" />
        <NavItem href="/logout" icon={<LogOut size={20} />} text="Logout" />
      </ul>
    </nav>
  )
}

function NavItem({ href, icon, text }: { href: string; icon: React.ReactNode; text: string }) {
  return (
    <li>
      <Link href={href} className="flex items-center space-x-3 text-gray-700 hover:text-primary transition-colors p-2 rounded-lg hover:bg-gray-100">
        {icon}
        <span>{text}</span>
      </Link>
    </li>
  )
}

