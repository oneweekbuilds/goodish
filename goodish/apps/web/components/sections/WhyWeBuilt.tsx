import { Section, Button, EmailSignup } from '@goodish/ui'
import Link from 'next/link'

export function WhyWeBuilt() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-goodish-teal/5 via-white to-goodish-green/3">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold text-goodish-charcoal mb-8 tracking-tight">
            Why we built this
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 leading-relaxed max-w-4xl mx-auto font-light">
            Most people want to help—but time, complexity, and perfectionism get in the way. Goodish is a proof that with AI, tiny scope, and repeatable playbooks, you can ship something useful in hours and make giving back part of everyday life.
          </p>
        </div>

        <div className="space-y-8 mb-12">
          <p className="text-lg text-gray-600 leading-relaxed">
            Goodish is a collection of small, fast, mission-driven projects. Some are nonprofits, some are for-profits that donate a portion of revenue. All are built quickly with AI so the bar to doing good is lower—especially if you're busy.
          </p>
          
          <p className="text-lg text-gray-600 leading-relaxed">
            We prioritize velocity and clarity over scope: ship the smallest helpful slice, learn from real users, and iterate. AI helps scaffold code, content, and ops so we spend our time on judgment and impact, not boilerplate.
          </p>
          
          <p className="text-lg text-gray-600 leading-relaxed">
            The goal isn't to be perfect. It's to make doing good feel obvious and doable—today. If more people can spin up a helpful service in an evening, the world gets a little better, a little faster.
          </p>
        </div>


        {/* Email Signup Section */}
        <div className="mt-16 mb-8">
          <EmailSignup 
            title="Follow along as new projects ship"
            description="See examples in action—subscribing helps these projects grow."
            variant="inline"
          />
        </div>

        {/* Follow X Section */}
        <div className="flex justify-center">
          <a
            href="https://x.com/Goodish_org"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-goodish-charcoal border border-goodish-charcoal px-6 text-sm font-medium text-white shadow-lg transition-all duration-300 hover:bg-gray-800 hover:border-gray-800 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            aria-label="Follow Goodish on X"
          >
            Follow Goodish on X
          </a>
        </div>
      </div>
    </section>
  )
}
