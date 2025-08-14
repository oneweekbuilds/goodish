import { Section, Button } from '@goodish/ui'
import Link from 'next/link'

export function WhyWeBuilt() {
  return (
    <section className="py-16 md:py-24 bg-goodish-teal/5">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
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

        {/* Principles Section */}
        <div className="mb-12">
          <h2 className="text-center font-semibold text-3xl md:text-4xl tracking-tight text-goodish-charcoal">Principles</h2>
          <p className="mt-2 text-center text-balance text-gray-600">Our approach to building projects that matter</p>
          
          <div className="mt-8 space-y-6">
            {/* Top row: 3 cards centered */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              <div className="h-full">
                <div className="h-full rounded-2xl border bg-white shadow-sm transition hover:shadow-md">
                  <div className="h-full p-6 flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-semibold bg-goodish-teal/10 text-goodish-teal">
                      1
                    </div>
                    <div>
                      <h4 className="text-base md:text-lg font-medium text-goodish-charcoal">Small scope, shipped fast</h4>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="h-full">
                <div className="h-full rounded-2xl border bg-white shadow-sm transition hover:shadow-md">
                  <div className="h-full p-6 flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-semibold bg-goodish-green/10 text-goodish-green">
                      2
                    </div>
                    <div>
                      <h4 className="text-base md:text-lg font-medium text-goodish-charcoal">Give-back baked in</h4>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="h-full sm:col-span-2 lg:col-span-1">
                <div className="h-full rounded-2xl border bg-white shadow-sm transition hover:shadow-md">
                  <div className="h-full p-6 flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-semibold bg-goodish-amber/10 text-goodish-amber">
                      3
                    </div>
                    <div>
                      <h4 className="text-base md:text-lg font-medium text-goodish-charcoal">Public by default</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Bottom row: 2 cards centered */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 max-w-2xl mx-auto">
              <div className="h-full">
                <div className="h-full rounded-2xl border bg-white shadow-sm transition hover:shadow-md">
                  <div className="h-full p-6 flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-semibold bg-goodish-teal/10 text-goodish-teal">
                      4
                    </div>
                    <div>
                      <h4 className="text-base md:text-lg font-medium text-goodish-charcoal">Repeatable playbooks</h4>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="h-full">
                <div className="h-full rounded-2xl border bg-white shadow-sm transition hover:shadow-md">
                  <div className="h-full p-6 flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-semibold bg-goodish-green/10 text-goodish-green">
                      5
                    </div>
                    <div>
                      <h4 className="text-base md:text-lg font-medium text-goodish-charcoal">Bias to action over polish</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-10 flex flex-col items-center gap-4">
          <Link href="#signup">
            <Button size="lg" className="h-11 px-6 rounded-2xl">
              Get build updates
            </Button>
          </Link>
          <p className="text-sm text-gray-600">
            <a 
              href="https://x.com/Goodish_org" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-goodish-teal hover:underline"
            >
              Follow Goodish on X
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}
