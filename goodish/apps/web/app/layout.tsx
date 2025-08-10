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
  keywords: 'AI, good, projects, nonprofit, impact, charity',
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
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  )
}
