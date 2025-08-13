import type { Metadata } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import '@goodish/ui/styles/globals.css'
import { Navbar } from '@goodish/ui'
import { Footer } from '@goodish/ui'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-plus-jakarta' })

export const metadata: Metadata = {
  title: 'GoodHeart - Find Your Giving Superpower | Goodish',
  description: 'Take a quiz to discover your giving personality and get matched with high-impact charities that align with your values.',
  keywords: 'charity quiz, giving personality, high-impact charities, donation matching, philanthropy',
  authors: [{ name: 'Goodish Team' }],
  openGraph: {
    title: 'GoodHeart - Find Your Giving Superpower',
    description: 'Take a quiz to discover your giving personality and get matched with high-impact charities.',
    type: 'website',
    url: 'https://goodheart.goodish.org',
    siteName: 'GoodHeart',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GoodHeart - Find Your Giving Superpower',
    description: 'Take a quiz to discover your giving personality and get matched with high-impact charities.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${plusJakarta.variable} text-base`}>
        <div className="min-h-screen flex flex-col">
          {/* Skip to content link for accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-goodish-teal text-white px-4 py-2 rounded-md z-50"
          >
            Skip to main content
          </a>
          
          <Navbar 
            homeHref="http://localhost:3000"
            links={[
              { href: 'http://localhost:3000/', label: 'Home' },
              { href: 'http://localhost:3000/projects', label: 'Projects' },
              { href: 'http://localhost:3000/about', label: 'About' },
            ]}
          />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  )
}
