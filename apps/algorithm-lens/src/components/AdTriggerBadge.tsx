import { motion } from 'motion/react';
import { Target } from 'lucide-react';

interface AdTriggerBadgeProps {
  trigger: string;
  confidence: number; // 0-100
}

export function AdTriggerBadge({ trigger, confidence }: AdTriggerBadgeProps) {
  return (
    <motion.div
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      whileHover={{ scale: 1.05 }}
    >
      <Target size={14} className="text-orange-500" />
      <span className="text-sm" style={{ fontWeight: 500, color: 'var(--foreground-secondary)' }}>
        {trigger}
      </span>
      <span className="text-xs px-2 py-0.5 rounded-full bg-white" style={{ color: 'var(--foreground-muted)' }}>
        {confidence}%
      </span>
    </motion.div>
  );
}
