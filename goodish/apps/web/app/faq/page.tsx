'use client'

import { useState } from 'react'
import { Section, Button } from '@goodish/ui'
import Link from 'next/link'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface FAQItem {
  id: string
  question: string
  answer: string | React.ReactNode
}

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())

  const faqs: FAQItem[] = [
    {
      id: 'what-is-goodish',
      question: 'What is Goodish?',
      answer: 'Goodish is a collection of small, mission-driven projects built quickly with AI. The goal is to make doing good feel easy—even if you\'re busy—by showing real examples and inviting support.'
    },
    {
      id: 'nonprofits-or-for-profits',
      question: 'Are these nonprofits or for-profits?',
      answer: 'Both. Some projects are nonprofits; others are for-profits that donate a portion. Several projects also help people find and support existing nonprofits aligned with what they care about.'
    },
    {
      id: 'registered-501c3',
      question: 'Is Goodish a registered 501(c)(3)?',
      answer: 'No. Goodish itself is not a registered nonprofit. When a project points you to donate, it\'s usually to established nonprofits we think are impactful.'
    },
    {
      id: 'how-fast-projects-built',
      question: 'How fast are projects built?',
      answer: 'Many are built in hours with AI scaffolding. Timelines can vary based on scope.'
    },
    {
      id: 'how-can-i-help',
      question: 'How can I help?',
      answer: (
        <>
          The simplest way is to use and share the projects or sign up for updates. Interacting with the products, donating to the causes they highlight, and sharing the mission with others all help. Even posting a link to Goodish on social media{' '}
          (<a href="https://x.com/Goodish_org" target="_blank" rel="noopener noreferrer" className="text-goodish-teal hover:underline">for example, on X</a>){' '}
          can lead someone to discover and support a project.
        </>
      )
    }
  ];

  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems)
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id)
    } else {
      newOpenItems.add(id)
    }
    setOpenItems(newOpenItems)
  }

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggleItem(id)
    }
  }

  return (
    <div>
      <Section className="bg-gradient-to-br from-goodish-green/5 to-goodish-teal/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-goodish-charcoal mb-6">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              Everything you need to know about Goodish, our projects, and how we work.
            </p>
          </div>


          {/* FAQ Accordions */}
          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openItems.has(faq.id)
              return (
                <div key={faq.id} id={faq.id} className="bg-white rounded-2xl shadow-sm border border-goodish-gray overflow-hidden">
                  <button
                    onClick={() => toggleItem(faq.id)}
                    onKeyDown={(e) => handleKeyDown(e, faq.id)}
                    className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-goodish-teal focus-visible:ring-offset-2"
                    aria-expanded={isOpen}
                    aria-controls={`faq-content-${faq.id}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-goodish-teal/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-goodish-teal">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-goodish-charcoal mb-2">
                          {faq.question}
                        </h3>
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-4">
                      {isOpen ? (
                        <ChevronUp className="h-5 w-5 text-goodish-teal" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-goodish-teal" />
                      )}
                    </div>
                  </button>
                  
                  <div
                    id={`faq-content-${faq.id}`}
                    className={`px-8 pb-6 transition-all duration-300 ease-in-out ${
                      isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
                    }`}
                    aria-hidden={!isOpen}
                  >
                    <div className="pl-12">
                      <p className="text-gray-600 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* CTA Buttons */}
          <div className="text-center mt-16">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/projects">
                <Button size="lg">
                  Explore Projects
                </Button>
              </Link>
              <Link href="/about">
                <Button variant="secondary" size="lg">
                  Learn More About Us
                </Button>
              </Link>
              <Link href="/">
                <Button variant="ghost" size="lg">
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Section>
    </div>
  )
}
