import Link from 'next/link'
import { Section, Button } from '@goodish/ui'

export default function GoodheartBridgePage() {
  return (
    <Section>
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-goodish-charcoal mb-4">GoodHeart</h1>
        <p className="text-gray-700 mb-6">GoodHeart runs as its own app. Open it below.</p>
        <Link href="http://localhost:3001">
          <Button>Open GoodHeart</Button>
        </Link>
      </div>
    </Section>
  )
}
