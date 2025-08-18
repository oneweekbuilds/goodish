import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { QuizProvider } from '@/src/contexts/QuizContext'
import './globals.css'
import '@/src/styles/mobile-optimizations.css'

export const metadata: Metadata = {
  title: 'GoodHeart - Give with Joy, Change the World',
  description: 'Find your perfect charity match through a 2-minute quiz. Connect with top-rated charities that align with your values.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>
        <QuizProvider>
          {children}
        </QuizProvider>
      </body>
    </html>
  )
}
