import { motion } from 'motion/react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function BrandLogo({ size = 'md', showText = true, className = '' }: BrandLogoProps) {
  const sizes = {
    sm: { container: 32 },
    md: { container: 44 },
    lg: { container: 56 },
  };

  const { container } = sizes[size];
  const textSizes = { sm: '14px', md: '18px', lg: '24px' };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <motion.div
        className="relative flex items-center justify-center group"
        style={{ width: container, height: container }}
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.3 }}
      >
        <svg
          width={container}
          height={container}
          viewBox="0 0 56 56"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3ED6B2" />
              <stop offset="100%" stopColor="#7B61FF" />
            </linearGradient>
          </defs>
          
          {/* Eye outline - more elongated almond shape with sharper pointed ends */}
          <path
            d="M 4 28 C 4 28 8 18 12 16 C 18 13 28 13 28 13 C 28 13 38 13 44 16 C 48 18 52 28 52 28 C 52 28 48 38 44 40 C 38 43 28 43 28 43 C 28 43 18 43 12 40 C 8 38 4 28 4 28 Z"
            stroke="#5A5A5A"
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="group-hover:stroke-[url(#logoGradient)] transition-all duration-300"
          />
          
          {/* Magnifying glass lens - centered circle */}
          <circle
            cx="28"
            cy="28"
            r="9"
            stroke="#5A5A5A"
            strokeWidth="3.5"
            fill="none"
            className="group-hover:stroke-[url(#logoGradient)] transition-all duration-300"
          />
          
          {/* Magnifying glass handle - diagonal line extending from bottom-right of lens */}
          <path
            d="M 34.4 34.4 L 42 42"
            stroke="#5A5A5A"
            strokeWidth="3.5"
            strokeLinecap="round"
            className="group-hover:stroke-[url(#logoGradient)] transition-all duration-300"
          />
        </svg>
      </motion.div>

      {showText && (
        <div>
          <span
            className="block"
            style={{
              fontSize: textSizes[size],
              fontWeight: 700,
              fontFamily: 'var(--font-headline)',
              letterSpacing: '0.01em',
              color: '#3B3B3B',
            }}
          >
            AlgorithmLens
          </span>
        </div>
      )}
    </div>
  );
}

