import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact | GoodHeart',
  description: 'Get in touch with the GoodHeart team. Questions or feedback? We\'d love to hear from you.',
}

export default function ContactPage() {
  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: "#fdfaf4",
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <main className="flex-1">
        <div className="container mx-auto px-6 py-24">
          <div className="text-center max-w-3xl mx-auto">
            <h1
              className="font-bold text-gray-900 leading-tight mb-8"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "3.5rem",
                lineHeight: "1.1",
              }}
            >
              Contact Us
            </h1>
            <p
              className="text-gray-600 mb-4"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "20px",
                lineHeight: "1.6",
              }}
            >
              Questions or feedback? We'd love to hear from you.
            </p>
            <a 
              href="mailto:hello@goodish.org"
              className="text-[#F4C500] hover:text-[#FFD95C] transition-colors underline font-medium"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "18px",
              }}
            >
              hello@goodish.org
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}