import React from 'react';
import Link from 'next/link';
import { cn } from '@goodish/lib';
import { Tag } from './tag';
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
    <div className={cn('bg-white rounded-lg border border-goodish-gray p-8 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1', className)}>
      <div className="space-y-6">
        <div className="space-y-3">
          <h3 className="text-xl font-semibold text-goodish-charcoal leading-tight">{title}</h3>
          {tag && <Tag>{tag}</Tag>}
        </div>
        
        <p className="text-base text-gray-600 leading-relaxed">{description}</p>
        
        <div className="pt-2">
          <Link href={href}>
            <Button variant="secondary" size="sm">
              Learn more
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
