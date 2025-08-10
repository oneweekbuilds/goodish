import { Section, EmailSignup } from '@goodish/ui'

export default function AboutPage() {
  const faqs = [
    {
      question: 'Are you a nonprofit?',
      answer: 'No. Goodish is an umbrella brand. Some projects are nonprofits; others aren\'t. We\'re transparent about which is which.'
    },
    {
      question: 'How can I get updates?',
      answer: 'Join the list at the bottom of any page.'
    },
    {
      question: 'Can I contact you?',
      answer: 'We don\'t publish a contact email yet. Please join the list for updates.'
    }
  ];

  return (
    <div>
      <Section>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-goodish-charcoal mb-6">
              About Goodish
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Goodish is a studio and platform for building small, fast, AI-powered projects that do real good. We believe anyone can build something that helps—AI makes it easier than ever.
            </p>
          </div>

          {/* How Goodish works */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-goodish-charcoal mb-8">
              How Goodish works
            </h2>
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold text-goodish-charcoal mb-3">
                  Nonprofit projects
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Some projects are independently registered nonprofits or are run in collaboration with nonprofits. Goodish takes no money from them.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-goodish-charcoal mb-3">
                  For-profit with % donated
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Some projects are businesses that donate a portion of revenue to charity.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-goodish-charcoal mb-3">
                  For-profit with a mission
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Some are sustainable products with a clear social or environmental goal.
                </p>
              </div>
            </div>
            
            <div className="mt-8 p-6 bg-goodish-gray rounded-lg">
              <p className="text-goodish-charcoal font-medium">
                What connects them all: each project is designed to deliver meaningful benefit to people or the planet.
              </p>
            </div>
          </div>

          {/* What you can expect */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-goodish-charcoal mb-8">
              What you can expect
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-goodish-charcoal mb-3">
                  New projects shipped quickly
                </h3>
                <p className="text-gray-600">
                  We move fast and ship small tools that make a difference.
                </p>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-goodish-charcoal mb-3">
                  Clear, simple ways to contribute or replicate
                </h3>
                <p className="text-gray-600">
                  We share how things are built so anyone can try.
                </p>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-goodish-charcoal mb-3">
                  Radical transparency
                </h3>
                <p className="text-gray-600">
                  Around donations and impact as things evolve.
                </p>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-goodish-charcoal mb-8">
              FAQ
            </h2>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="border-b border-goodish-gray pb-6">
                  <h3 className="text-lg font-semibold text-goodish-charcoal mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-gray-600">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Email signup */}
          <div className="text-center">
            <EmailSignup 
              title="Join the list"
              description="Get updates on new projects and how to build for good."
              variant="card"
            />
          </div>
        </div>
      </Section>
    </div>
  )
}
