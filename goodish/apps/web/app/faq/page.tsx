import { Section, Button } from '@goodish/ui'
import Link from 'next/link'
import { ArrowUp, ExternalLink } from 'lucide-react'

export default function FAQPage() {
  const faqs = [
    {
      id: 'what-is-goodish',
      question: 'What is Goodish?',
      answer: 'Goodish is a collection of nonprofits and for-profit projects (with a portion donated to charity) built in just a few hours using AI. We prove it\'s easy to do good, even if you\'re busy.'
    },
    {
      id: 'nonprofits-or-for-profits',
      question: 'Are these nonprofits or for-profits?',
      answer: 'Both! Goodish is an umbrella brand. Some projects are independently registered nonprofits, some are for-profit businesses that donate a portion of revenue to charity, and some are for-profit products with a clear social mission. We\'re transparent about which is which.'
    },
    {
      id: 'how-donations-work',
      question: 'How do donations work?',
      answer: 'For nonprofit projects, donations go directly to the registered nonprofit. For for-profit projects that donate, a portion of revenue is automatically donated to vetted charities. We maintain radical transparency around all donation flows and impact.'
    },
    {
      id: 'built-in-hours',
      question: 'How fast are projects built and why "in a few hours"?',
      answer: 'We scope projects to be completable in 2-4 hours using AI assistance, proven templates, and small, focused problems. This proves that meaningful impact doesn\'t require months of development—just clear thinking and the right tools.'
    },
    {
      id: 'tools-ai-used',
      question: 'What tools/AI do you use?',
      answer: 'We use modern AI coding assistants (like GitHub Copilot, Claude, GPT-4) for scaffolding, along with proven templates and frameworks. The key is not the specific tools, but the approach: small scope, clear problem definition, and rapid iteration.'
    },
    {
      id: 'suggest-collaborate',
      question: 'Can I suggest a project or collaborate?',
      answer: 'Yes! We welcome project ideas and collaboration. The best projects are small, focused problems that can be solved in a few hours. Reach out through our channels or join our list for updates on collaboration opportunities.'
    },
    {
      id: 'registered-501c3',
      question: 'Is this a registered 501(c)(3)?',
      answer: 'Goodish itself is not a registered 501(c)(3). We\'re an umbrella brand that includes both nonprofit and for-profit projects. Individual projects may be registered nonprofits, and we\'re transparent about the structure of each project.'
    },
    {
      id: 'open-source-transparency',
      question: 'Are projects open source? How transparent are you?',
      answer: 'We believe in radical transparency. Most projects are open source, and we share how things are built so anyone can replicate or contribute. We publish donation flows, impact metrics, and the full development process.'
    },
    {
      id: 'choose-causes',
      question: 'How do you choose causes?',
      answer: 'We focus on causes where small, focused tools can make a meaningful difference. We prioritize high-impact interventions, transparency, and causes where technology can reduce friction or increase access. Each project addresses a specific, well-defined problem.'
    },
    {
      id: 'help-30-minutes',
      question: 'What if I only have 30 minutes a week—how can I help?',
      answer: 'Perfect! That\'s exactly what Goodish is designed for. You can suggest project ideas, test our tools, share them with others, or even build your own small project. The key is starting small and focusing on clear, achievable impact.'
    }
  ];

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

          {/* Table of Contents */}
          <div className="mb-16 bg-white rounded-2xl p-8 shadow-sm border border-goodish-gray">
            <h2 className="text-2xl font-bold text-goodish-charcoal mb-6">Quick Navigation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {faqs.map((faq, index) => (
                <a
                  key={faq.id}
                  href={`#${faq.id}`}
                  className="text-goodish-teal hover:text-goodish-green transition-colors flex items-center gap-2 group"
                >
                  <span className="text-sm font-medium group-hover:underline">
                    {index + 1}. {faq.question}
                  </span>
                  <ArrowUp className="h-3 w-3 rotate-45" />
                </a>
              ))}
            </div>
          </div>

          {/* FAQ Items */}
          <div className="space-y-12">
            {faqs.map((faq, index) => (
              <div key={faq.id} id={faq.id} className="bg-white rounded-2xl p-8 shadow-sm border border-goodish-gray">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-goodish-teal/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-goodish-teal">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-goodish-charcoal mb-4">
                      {faq.question}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
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
