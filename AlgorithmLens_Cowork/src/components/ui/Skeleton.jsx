/**
 * Skeleton Component (#21)
 *
 * Reusable skeleton/placeholder component for loading states.
 * Now powered by shadcn/ui pattern with cn() for class merging.
 *
 * Usage:
 * ```jsx
 * <Skeleton className="h-12 w-full rounded-lg" />
 * <Skeleton className="h-4 w-3/4 mt-2" />
 * ```
 */

import { cn } from "@/lib/utils";

export default function Skeleton({ className = '' }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}
