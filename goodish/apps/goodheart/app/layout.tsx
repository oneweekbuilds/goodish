import type { Metadata } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import '@goodish/ui/styles/globals.css'
import { Navbar } from '@goodish/ui'
import { Footer } from '@goodish/ui'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-plus-jakarta' })

export const metadata: Metadata = {
  title: 'GoodHeart - Goodish',
  description: 'A quiz that matches your giving superpower to high-impact charities.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${plusJakarta.variable}`}>
        <div className="min-h-screen flex flex-col">
          <Navbar 
            homeHref="http://localhost:3000"
            links={[
              { href: 'http://localhost:3000/', label: 'Home' },
              { href: 'http://localhost:3000/projects', label: 'Projects' },
              { href: 'http://localhost:3000/about', label: 'About' },
            ]}
          />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  )
}
