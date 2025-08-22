import type { Metadata } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import '@goodish/ui/styles/globals.css'
import { Navbar } from '@goodish/ui'
import { Footer } from '@goodish/ui'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-plus-jakarta' })

export const metadata: Metadata = {
  title: 'Goodish - AI-powered projects that do good',
  description: 'Goodish is a collection of nonprofits and for-profit projects (with a portion donated to charity) built in just a few hours using AI—proving it\'s easy to do good, even if you\'re busy.',
  keywords: 'AI, good, projects, nonprofit, impact, charity, social good, technology for good, built in hours',
  authors: [{ name: 'Goodish Team' }],
  creator: 'Goodish',
  publisher: 'Goodish',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://goodish.org'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Goodish - AI-powered projects that do good',
    description: 'Goodish is a collection of nonprofits and for-profit projects (with a portion donated to charity) built in just a few hours using AI—proving it\'s easy to do good, even if you\'re busy.',
    type: 'website',
    url: 'https://goodish.org',
    siteName: 'Goodish',
    locale: 'en_US',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Goodish - AI-powered projects that do good',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Goodish - AI-powered projects that do good',
    description: 'Goodish is a collection of nonprofits and for-profit projects (with a portion donated to charity) built in just a few hours using AI—proving it\'s easy to do good, even if you\'re busy.',
    creator: '@goodish',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Structured Data */}
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Goodish",
              "url": "https://goodish.org",
              "logo": "https://goodish.org/logo.png",
              "description": "AI-powered projects that direct money and energy toward doing good in the world.",
              "foundingDate": "2024",
              "sameAs": [
                "https://twitter.com/goodish"
              ],
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer service",
                "availableLanguage": "English"
              }
            })
          }}
        />
        <Script src="https://subscribe-forms.beehiiv.com/embed.js" strategy="afterInteractive" />
        <Script src="https://subscribe-forms.beehiiv.com/attribution.js" strategy="afterInteractive" />
      </head>
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
