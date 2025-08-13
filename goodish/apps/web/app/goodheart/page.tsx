import Link from 'next/link'
import { Section, Button, Card } from '@goodish/ui'

export default function GoodheartBridgePage() {
  return (
    <div>
      <Section>
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-goodish-charcoal mb-6">GoodHeart</h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            A quiz that matches your giving superpower to high-impact charities.
          </p>
          <div className="mb-12">
            <Link href="http://localhost:3001">
              <Button size="lg">
                Launch GoodHeart App
              </Button>
            </Link>
          </div>
        </div>
      </Section>

      <Section className="bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card
              title="How it works"
              description="Take a short quiz to discover your giving personality and get matched with charities that align with your values and impact preferences."
              href="#"
              tag="Interactive"
            />
            <Card
              title="High-impact charities"
              description="All recommended charities are vetted for effectiveness and transparency, ensuring your donations make the biggest possible difference."
              href="#"
              tag="Vetted"
            />
          </div>
        </div>
      </Section>

      <Section>
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-6">
            GoodHeart runs as a separate application for the best user experience.
          </p>
          <Link href="http://localhost:3001">
            <Button variant="secondary" size="lg">
              Open GoodHeart App
            </Button>
          </Link>
        </div>
      </Section>
    </div>
  )
}
