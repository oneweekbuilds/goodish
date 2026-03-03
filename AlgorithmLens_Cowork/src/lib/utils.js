import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function for merging Tailwind CSS classes.
 * Used by shadcn/ui components.
 *
 * Combines clsx (conditional class joining) with tailwind-merge
 * (intelligent Tailwind class deduplication).
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
