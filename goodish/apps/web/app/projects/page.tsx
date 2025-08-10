'use client'

import { useState } from 'react'
import { Section, Card } from '@goodish/ui'
import { type ProjectCategory } from '@goodish/lib'
import { projects as seededProjects } from '@goodish/lib'

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

export default function ProjectsPage() {
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory | undefined>(undefined)

  const categories: ProjectCategory[] = ['nonprofit', 'percent-donated', 'impact-first']
  const filteredProjects = selectedCategory
    ? seededProjects.filter((p) => p.category === selectedCategory)
    : seededProjects

  return (
    <div>
      <Section>
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-goodish-charcoal mb-4">
            Projects
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Small, fast, AI-powered projects that do real good in the world.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <button
            onClick={() => setSelectedCategory(undefined)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              !selectedCategory
                ? 'bg-goodish-amber text-goodish-charcoal'
                : 'bg-goodish-gray text-goodish-charcoal hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-goodish-amber text-goodish-charcoal'
                  : 'bg-goodish-gray text-goodish-charcoal hover:bg-gray-200'
              }`}
            >
              {getCategoryLabel(category)}
            </button>
          ))}
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((project) => (
            <Card
              key={project.slug}
              title={project.name}
              description={project.summary}
              href={project.href}
              tag={getCategoryLabel(project.category)}
            />
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No projects found for the selected category.</p>
          </div>
        )}
      </Section>
    </div>
  )
}
