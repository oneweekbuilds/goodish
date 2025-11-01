import React from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * EmptyState component for when there's no data
 * - Consistent empty state design
 * - Optional icon and action button
 */
export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      {icon && <div className="mb-4 text-inkMuted opacity-40">{icon}</div>}

      <h3 className="text-lg font-semibold text-ink mb-2">{title}</h3>

      {description && <p className="text-sm text-inkMuted max-w-md mb-6">{description}</p>}

      {action && (
        <Button variant="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
