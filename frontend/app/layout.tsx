import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'
import { SideNav } from '@/components/side-nav'
import { MobileNav } from '@/components/mobile-nav'
// import { SearchBar } from '@/components/search-bar'
import { Toaster } from 'react-hot-toast';
import Chatbot from '@/components/Chatbot';

const poppins = Poppins({ 
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'S-OLX',
  description: 'Buy, sell, and exchange stuff within your college community',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${poppins.className} bg-gray-50 text-gray-900`}>
      <Toaster />
        <div className="flex">
          <SideNav className="hidden lg:block" />
          <div className="flex-1">
            <div className="sticky top-0 z-10 bg-white shadow-sm p-4 flex items-center justify-between lg:justify-end">
              <div className="flex items-center lg:hidden">
                <h1 className="text-2xl font-bold text-primary mr-4">S-OLX</h1>
                {/* to add searchbar */}
              {/* <SearchBar /> */}
              </div>
              <div className="hidden lg:block">
                {/* <SearchBar /> */}
              </div>
            </div>
            <main className="p-4">{children}</main>
          </div>
        </div>
        <MobileNav className="lg:hidden fixed bottom-0 left-0 right-0" />
        <Chatbot />
      </body>
    </html>
  )
}

