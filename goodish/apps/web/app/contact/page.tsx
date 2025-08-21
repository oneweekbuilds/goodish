import { Section } from '@goodish/ui'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact | Goodish',
  description: 'Get in touch with the Goodish team. Questions or feedback? We\'d love to hear from you.',
}

export default function ContactPage() {
  return (
    <Section className="bg-gradient-to-br from-goodish-green/5 to-goodish-teal/5">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-goodish-charcoal mb-6">
          Contact Us
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed mb-4">
          Questions or feedback? We'd love to hear from you.
        </p>
        <a 
          href="mailto:hello@goodish.org" 
          className="text-goodish-teal hover:text-goodish-green transition-colors underline font-medium"
        >
          hello@goodish.org
        </a>
      </div>
    </Section>
  )
}