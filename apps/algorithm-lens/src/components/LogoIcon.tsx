import { motion } from 'motion/react';

interface LogoIconProps {
  size?: number;
  className?: string;
}

export function LogoIcon({ size = 32, className = '' }: LogoIconProps) {
  return (
    <motion.div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.3 }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Brand gradient for iris (reversed direction for depth) */}
          <linearGradient id="irisGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3ED6B2" />
            <stop offset="100%" stopColor="#7B61FF" />
          </linearGradient>
          
          {/* Inner shadow for iris */}
          <filter id="irisShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1"/>
            <feOffset dx="0" dy="1" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.18"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Outer eye - 24-stroke oval */}
        <ellipse
          cx="16"
          cy="16"
          rx="12"
          ry="8"
          stroke="url(#irisGradient)"
          strokeWidth="3"
          fill="none"
        />
        
        {/* Iris - 18px circle with gradient fill */}
        <circle
          cx="16"
          cy="16"
          r="9"
          fill="url(#irisGradient)"
          filter="url(#irisShadow)"
        />
        
        {/* Magnifier lens - 14px circle overlapped top-right */}
        <circle
          cx="20"
          cy="12"
          r="7"
          stroke="#3ED6B2"
          strokeWidth="2"
          fill="none"
        />
        
        {/* White highlight arc on lens (10% white) */}
        <path
          d="M 18 10 A 5 5 0 0 1 21 9"
          stroke="rgba(255, 255, 255, 0.4)"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Magnifier handle - diagonal rounded rectangle */}
        <line
          x1="24.5"
          y1="16.5"
          x2="28"
          y2="20"
          stroke="#3ED6B2"
          strokeWidth="2"
          strokeLinecap="round"
        />
        
        {/* Pupil shine - 2px white dot for specular highlight */}
        <circle
          cx="14.5"
          cy="14.5"
          r="1.5"
          fill="white"
          opacity="0.8"
        />
      </svg>
    </motion.div>
  );
}
