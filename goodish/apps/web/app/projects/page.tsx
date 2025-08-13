'use client'

import { useState } from 'react'
import { Section, Button } from '@goodish/ui'
import { type ProjectCategory } from '@goodish/lib'
import { projects as seededProjects } from '@goodish/lib'
import { ArrowRight, Filter } from 'lucide-react'
import Link from 'next/link'

function getCategoryLabel(category: ProjectCategory): string {
  switch (category) {
    case 'nonprofit':
      return 'Nonprofit'
    case 'percent-donated':
      return 'For-profit (% donated)'
    case 'impact-first':
      return 'For-profit (impact-first)'
  }
}

function getCategoryColor(category: ProjectCategory): string {
  switch (category) {
    case 'nonprofit':
      return 'bg-goodish-green/10 text-goodish-green border-goodish-green/20'
    case 'percent-donated':
      return 'bg-goodish-teal/10 text-goodish-teal border-goodish-teal/20'
    case 'impact-first':
      return 'bg-goodish-amber/10 text-goodish-amber border-goodish-amber/20'
  }
}

function getProjectGradient(slug: string): string {
  const gradients = {
    'goodheart': 'from-goodish-green/20 to-goodish-teal/20',
    'trilert': 'from-goodish-amber/20 to-goodish-teal/20',
    'next-up': 'from-goodish-gray/20 to-goodish-charcoal/20'
  }
  return gradients[slug as keyof typeof gradients] || 'from-goodish-teal/20 to-goodish-green/20'
}

export default function ProjectsPage() {
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory | undefined>(undefined)

  const categories: ProjectCategory[] = ['nonprofit', 'percent-donated', 'impact-first']
  const filteredProjects = selectedCategory
    ? seededProjects.filter((p) => p.category === selectedCategory)
    : seededProjects

  return (
    <div>
      <Section className="bg-gradient-to-br from-goodish-green/5 to-goodish-teal/5">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-goodish-charcoal mb-6">
            Projects
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Small, fast, AI-powered projects that do real good in the world.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-16">
          <button
            onClick={() => setSelectedCategory(undefined)}
            className={`px-6 py-3 rounded-2xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              !selectedCategory
                ? 'bg-goodish-amber text-goodish-charcoal shadow-md'
                : 'bg-white text-goodish-charcoal hover:bg-gray-50 border border-goodish-gray'
            }`}
          >
            <Filter className="h-4 w-4" />
            All Projects
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${
                selectedCategory === category
                  ? 'bg-goodish-amber text-goodish-charcoal shadow-md'
                  : 'bg-white text-goodish-charcoal hover:bg-gray-50 border border-goodish-gray'
              }`}
            >
              {getCategoryLabel(category)}
            </button>
          ))}
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {filteredProjects.map((project) => (
            <Link
              key={project.slug}
              href={project.href}
              className="group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-goodish-teal focus-visible:ring-offset-2 rounded-2xl"
              tabIndex={0}
              role="link"
              aria-label={`Open ${project.name} - ${project.summary}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  window.location.href = project.href
                }
              }}
            >
              <div className="h-full flex flex-col bg-white rounded-2xl border border-goodish-gray shadow-sm hover:shadow-md transition-all duration-300 group-hover:-translate-y-1 group-hover:scale-[1.03] group-focus-visible:outline-none group-focus-visible:ring-2 group-focus-visible:ring-goodish-teal group-focus-visible:ring-offset-2 overflow-hidden">
                {/* Project Image/Gradient */}
                <div className={`aspect-[16/9] bg-gradient-to-br ${getProjectGradient(project.slug)} flex items-center justify-center overflow-hidden group-hover:scale-[1.03] transition-transform duration-500 ease-out`}>
                  <div className="text-6xl font-bold text-white/30">
                    {project.name.charAt(0)}
                  </div>
                </div>
                
                {/* Project Content */}
                <div className="flex flex-col gap-4 p-6 flex-1">
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-goodish-charcoal group-hover:text-goodish-teal transition-colors">
                      {project.name}
                    </h3>
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${getCategoryColor(project.category)}`}>
                      {getCategoryLabel(project.category)}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 leading-relaxed flex-1 line-clamp-3">
                    {project.summary}
                  </p>
                  
                  <div className="pt-2 mt-auto">
                    <span className="text-goodish-teal font-medium group-hover:text-goodish-green transition-colors inline-flex items-center">
                      View project 
                      <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-goodish-gray/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl text-gray-400">📋</span>
            </div>
            <h3 className="text-xl font-semibold text-goodish-charcoal mb-3">No projects found</h3>
            <p className="text-gray-500 mb-6">No projects match the selected category.</p>
            <Button 
              variant="secondary" 
              onClick={() => setSelectedCategory(undefined)}
            >
              View all projects
            </Button>
          </div>
        )}
      </Section>
    </div>
  )
}
