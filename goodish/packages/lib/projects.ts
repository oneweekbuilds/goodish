import type { Project } from './types'

export const projects: Project[] = [
  {
    slug: 'goodheart',
    name: 'GoodHeart',
    summary: 'A quiz that matches your giving superpower to high-impact charities.',
    category: 'nonprofit',
    href: '/goodheart',
  },
  {
    slug: 'trilert',
    name: 'Trilert',
    summary: 'A simple tool to avoid surprise charges—cancel trials on time.',
    category: 'percent-donated',
    href: '#',
    hidden: true,
  },
  {
    slug: 'next-up',
    name: 'Next up',
    summary: 'Coming soon.',
    category: 'impact-first',
    href: '#',
  },
]
