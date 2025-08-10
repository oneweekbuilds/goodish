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
    <div className={cn('bg-white rounded-lg border border-goodish-gray p-6 shadow-sm hover:shadow-md transition-shadow', className)}>
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-goodish-charcoal">{title}</h3>
          {tag && <Tag>{tag}</Tag>}
        </div>
        
        <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
        
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
