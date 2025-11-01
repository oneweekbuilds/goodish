import React, { useState } from 'react';

export interface InlineInfoProps {
  children: React.ReactNode;
}

/**
 * InlineInfo component - collapsible "What this means" blocks
 * - Starts collapsed
 * - Smooth expand/collapse animation
 * - Keyboard accessible
 */
export function InlineInfo({ children }: InlineInfoProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-3 border-l-2 border-brand pl-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm font-medium text-brand hover:text-brandDark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded"
        aria-expanded={isOpen}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`transition-transform ${isOpen ? 'rotate-90' : ''}`}
        >
          <path
            d="M6 4L10 8L6 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        What this means
      </button>

      {isOpen && (
        <div className="mt-2 text-sm text-inkMuted leading-relaxed animate-slide-up">
          {children}
        </div>
      )}
    </div>
  );
}
