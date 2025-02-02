import Link from "next/link";
import { Home, Users, User, PlusCircle, LogOut } from "lucide-react";

export function MobileNav({ className }: { className?: string }) {
  return (
    <nav className={`bg-white shadow-lg ${className}`}>
      <ul className="flex justify-around p-4">
        <NavItem href="/" icon={<Home size={24} />} />
        <NavItem href="/community" icon={<Users size={24} />} />
        <NavItem href="/create-listing" icon={<PlusCircle size={24} />} />
        {/* to add */}
        {/* <NavItem href="/wishlist" icon={<Heart size={24} />} /> */}
        <NavItem href="/profile" icon={<User size={24} />} />
        <NavItem href="/logout" icon={<LogOut size={20} />} />

      </ul>
    </nav>
  );
}

function NavItem({ href, icon }: { href: string; icon: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-gray-700 hover:text-primary transition-colors">
        {icon}
      </Link>
    </li>
  );
}
