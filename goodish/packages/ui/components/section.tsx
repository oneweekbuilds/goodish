import React from 'react';
import { cn } from '@goodish/lib';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  container?: boolean;
  id?: string;
  as?: 'section' | 'div' | 'article';
}

export function Section({ 
  children, 
  className, 
  container = true, 
  id,
  as: Component = 'section'
}: SectionProps) {
  const content = container ? (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
      {children}
    </div>
  ) : children;

  return (
    <Component id={id} className={cn('py-20 md:py-32', className)}>
      {content}
    </Component>
  );
}
