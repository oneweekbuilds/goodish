import React from 'react';
import { getPlatformConfig } from '../config/platforms';

// Import centralized platform configuration (#11)
// For backwards compatibility, we re-export getPlatformConfig here

const PlatformBadge = ({ platform, size = 'md', showLabel = true, variant = 'filled' }) => {
  const config = getPlatformConfig(platform);

  const sizeClasses = {
    sm: 'text-xs px-2 py-1 gap-1',
    md: 'text-sm px-3 py-1.5 gap-1.5',
    lg: 'text-base px-4 py-2 gap-2',
  };

  const iconSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  if (variant === 'outline') {
    return (
      <span
        className={`inline-flex items-center rounded-full font-medium border-2 ${config.borderColor} ${sizeClasses[size]}`}
        style={{ backgroundColor: 'transparent', color: config.borderColor.replace('border-', 'text-') }}
      >
        <span className={iconSizes[size]}>{config.icon}</span>
        {showLabel && <span className="capitalize">{config.name}</span>}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${config.bgColor} ${config.textColor} ${sizeClasses[size]}`}
    >
      <span className={iconSizes[size]}>{config.icon}</span>
      {showLabel && <span>{config.name}</span>}
    </span>
  );
};

// Re-export getPlatformConfig for backwards compatibility
export { getPlatformConfig };

export default PlatformBadge;






