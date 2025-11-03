import { motion } from 'motion/react';
import { Package } from 'lucide-react';

interface Product {
  name: string;
  category: string;
  frequency: number;
}

interface ProductGridProps {
  products: Product[];
}

export function ProductGrid({ products }: ProductGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {products.map((product, i) => (
        <motion.div
          key={i}
          className="p-6 rounded-xl bg-gradient-to-br from-slate-50 to-gray-50 border border-gray-100 hover:shadow-lg transition-all duration-300 cursor-pointer group"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1, duration: 0.5 }}
          whileHover={{ y: -4 }}
        >
          <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <Package size={40} className="text-primary" />
          </div>
          <h4 className="text-sm mb-1" style={{ fontWeight: 600 }}>{product.name}</h4>
          <p className="text-xs mb-2" style={{ color: 'var(--foreground-muted)' }}>
            {product.category}
          </p>
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-accent"
                initial={{ width: 0 }}
                animate={{ width: `${(product.frequency / 50) * 100}%` }}
                transition={{ duration: 1, delay: i * 0.1 + 0.3 }}
              />
            </div>
            <span className="text-xs" style={{ color: 'var(--foreground-tertiary)', fontWeight: 600 }}>
              {product.frequency}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

