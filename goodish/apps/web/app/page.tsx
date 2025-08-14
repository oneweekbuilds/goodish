'use client'

// import { motion } from 'framer-motion'
import { Button, Card, EmailSignup, InlineSignup } from '@goodish/ui'
import { Section } from '../components/ui/Section'
import { AmbientSpotlight } from '../components/hero/AmbientSpotlight'
import { ArrowRight, CheckCircle, Clock, Heart, Zap, Brain, Share2, Sparkles, Rocket } from 'lucide-react'
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

  const buildSteps = [
    {
      title: 'Plan',
      description: 'Identify a clear problem and scope it to a few hours of work.',
      icon: Brain,
      color: 'goodish-teal'
    },
    {
      title: 'Generate & Wire',
      description: 'Use AI to scaffold the code and wire up the core functionality.',
      icon: Zap,
      color: 'goodish-amber'
    },
    {
      title: 'Ship & Donate',
      description: 'Deploy immediately and set up revenue sharing or nonprofit structure.',
      icon: Heart,
      color: 'goodish-green'
    }
  ];

  const badges = [
    { label: 'Nonprofits', icon: Heart, color: 'goodish-green' },
    { label: 'For-profits that donate', icon: ArrowRight, color: 'goodish-teal' },
    { label: 'Built in hours', icon: Clock, color: 'goodish-amber' },
    { label: 'AI-powered', icon: Brain, color: 'goodish-charcoal' }
  ];

  const busyPeopleFeatures = [
    {
      title: 'Small scope',
      description: 'Focus on one clear problem that can be solved in hours, not months.',
      icon: Sparkles
    },
    {
      title: 'AI assistance',
      description: 'Use proven AI tools to scaffold code and reduce development time.',
      icon: Brain
    },
    {
      title: 'Template reuse',
      description: 'Build on existing patterns and templates for faster deployment.',
      icon: Rocket
    }
  ];

  return (
    <div>
      {/* Skip to Projects anchor */}
      <a
        href="#projects"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-goodish-teal text-white px-4 py-2 rounded-lg z-50"
      >
        Skip to Projects
      </a>

      {/* Hero Section */}
      <Section className="bg-gradient-to-br from-goodish-green via-goodish-green/90 to-goodish-teal text-white relative overflow-hidden pt-20 pb-12 md:pt-24 md:pb-16">
        {/* Ambient spotlight */}
        <AmbientSpotlight />
        
        <div 
          className="text-center max-w-4xl mx-auto relative z-10 space-y-4 md:space-y-6"
        >
          <h1 
            className="text-6xl md:text-8xl font-bold leading-tight"
          >
            Do good, faster—with AI.
          </h1>
          <p 
            className="text-xl md:text-2xl text-green-50 leading-relaxed max-w-3xl mx-auto"
          >
            Goodish showcases small, fast, mission-driven projects—some nonprofits and some for-profits that donate a portion—built in hours with AI. Explore them, support the causes, and get inspired to build when you can.
          </p>
          
          {/* Mission badges */}
          <div 
            className="flex flex-wrap justify-center gap-3"
          >
            {badges.map((badge, index) => (
              <span
                key={badge.label}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-white/10 backdrop-blur border border-white/20 text-white`}
              >
                <badge.icon className="h-4 w-4" />
                {badge.label}
              </span>
            ))}
          </div>
          
          <div 
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/projects">
              <Button size="lg" className="text-goodish-charcoal hover:scale-105 transition-transform group">
                Explore Projects
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="#signup">
              <Button variant="secondary" size="lg" className="border-white text-white hover:bg-white hover:text-goodish-charcoal hover:scale-105 transition-transform">
                Get build updates
              </Button>
            </Link>
          </div>
        </div>
      </Section>

      {/* Gradient divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-goodish-teal/30 to-transparent"></div>

      {/* For busy people strip */}
      <Section className="bg-goodish-amber/5">
        <div 
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-goodish-charcoal mb-4">
            Even if you're busy
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Goodish reduces friction so you can make an impact with minimal time investment.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {busyPeopleFeatures.map((feature, index) => (
            <div 
              key={index} 
              className="text-center"
            >
              <div className="w-12 h-12 bg-goodish-amber/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <feature.icon className="text-xl text-goodish-amber" />
              </div>
              <h3 className="text-lg font-semibold text-goodish-charcoal mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
        <div 
          className="text-center"
        >
          <Link href="#signup">
            <Button size="lg" className="text-lg px-10 py-3 shadow-lg hover:shadow-xl">
              Get build updates
            </Button>
          </Link>
        </div>
      </Section>

      {/* Gradient divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-goodish-teal/30 to-transparent"></div>

      {/* How we build in hours */}
      <Section className="bg-goodish-teal/5">
        <div 
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-goodish-charcoal mb-6">
            How we build in hours
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Small scope, AI assistance, and proven templates let us ship meaningful projects quickly.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {buildSteps.map((step, index) => (
            <div 
              key={index} 
              className="text-center group"
            >
              <div className={`w-16 h-16 bg-${step.color}/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform`}>
                <step.icon className={`text-2xl text-${step.color}`} />
              </div>
              <h3 className="text-2xl font-semibold text-goodish-charcoal mb-4">
                {step.title}
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* Gradient divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-goodish-amber/30 to-transparent"></div>

      {/* How it works */}
      <Section className="bg-goodish-amber/5">
        <div 
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-goodish-charcoal mb-6">
            How it works
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We believe in building fast, designing for good, and inspiring others to do the same.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {howItWorks.map((item, index) => (
            <div 
              key={index} 
              className="text-center group"
            >
              <div className="w-16 h-16 bg-goodish-teal/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <CheckCircle className="text-2xl text-goodish-teal" />
              </div>
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

      {/* Gradient divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-goodish-green/30 to-transparent"></div>

      {/* Featured Projects */}
      <Section id="projects" className="bg-goodish-green/5">
        <div 
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-goodish-charcoal mb-6">
            Featured Projects
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover our latest projects that are making a difference in the world.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featuredProjects.map((project, index) => (
            <div 
              key={index} 
            >
              <Card
                title={project.title}
                description={project.description}
                href={project.href}
                tag={project.tag}
              />
            </div>
          ))}
        </div>
      </Section>

      {/* Gradient divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-goodish-teal/30 to-transparent"></div>

      {/* Email Signup */}
      <Section className="bg-goodish-teal/5 py-12 md:py-16" id="signup">
        <div 
          className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8"
        >
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
