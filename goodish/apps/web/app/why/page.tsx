import { Section, EmailSignup } from '@goodish/ui'
import { WhyWeBuilt } from '../../components/sections/WhyWeBuilt'

export default function WhyPage() {
  return (
    <div>
      {/* Why We Built This section */}
      <WhyWeBuilt />

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