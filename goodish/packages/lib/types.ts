export type ProjectCategory = 'nonprofit' | 'percent-donated' | 'impact-first';

export interface Project {
  slug: string
  name: string
  summary: string
  category: ProjectCategory
  href: string
}
