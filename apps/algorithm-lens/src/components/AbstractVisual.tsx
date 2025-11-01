import { motion } from 'motion/react';

interface AbstractVisualProps {
  variant?: 'network' | 'flow' | 'pattern' | 'gradient';
  className?: string;
}

export function AbstractVisual({ variant = 'network', className = '' }: AbstractVisualProps) {
  if (variant === 'network') {
    return (
      <div className={`relative w-full h-full bg-gradient-to-br from-primary/5 via-accent/5 to-background overflow-hidden ${className}`}>
        <svg className="w-full h-full" viewBox="0 0 800 400">
          {/* Grid pattern */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="#14b8a6" opacity="0.1" />
            </pattern>
          </defs>
          <rect width="800" height="400" fill="url(#grid)" />
          
          {/* Animated nodes */}
          {[...Array(8)].map((_, i) => {
            const x = 100 + (i * 100);
            const y = 100 + Math.sin(i) * 150;
            return (
              <motion.g key={i}>
                <motion.circle
                  cx={x}
                  cy={y}
                  r="6"
                  fill="#14b8a6"
                  opacity="0.6"
                  initial={{ scale: 0 }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
                />
                {i < 7 && (
                  <motion.line
                    x1={x}
                    y1={y}
                    x2={x + 100}
                    y2={100 + Math.sin(i + 1) * 150}
                    stroke="#8b5cf6"
                    strokeWidth="1"
                    opacity="0.2"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, delay: i * 0.2 }}
                  />
                )}
              </motion.g>
            );
          })}
        </svg>
      </div>
    );
  }

  if (variant === 'flow') {
    return (
      <div className={`relative w-full h-full bg-gradient-to-br from-accent/10 to-primary/10 overflow-hidden ${className}`}>
        <svg className="w-full h-full" viewBox="0 0 800 400">
          {/* Flowing lines */}
          {[...Array(6)].map((_, i) => {
            const yOffset = 50 + i * 60;
            return (
              <motion.path
                key={i}
                d={`M 0 ${yOffset} Q 200 ${yOffset - 30} 400 ${yOffset} T 800 ${yOffset}`}
                fill="none"
                stroke={i % 2 === 0 ? '#14b8a6' : '#8b5cf6'}
                strokeWidth="2"
                opacity="0.3"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.3 }}
                transition={{ duration: 2, delay: i * 0.3 }}
              />
            );
          })}
        </svg>
      </div>
    );
  }

  if (variant === 'pattern') {
    return (
      <div className={`relative w-full h-full overflow-hidden ${className}`}>
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(to right, rgb(20 184 166 / 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgb(139 92 246 / 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }} />
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: '120px',
              height: '120px',
              background: i % 2 === 0
                ? 'radial-gradient(circle, rgb(20 184 166 / 0.1), transparent)'
                : 'radial-gradient(circle, rgb(139 92 246 / 0.1), transparent)',
              left: `${(i % 4) * 25}%`,
              top: `${Math.floor(i / 4) * 33}%`,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, delay: i * 0.1 }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'gradient') {
    return (
      <div className={`relative w-full h-full overflow-hidden ${className}`}>
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 30% 50%, rgb(20 184 166 / 0.15), transparent 50%), radial-gradient(circle at 70% 50%, rgb(139 92 246 / 0.15), transparent 50%)',
          }}
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              delay: Math.random() * 2,
              repeat: Infinity,
            }}
          />
        ))}
      </div>
    );
  }

  return null;
}
