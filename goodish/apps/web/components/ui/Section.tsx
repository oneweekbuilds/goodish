import React from 'react';
import { cn } from '@goodish/lib';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  as?: keyof JSX.IntrinsicElements;
}

export function Section({ 
  children, 
  className, 
  id,
  as: Component = 'section'
}: SectionProps) {
  return (
    <Component id={id} className={cn('py-20 md:py-28', className)}>
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </Component>
  );
}
