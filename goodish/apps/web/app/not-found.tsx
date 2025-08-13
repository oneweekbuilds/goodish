import Link from 'next/link'
import { Section, Button } from '@goodish/ui'

export default function NotFound() {
  return (
    <Section>
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-6xl md:text-8xl font-bold text-goodish-green mb-4">404</h1>
        <h2 className="text-3xl md:text-4xl font-bold text-goodish-charcoal mb-6">Page not found</h2>
        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
          Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or you entered the wrong URL.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button size="lg">
              Go back home
            </Button>
          </Link>
          <Link href="/projects">
            <Button variant="secondary" size="lg">
              Explore projects
            </Button>
          </Link>
        </div>
      </div>
    </Section>
  )
}
