import { Section, EmailSignup, Button } from '@goodish/ui'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <div>
      <Section className="bg-gradient-to-br from-goodish-green/5 to-goodish-teal/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-goodish-charcoal mb-6 flex items-center justify-center gap-3">
              About{' '}
              <div className="flex items-center">
                <span className="text-goodish-green">Good</span>
                <span className="text-goodish-teal">ish</span>
              </div>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              Goodish is a studio and platform for building small, fast, AI-powered projects that do real good. We believe anyone can build something that helps—AI makes it easier than ever.
            </p>
          </div>

          {/* How Goodish works */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-goodish-charcoal mb-8">
              How Goodish works
            </h2>
            <div className="space-y-8">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-goodish-gray">
                <h3 className="text-xl font-semibold text-goodish-charcoal mb-3">
                  Nonprofit projects
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Some projects are independently registered nonprofits or are run in collaboration with nonprofits. Goodish takes no money from them.
                </p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-goodish-gray">
                <h3 className="text-xl font-semibold text-goodish-charcoal mb-3">
                  For-profit with % donated
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Some projects are businesses that donate a portion of revenue to charity.
                </p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-goodish-gray">
                <h3 className="text-xl font-semibold text-goodish-charcoal mb-3">
                  For-profit with a mission
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Some are sustainable products with a clear social or environmental goal.
                </p>
              </div>
            </div>
            
            <div className="mt-8 p-6 bg-goodish-teal/10 rounded-2xl border border-goodish-teal/20">
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
              <div className="text-center bg-white rounded-2xl p-6 shadow-sm border border-goodish-gray">
                <h3 className="text-lg font-semibold text-goodish-charcoal mb-3">
                  New projects shipped quickly
                </h3>
                <p className="text-gray-600">
                  We move fast and ship small tools that make a difference.
                </p>
              </div>
              <div className="text-center bg-white rounded-2xl p-6 shadow-sm border border-goodish-gray">
                <h3 className="text-lg font-semibold text-goodish-charcoal mb-3">
                  Clear, simple ways to contribute or replicate
                </h3>
                <p className="text-gray-600">
                  We share how things are built so anyone can try.
                </p>
              </div>
              <div className="text-center bg-white rounded-2xl p-6 shadow-sm border border-goodish-gray">
                <h3 className="text-lg font-semibold text-goodish-charcoal mb-3">
                  Radical transparency
                </h3>
                <p className="text-gray-600">
                  Around donations and impact as things evolve.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="text-center mb-16">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/projects">
                <Button size="lg">
                  Explore Projects
                </Button>
              </Link>
              <Link href="/">
                <Button variant="secondary" size="lg">
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Section>

      {/* Email signup - full width */}
      <Section className="bg-goodish-green/5 py-12 md:py-16">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <EmailSignup 
            title="Follow along as new projects ship"
            description="See examples in action—subscribing helps these projects grow."
            variant="inline"
          />
        </div>
      </Section>
    </div>
  )
}
