import React from 'react';
import { cn } from '@goodish/lib';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  container?: boolean;
}

export function Section({ children, className, container = true }: SectionProps) {
  const content = container ? (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
      {children}
    </div>
  ) : children;

  return (
    <section className={cn('py-16 md:py-24', className)}>
      {content}
    </section>
  );
}
