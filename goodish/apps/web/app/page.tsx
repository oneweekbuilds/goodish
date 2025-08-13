import { Button, Section, Card, EmailSignup } from '@goodish/ui'
import Link from 'next/link'

export default function HomePage() {
  const featuredProjects = [
    {
      title: 'GoodHeart',
      description: 'A quiz that matches your giving superpower to high-impact charities.',
      href: '/goodheart',
      tag: 'Nonprofit'
    },
    {
      title: 'Trilert',
      description: 'A simple tool to avoid surprise charges—cancel trials on time.',
      href: '#',
      tag: 'For-profit (% donated)'
    },
    {
      title: 'Next up',
      description: 'Coming soon.',
      href: '#',
      tag: 'Coming soon'
    }
  ];

  const howItWorks = [
    {
      title: 'Build fast',
      description: 'AI lowers the barrier. We ship small tools quickly.'
    },
    {
      title: 'Design for good',
      description: 'Every project aims for real-world benefit.'
    },
    {
      title: 'Show & inspire',
      description: 'We share how it\'s built so anyone can try.'
    }
  ];

  return (
    <div>
      {/* Hero Section */}
      <Section className="bg-gradient-to-br from-goodish-green via-goodish-green/90 to-goodish-teal text-white">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
            Doing good is no longer hard.
          </h1>
          <p className="text-xl md:text-2xl mb-10 text-green-50 leading-relaxed max-w-3xl mx-auto">
            AI makes it easier—and you can do it too. Goodish is a home for small, fast, mission-driven projects. Some are nonprofits, some donate a percentage, and some are for-profit with purpose—all designed to make doing good easier.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/projects">
              <Button size="lg" className="text-goodish-charcoal">
                Explore Projects
              </Button>
            </Link>
            <Link href="#signup">
              <Button variant="secondary" size="lg" className="border-white text-white hover:bg-white hover:text-goodish-charcoal">
                Join the List
              </Button>
            </Link>
          </div>
        </div>
      </Section>

      {/* How it works */}
      <Section>
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-goodish-charcoal mb-6">
            How it works
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We believe in building fast, designing for good, and inspiring others to do the same.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {howItWorks.map((item, index) => (
            <div key={index} className="text-center">
              <h3 className="text-2xl font-semibold text-goodish-charcoal mb-4">
                {item.title}
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* Featured Projects */}
      <Section className="bg-gray-50">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-goodish-charcoal mb-6">
            Featured Projects
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover our latest projects that are making a difference in the world.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featuredProjects.map((project, index) => (
            <Card
              key={index}
              title={project.title}
              description={project.description}
              href={project.href}
              tag={project.tag}
            />
          ))}
        </div>
      </Section>

      {/* Email Signup */}
      <Section>
        <div id="signup" className="flex justify-center">
          <EmailSignup 
            title="Join the list"
            description="Get updates on new projects and how to build for good."
            variant="card"
          />
        </div>
      </Section>
    </div>
  )
}
