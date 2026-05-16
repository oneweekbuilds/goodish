/**
 * AlgorithmLens design system: re-exports.
 *
 * Keep this file a flat list of named re-exports so callers can write:
 *
 *   import { Card, ExpandableCard, HeroStatCard } from '../design-system';
 */

export { Card, type CardProps } from './Card';
export { Icon, type IconName } from './Icon';
export { HeroStatCard, type HeroStatCardProps } from './HeroStatCard';
export { CautionBadge, type CautionBadgeProps } from './CautionBadge';
export { SectionHeader, type SectionHeaderProps } from './SectionHeader';
export { ExpandableCard, type ExpandableCardProps } from './ExpandableCard';
export { CategoryRow, type CategoryRowProps } from './CategoryRow';
export { AttributeCard, type AttributeCardProps } from './AttributeCard';
export { InfluencerRow, type InfluencerRowProps } from './InfluencerRow';
export { DisclosureRow, type DisclosureRowProps } from './DisclosureRow';
export { FeedbackLoopStep, type FeedbackLoopStepProps } from './FeedbackLoopStep';
export { StackedBar, type StackedBarProps, type StackedBarSegment } from './StackedBar';
export { ComparisonPair, type ComparisonPairProps, type ComparisonPairGroup } from './ComparisonPair';
export { Sparkline, type SparklineProps } from './Sparkline';
export { GreetingHeader, type GreetingHeaderProps } from './GreetingHeader';
export {
  ConditionalLastScanRow,
  type ConditionalLastScanRowProps,
  type LastScanRecord,
} from './ConditionalLastScanRow';
export { SettingsRow, type SettingsRowProps } from './SettingsRow';
export {
  MicroSectionHeader,
  type MicroSectionHeaderProps,
} from './MicroSectionHeader';
/**
 * SettingsSectionHeader is a deprecated alias for MicroSectionHeader.
 * The Settings route still imports the old name; remove this alias on
 * the next Settings touch and migrate that import to MicroSectionHeader.
 */
export {
  MicroSectionHeader as SettingsSectionHeader,
  type MicroSectionHeaderProps as SettingsSectionHeaderProps,
} from './MicroSectionHeader';
export { ComparePill, type ComparePillProps } from './ComparePill';
export { PickerRow, type PickerRowProps } from './PickerRow';
export { DiffRow, type DiffRowProps } from './DiffRow';
export { BackButton, type BackButtonProps } from './BackButton';
export { ScanHeader, type ScanHeaderProps } from './ScanHeader';
export { CaptureFooter, type CaptureFooterProps } from './CaptureFooter';
export { CautionPill, type CautionPillProps } from './CautionPill';
export { StepIndicator, type StepIndicatorProps } from './StepIndicator';
export { PlatformTile, type PlatformTileProps } from './PlatformTile';
export {
  PrimaryButton,
  type PrimaryButtonProps,
  type PrimaryButtonVariant,
} from './PrimaryButton';
export { VerdictEyebrow, type VerdictEyebrowProps } from './VerdictEyebrow';
export { VerdictText, type VerdictTextProps } from './VerdictText';
export { ObservedSubline, type ObservedSublineProps } from './ObservedSubline';
export { LikelySubline, type LikelySublineProps } from './LikelySubline';
export {
  ResultsMetaLine,
  type ResultsMetaLineProps,
} from './ResultsMetaLine';
export { SupportingCard, type SupportingCardProps } from './SupportingCard';
