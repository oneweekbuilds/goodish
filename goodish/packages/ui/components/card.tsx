import React from 'react';
// removed Link import from next/link;
import { cn } from '@goodish/lib';
import { Button } from './button';

interface CardProps {
  title: string;
  description: string;
  href: string;
  tag?: string;
  className?: string;
}

export function Card({ title, description, href, tag, className }: CardProps) {
  return (
    <div className={cn('bg-white rounded-2xl border border-goodish-gray p-6 md:p-8 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-goodish-teal focus-visible:ring-offset-2 h-full flex flex-col', className)}>
      <div className="space-y-4 flex-1">
        {tag && (
          <span className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium bg-goodish-teal/10 text-goodish-teal border-goodish-teal/20">
            {tag}
          </span>
        )}

        <div className="flex-1">
          <h3 className="text-xl font-semibold text-goodish-charcoal mb-2">
            {title}
          </h3>
          <p className="text-gray-600 leading-relaxed line-clamp-3">
            {description}
          </p>
        </div>

        <div className="mt-auto pt-4">
          <a href={href}>
            <Button variant="secondary" size="sm" className="rounded-xl">
              Learn more
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
