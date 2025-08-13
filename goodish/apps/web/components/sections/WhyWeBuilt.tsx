import { Section, Button } from '@goodish/ui'
import Link from 'next/link'

export function WhyWeBuilt() {
  return (
    <>
      {/* Gradient divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-goodish-teal/30 to-transparent"></div>
      
      <Section className="bg-goodish-teal/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-goodish-charcoal mb-6">
              Why we built this
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
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

          <div className="mb-12">
            <h3 className="text-2xl font-bold text-goodish-charcoal mb-8 text-center">
              Principles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white/80 backdrop-blur rounded-xl p-6 border border-goodish-teal/10 hover:border-goodish-teal/20 transition-colors">
                <div className="w-8 h-8 bg-goodish-teal/10 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-goodish-teal font-bold">1</span>
                </div>
                <h4 className="font-semibold text-goodish-charcoal mb-2">Small scope, shipped fast</h4>
              </div>
              
              <div className="bg-white/80 backdrop-blur rounded-xl p-6 border border-goodish-green/10 hover:border-goodish-green/20 transition-colors">
                <div className="w-8 h-8 bg-goodish-green/10 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-goodish-green font-bold">2</span>
                </div>
                <h4 className="font-semibold text-goodish-charcoal mb-2">Give-back baked in</h4>
              </div>
              
              <div className="bg-white/80 backdrop-blur rounded-xl p-6 border border-goodish-amber/10 hover:border-goodish-amber/20 transition-colors">
                <div className="w-8 h-8 bg-goodish-amber/10 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-goodish-amber font-bold">3</span>
                </div>
                <h4 className="font-semibold text-goodish-charcoal mb-2">Public by default</h4>
              </div>
              
              <div className="bg-white/80 backdrop-blur rounded-xl p-6 border border-goodish-teal/10 hover:border-goodish-teal/20 transition-colors">
                <div className="w-8 h-8 bg-goodish-teal/10 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-goodish-teal font-bold">4</span>
                </div>
                <h4 className="font-semibold text-goodish-charcoal mb-2">Repeatable playbooks</h4>
              </div>
              
              <div className="bg-white/80 backdrop-blur rounded-xl p-6 border border-goodish-green/10 hover:border-goodish-green/20 transition-colors md:col-span-2 lg:col-span-1">
                <div className="w-8 h-8 bg-goodish-green/10 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-goodish-green font-bold">5</span>
                </div>
                <h4 className="font-semibold text-goodish-charcoal mb-2">Bias to action over polish</h4>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link href="#signup">
              <Button size="lg" className="text-xl px-12 py-4 shadow-lg hover:shadow-xl">
                Get build updates
              </Button>
            </Link>
          </div>
        </div>
      </Section>

      {/* Gradient divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-goodish-green/30 to-transparent"></div>
    </>
  )
}
