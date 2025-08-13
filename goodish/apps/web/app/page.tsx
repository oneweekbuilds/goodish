'use client'

import { motion } from 'framer-motion'
import { Button, Card, EmailSignup } from '@goodish/ui'
import { Section } from '../components/ui/Section'
import { ArrowRight, CheckCircle } from 'lucide-react'
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
      {/* Skip to Projects anchor */}
      <a
        href="#projects"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-goodish-teal text-white px-4 py-2 rounded-lg z-50"
      >
        Skip to Projects
      </a>

      {/* Hero Section */}
      <Section className="bg-gradient-to-br from-goodish-green via-goodish-green/90 to-goodish-teal text-white relative overflow-hidden">
        {/* Animated gradient accent */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
        
        {/* Subtle animated hero accent */}
        <div className="absolute inset-0 bg-gradient-to-br from-goodish-teal/20 via-transparent to-goodish-amber/20 blur-3xl opacity-40 animate-[pulse_6s_ease-in-out_infinite] pointer-events-none" />
        
        <motion.div 
          className="text-center max-w-4xl mx-auto relative z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h1 
            className="text-6xl md:text-8xl font-bold mb-8 leading-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Do good, faster—with AI.
          </motion.h1>
          <motion.p 
            className="text-xl md:text-2xl mb-10 text-green-50 leading-relaxed max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Goodish builds small, fast, mission‑driven projects—nonprofits, revenue‑sharing, and purpose‑led products—to make doing good easier for everyone.
          </motion.p>
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Link href="/projects">
              <Button size="lg" className="text-goodish-charcoal hover:scale-105 transition-transform group">
                Explore Projects
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="#signup">
              <Button variant="secondary" size="lg" className="border-white text-white hover:bg-white hover:text-goodish-charcoal hover:scale-105 transition-transform">
                Join the List
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </Section>

      {/* Gradient divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-goodish-teal/30 to-transparent"></div>

      {/* How it works */}
      <Section className="bg-goodish-teal/5">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-goodish-charcoal mb-6">
            How it works
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We believe in building fast, designing for good, and inspiring others to do the same.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {howItWorks.map((item, index) => (
            <motion.div 
              key={index} 
              className="text-center group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
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
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Gradient divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-goodish-amber/30 to-transparent"></div>

      {/* Featured Projects */}
      <Section id="projects" className="bg-goodish-amber/5">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-goodish-charcoal mb-6">
            Featured Projects
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover our latest projects that are making a difference in the world.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featuredProjects.map((project, index) => (
            <motion.div 
              key={index} 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card
                title={project.title}
                description={project.description}
                href={project.href}
                tag={project.tag}
              />
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Gradient divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-goodish-green/30 to-transparent"></div>

      {/* Email Signup */}
      <Section className="bg-goodish-green/5">
        <motion.div 
          id="signup" 
          className="flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <EmailSignup 
            title="Join the list"
            description="Get updates on new projects and how to build for good."
            variant="card"
          />
        </motion.div>
      </Section>
    </div>
  )
}
