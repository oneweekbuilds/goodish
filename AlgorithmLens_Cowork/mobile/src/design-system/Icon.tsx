/**
 * Icon — thin wrapper enforcing the brand's stroke weight and default color
 * from design tokens. Maps the kebab-case icon names used in the design
 * (matching SKILL.md's icon table) to their lucide-react-native components.
 *
 * Per SKILL.md: icons are monochrome, single weight (1.5–1.75px stroke),
 * functional only. Production iOS would use SF Symbols; the design system
 * substitutes Lucide off-platform, and we use the same here for parity.
 *
 * The icon set is intentionally a closed list — the design's table of
 * functional icons. Adding a new icon means adding it to this map and
 * confirming it serves a function rather than decorating.
 */
import React from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  BarChart3,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Flag,
  Info,
  Lightbulb,
  ScanLine,
  Shield,
  ShoppingBag,
  Smile,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react-native';
import { colors } from '../design-tokens/tokens';

/**
 * The closed set of design-system icons. Names mirror the kebab-case
 * Lucide names used throughout the design's prototype (`components.jsx`),
 * which mirror the SKILL.md icon table.
 */
const ICONS = {
  'alert-triangle': AlertTriangle,
  'triangle-alert': AlertTriangle, // alias used in the prototype
  'arrow-down': ArrowDown,
  'arrow-left-right': ArrowLeftRight,
  'arrow-up': ArrowUp,
  'bar-chart-3': BarChart3,
  'check': Check,
  'chevron-down': ChevronDown,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'chevron-up': ChevronUp,
  'clock': Clock,
  'flag': Flag,
  'info': Info,
  'lightbulb': Lightbulb,
  'scan-line': ScanLine,
  'shield': Shield,
  'shopping-bag': ShoppingBag,
  'smile': Smile,
  'sparkles': Sparkles,
  'trending-up': TrendingUp,
} as const satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

interface IconProps {
  name: IconName;
  /** Pixel size. 16 in chrome, 20–24 in tab bars per spec. */
  size?: number;
  /** Stroke color. Defaults to text-secondary for non-interactive icons. */
  color?: string;
  /** Stroke width. 1.75 default ("single weight"). */
  strokeWidth?: number;
}

export function Icon({
  name,
  size = 16,
  color = colors.textSecondary,
  strokeWidth = 1.75,
}: IconProps) {
  const Component = ICONS[name];
  if (!Component) return null;
  return <Component size={size} color={color} strokeWidth={strokeWidth} />;
}
