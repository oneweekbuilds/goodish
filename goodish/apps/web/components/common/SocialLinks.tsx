import { Twitter } from 'lucide-react'

interface SocialLinksProps {
  variant?: 'icon' | 'label'
  className?: string
}

export function SocialLinks({ variant = 'icon', className = '' }: SocialLinksProps) {
  const baseClasses = variant === 'icon' 
    ? 'inline-flex h-9 w-9 items-center justify-center rounded-xl hover:bg-goodish-charcoal/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-goodish-teal transition-colors'
    : 'inline-flex items-center gap-2 text-sm hover:underline text-gray-600 hover:text-goodish-teal transition-colors'

  return (
    <a
      href="https://x.com/Goodish_org"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Goodish on X"
      className={`${baseClasses} ${className}`}
    >
      <Twitter className="h-4 w-4" />
      {variant === 'label' && <span>X (Twitter)</span>}
    </a>
  )
}