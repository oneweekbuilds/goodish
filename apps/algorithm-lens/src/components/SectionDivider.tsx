import { motion } from 'motion/react';

interface SectionDividerProps {
  variant?: 'gradient' | 'line' | 'dots';
}

export function SectionDivider({ variant = 'gradient' }: SectionDividerProps) {
  if (variant === 'gradient') {
    return (
      <div className="w-full py-8">
        <motion.div
          className="w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className="w-full py-8 flex justify-center gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-primary to-accent"
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 0.6 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="w-full py-8">
      <div className="w-full h-px bg-border" />
    </div>
  );
}
