import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us | GoodHeart',
  description: 'Get in touch with the GoodHeart team. Questions or feedback? We\'d love to hear from you.',
}

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">Contact Us</h1>
      <p className="text-xl text-gray-600 leading-relaxed mb-4">
        Questions or feedback? We'd love to hear from you.
      </p>
      <a 
        href="mailto:hello@goodish.org" 
        className="text-[#f8cc55] hover:text-[#f0c043] transition-colors underline font-medium"
      >
        hello@goodish.org
      </a>
    </main>
  )
}