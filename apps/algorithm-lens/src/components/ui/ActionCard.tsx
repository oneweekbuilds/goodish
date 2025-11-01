import React from 'react';
import { ArrowRight } from 'lucide-react';

interface ActionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
  className?: string;
}

export function ActionCard({
  icon,
  title,
  description,
  onClick,
  className = ''
}: ActionCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-6 bg-white rounded-card border border-neutral-200 shadow-card hover:shadow-elevated transition-all duration-200 text-left group focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary ${className}`}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-brand-primary/10 rounded-lg flex items-center justify-center group-hover:bg-brand-primary/20 transition-colors">
          {icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-primary mb-2 group-hover:text-brand-primary transition-colors">
            {title}
          </h3>
          <p className="text-sm text-secondary mb-3">
            {description}
          </p>
          <div className="flex items-center text-brand-primary text-sm font-medium group-hover:translate-x-1 transition-transform">
            Try this
            <ArrowRight className="w-4 h-4 ml-1" />
          </div>
        </div>
      </div>
    </button>
  );
}