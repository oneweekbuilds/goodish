import { Project, ProjectCategory } from './types';

export function filterProjects(projects: Project[], category?: ProjectCategory): Project[] {
  if (!category) return projects;
  return projects.filter(project => project.category === category);
}

export function getCategoryLabel(category: ProjectCategory): string {
  switch (category) {
    case 'nonprofit':
      return 'Nonprofit';
    case 'percent-donated':
      return 'For-profit (% donated)';
    case 'impact-first':
      return 'For-profit (impact-first)';
    default:
      return category;
  }
}
