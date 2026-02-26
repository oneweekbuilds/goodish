import React from 'react';
import { getPlatformConfig } from '../config/platforms';
import PlatformIcon from './PlatformIcon';

const PlatformBadge = ({ platform, size = 'md', showLabel = true, variant = 'filled' }) => {
  const config = getPlatformConfig(platform);

  const sizeClasses = {
    sm: 'text-xs px-2 py-1 gap-1',
    md: 'text-sm px-3 py-1.5 gap-1.5',
    lg: 'text-base px-4 py-2 gap-2',
  };

  const iconPixelSizes = {
    sm: 14,
    md: 16,
    lg: 20,
  };

  if (variant === 'outline') {
    return (
      <span
        className={`inline-flex items-center rounded-full font-medium border-2 ${config.borderColor} ${sizeClasses[size]}`}
        style={{ backgroundColor: 'transparent' }}
      >
        <PlatformIcon platform={config.icon} size={iconPixelSizes[size]} />
        {showLabel && <span className="capitalize">{config.name}</span>}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${config.bgColor} ${config.textColor} ${sizeClasses[size]}`}
    >
      <PlatformIcon platform={config.icon} size={iconPixelSizes[size]} className="shrink-0" />
      {showLabel && <span>{config.name}</span>}
    </span>
  );
};

// Re-export getPlatformConfig for backwards compatibility
export { getPlatformConfig };

export default PlatformBadge;
