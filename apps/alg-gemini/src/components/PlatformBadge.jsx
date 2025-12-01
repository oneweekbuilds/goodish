import React from 'react';

// Platform configuration with icons and colors
const PLATFORM_CONFIG = {
  tiktok: {
    name: 'TikTok',
    icon: '📱',
    bgColor: 'bg-slate-900',
    textColor: 'text-white',
    borderColor: 'border-slate-900',
  },
  instagram: {
    name: 'Instagram',
    icon: '📷',
    bgColor: 'bg-pink-600',
    textColor: 'text-white',
    borderColor: 'border-pink-600',
  },
  youtube: {
    name: 'YouTube',
    icon: '▶️',
    bgColor: 'bg-red-600',
    textColor: 'text-white',
    borderColor: 'border-red-600',
  },
  x: {
    name: 'X',
    icon: '𝕏',
    bgColor: 'bg-slate-900',
    textColor: 'text-white',
    borderColor: 'border-slate-900',
  },
  twitter: {
    name: 'X',
    icon: '𝕏',
    bgColor: 'bg-slate-900',
    textColor: 'text-white',
    borderColor: 'border-slate-900',
  },
  facebook: {
    name: 'Facebook',
    icon: '👤',
    bgColor: 'bg-blue-600',
    textColor: 'text-white',
    borderColor: 'border-blue-600',
  },
};

const PlatformBadge = ({ platform, size = 'md', showLabel = true, variant = 'filled' }) => {
  const config = PLATFORM_CONFIG[platform?.toLowerCase()] || {
    name: platform || 'Unknown',
    icon: '📊',
    bgColor: 'bg-slate-600',
    textColor: 'text-white',
    borderColor: 'border-slate-600',
  };

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

export const getPlatformConfig = (platform) => {
  return PLATFORM_CONFIG[platform?.toLowerCase()] || {
    name: platform || 'Unknown',
    icon: '📊',
    bgColor: 'bg-slate-600',
    textColor: 'text-white',
    borderColor: 'border-slate-600',
  };
};

export default PlatformBadge;



