import { Section, Button } from '@goodish/ui'
import Link from 'next/link'

export default function GoodHeartPage() {
  return (
    <div>
      <Section>
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-goodish-charcoal mb-6">
            GoodHeart
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Our donation quiz is moving here soon. Stay tuned.
          </p>
          <Link href="/">
            <Button>
              Back to Goodish
            </Button>
          </Link>
        </div>
      </Section>
    </div>
  )
}
