import { motion } from 'motion/react';
import { Info } from 'lucide-react';

interface InsightExplanationProps {
  text: string;
  variant?: 'default' | 'reflection';
}

export function InsightExplanation({ text, variant = 'default' }: InsightExplanationProps) {
  return (
    <motion.div
      className={`p-6 rounded-xl border ${
        variant === 'reflection' 
          ? 'bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200' 
          : 'bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200'
      }`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      <div className="flex gap-3">
        <Info 
          size={20} 
          className={`flex-shrink-0 mt-0.5 ${
            variant === 'reflection' ? 'text-violet-500' : 'text-teal-500'
          }`} 
        />
        <div>
          <h4 
            className="mb-2" 
            style={{ 
              fontSize: '14px', 
              fontWeight: 600,
              color: 'var(--foreground)',
              fontFamily: 'var(--font-headline)',
            }}
          >
            {variant === 'reflection' ? 'Reflect on this' : 'What this means'}
          </h4>
          <p 
            className="text-sm leading-relaxed" 
            style={{ color: 'var(--foreground-secondary)' }}
          >
            {text}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
