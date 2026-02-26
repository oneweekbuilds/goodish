/**
 * Skeleton Component (#21)
 *
 * Reusable skeleton/placeholder component for loading states.
 * Uses Tailwind CSS animate-pulse for the loading animation.
 *
 * Usage:
 * ```jsx
 * <Skeleton className="h-12 w-full rounded-lg" />
 * <Skeleton className="h-4 w-3/4 mt-2" />
 * ```
 */

export default function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}
