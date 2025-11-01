import React from 'react';
import { Card } from '../ui/Card';

interface KpiStatProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  className?: string;
}

export function KpiStat({ title, subtitle, children, className = '' }: KpiStatProps) {
  return (
    <Card className={`p-5 md:p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-primary mb-1">
          {title}
        </h3>
        <p className="text-sm text-secondary">
          {subtitle}
        </p>
      </div>
      {children}
    </Card>
  );
}










