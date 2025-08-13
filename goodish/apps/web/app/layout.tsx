import type { Metadata } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import '@goodish/ui/styles/globals.css'
import { Navbar } from '@goodish/ui'
import { Footer } from '@goodish/ui'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-plus-jakarta' })

export const metadata: Metadata = {
  title: 'Goodish - AI-powered projects that do good',
  description: 'Doing good is no longer hard. AI makes it easier—and you can do it too. Goodish is a home for small, fast, mission-driven projects.',
  keywords: 'AI, good, projects, nonprofit, impact, charity, social good, technology for good',
  authors: [{ name: 'Goodish Team' }],
  openGraph: {
    title: 'Goodish - AI-powered projects that do good',
    description: 'Doing good is no longer hard. AI makes it easier—and you can do it too.',
    type: 'website',
    url: 'https://goodish.org',
    siteName: 'Goodish',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Goodish - AI-powered projects that do good',
    description: 'Doing good is no longer hard. AI makes it easier—and you can do it too.',
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
          {/* Skip to content links for accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-goodish-teal text-white px-4 py-2 rounded-lg z-50"
          >
            Skip to main content
          </a>
          
          <header>
            <Navbar />
          </header>
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <footer>
            <Footer />
          </footer>
        </div>
      </body>
    </html>
  )
}
