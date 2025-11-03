import { motion } from 'motion/react';

interface BrandFrequencyProps {
  brand: string;
  frequency: number;
  index: number;
}

export function BrandFrequency({ brand, frequency, index }: BrandFrequencyProps) {
  return (
    <motion.div
      className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-slate-50 to-gray-50 border border-gray-100 hover:shadow-lg transition-all duration-300"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ x: 4 }}
    >
      <div className="flex items-center gap-4">
        <div 
          className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center"
          style={{ fontWeight: 700, fontSize: '18px', color: 'var(--foreground-secondary)' }}
        >
          {brand.substring(0, 2)}
        </div>
        <div>
          <p className="text-base" style={{ fontWeight: 600 }}>{brand}</p>
          <p className="text-sm" style={{ color: 'var(--foreground-tertiary)' }}>
            Shown {frequency} times
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-accent"
            initial={{ width: 0 }}
            animate={{ width: `${(frequency / 50) * 100}%` }}
            transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
          />
        </div>
        <span className="text-sm" style={{ fontWeight: 600, color: 'var(--foreground-secondary)' }}>
          {frequency}
        </span>
      </div>
    </motion.div>
  );
}

