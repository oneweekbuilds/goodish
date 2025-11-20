import React from 'react';
import { Button } from '../ui/Button';
import { InfoTooltip } from '../ui/InfoTooltip';

interface SaveShareProps {
  onShare?: () => void;
  onExport?: () => void;
  hasData?: boolean;
  className?: string;
}

export function SaveShare({ onShare, onExport, hasData = true, className = '' }: SaveShareProps) {
  return (
    <div className={`flex flex-col sm:flex-row gap-4 justify-center ${className}`}>
      <Button
        onClick={onShare}
        variant="primary"
        size="lg"
        disabled={!hasData}
        className="min-w-[160px]"
      >
        Share Snapshot
      </Button>
      
      <div className="relative">
        <Button
          onClick={onExport}
          variant="outline"
          size="lg"
          disabled={!hasData}
          className="min-w-[160px]"
        >
          Export CSV
        </Button>
        
        {!hasData && (
          <InfoTooltip
            content="No data available to export. Load sample data or connect accounts first."
            className="absolute -top-2 -right-2"
          />
        )}
      </div>
    </div>
  );
}



















