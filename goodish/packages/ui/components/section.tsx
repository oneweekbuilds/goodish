import React from 'react';
import { cn } from '@goodish/lib';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  container?: boolean;
}

export function Section({ children, className, container = true }: SectionProps) {
  const content = container ? (
    <div className="container mx-auto px-4">
      {children}
    </div>
  ) : children;

  return (
    <section className={cn('py-12 md:py-16', className)}>
      {content}
    </section>
  );
}
