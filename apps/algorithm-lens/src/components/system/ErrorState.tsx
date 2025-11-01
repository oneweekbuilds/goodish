import React from 'react';
import { Button } from './Button';

export interface ErrorStateProps {
  title: string;
  message?: string;
  error?: Error;
  onRetry?: () => void;
  onViewLogs?: () => void;
}

/**
 * ErrorState component for error handling
 * - Replaces alert popups with inline error blocks
 * - Optional retry and view logs actions
 */
export function ErrorState({ title, message, error, onRetry, onViewLogs }: ErrorStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 px-6 text-center"
      role="alert"
      aria-live="polite"
    >
      {/* Error Icon */}
      <div className="mb-4 text-neg">
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="24" cy="24" r="20" fill="currentColor" fillOpacity="0.1" />
          <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" />
          <path
            d="M24 16V26M24 32V32.01"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <h3 className="text-lg font-semibold text-ink mb-2">{title}</h3>

      {message && <p className="text-sm text-inkMuted max-w-md mb-2">{message}</p>}

      {error && (
        <details className="text-xs text-inkMuted max-w-md mb-6">
          <summary className="cursor-pointer hover:text-ink">Technical details</summary>
          <pre className="mt-2 p-3 bg-neuLight rounded text-left overflow-auto">
            {error.message}
            {error.stack && `\n\n${error.stack}`}
          </pre>
        </details>
      )}

      <div className="flex gap-3 mt-4">
        {onRetry && (
          <Button variant="primary" onClick={onRetry}>
            Try Again
          </Button>
        )}
        {onViewLogs && (
          <Button variant="secondary" onClick={onViewLogs}>
            View Logs
          </Button>
        )}
      </div>
    </div>
  );
}
