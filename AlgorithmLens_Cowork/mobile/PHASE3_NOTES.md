# Phase 3: Dashboard & Home Charts Upgraded to react-native-gifted-charts

**Date:** 2026-02-28
**Status:** Complete

---

## Summary

All dashboard and home screen chart components have been upgraded from custom SVG/Animated.View implementations to `react-native-gifted-charts` v1.4.74 powered wrappers. Six new reusable chart wrapper components were created in `src/components/charts/`, the dashboard and home screens were migrated, and the old chart components were deleted.

---

## Installation

### react-native-gifted-charts v1.4.74
- Installed via `npm install react-native-gifted-charts --legacy-peer-deps`
- `--legacy-peer-deps` was needed due to existing peer dependency conflict with expo-linking
- **No `react-native-linear-gradient` needed** — gifted-charts auto-detects `expo-linear-gradient` (which was already installed) via a try/catch fallback in `Components/common/LinearGradient.js`
- No additional native dependencies or pod installs required

### Dependency Compatibility
- `expo-linear-gradient` ~15.0.8 — fully compatible, gifted-charts detects it automatically
- `react-native-svg` ~15.12.1 — already installed, used by gifted-charts and ALRadarChart
- `react-native-reanimated` ~3.16.1 — already installed, no conflicts

---

## New Chart Wrapper Components (`src/components/charts/`)

### a) ALBarChart.tsx (replaces `dashboard/BarChart.tsx`)
- Vertical bar chart with rounded top corners (4px radius)
- Animated entrance (600ms duration)
- Touch tooltips showing exact value
- Graduated blue color scale (barDarkest → barLightest from theme)
- Responsive bar width calculation based on screen dimensions
- Three states: loading (Skeleton), empty (EmptyState), populated
- Dashed grid lines using theme borderSubtle color
- Geist font for all labels via GL_TYPOGRAPHY
- **Props change:** `items` → `data` (same shape)

### b) ALStackedBar.tsx (replaces `dashboard/StackedBar100.tsx`)
- 100% stacked horizontal bar with animated segments
- **Custom implementation** (not gifted-charts BarChart) because the app's horizontal 100% stacked pattern works better as a custom component
- Touch to highlight individual segments (dim others to 0.4 opacity)
- Tooltip appears above bar showing segment name, percentage, and count
- Minimum visible width enforcement (3% minimum) with visual normalization
- External labels for segments < 15% width
- Colorblind-accessible legend shapes (circle, square, diamond, triangle)
- Three states: loading, empty, populated
- **Props:** identical to old StackedBar100 (`segments` prop)

### c) ALPieChart.tsx (new)
- Donut-style pie chart using gifted-charts PieChart
- Touch to focus/highlight individual segment
- Center label shows percentage of focused segment (or custom center label)
- Animated entrance (600ms)
- Legend below with colorblind-accessible shapes
- Focus effect: active segment highlighted, others dimmed to 0.4 opacity
- Theme-aware inner circle color (bgCard)
- Use cases: ad breakdown, sentiment distribution, followed vs suggested ratio

### d) ALLineChart.tsx (new)
- Smooth bezier curves via gifted-charts LineChart
- Gradient area fill (15% → 1% opacity)
- Animated path drawing (800ms)
- Pointer tooltip on touch (shows value at nearest point)
- Support for dual lines (data + data2) for comparisons
- `hideAxes` mode for compact sparkline usage (e.g., FeedScoreTrend)
- Responsive spacing based on screen width
- Use cases: 7-day score trend, feed composition trends

### e) ALRadarChart.tsx (new)
- Custom SVG implementation using react-native-svg (gifted-charts has no radar chart)
- Configurable number of axes (designed for 6 dimensions)
- Dashed grid polygons at 25%, 50%, 75%, 100% levels
- Filled data area with 15% opacity
- Data point dots at each axis intersection
- SVG text labels positioned outside the chart
- Animated fade-in entrance
- Legend below showing axis values
- Use cases: at-a-glance overview of all 6 analysis dimensions

### f) ALScoreGauge.tsx (upgrade of FeedScoreCard score display)
- Circular donut progress using gifted-charts PieChart
- Animated fill (600ms)
- Animated count-up number in center (useCountUp hook)
- Color changes by score range: ≥70 green, ≥50 blue, ≥30 amber, <30 gray
- Optional label below score number
- Theme-aware background (bgCard for inner circle)
- Accessibility: progressbar role with min/max/now values
- Use cases: feed health score, individual dimension scores

---

## Charts Replaced — Where

### Dashboard (`app/(tabs)/dashboard.tsx`)
| Location | Old Component | New Component | Notes |
|----------|--------------|---------------|-------|
| Overview: Content Types | `StackedBar100` | `ALStackedBar` | Same segments prop |
| Sources: Top Creators | `BarChart` | `ALBarChart` | `items` → `data` prop |
| Sources: Concentration | `StackedBar100` | `ALStackedBar` | Same segments prop |
| Ads: Organic vs Sponsored | `StackedBar100` | `ALStackedBar` | Same segments prop |
| Suggested vs Followed: Ratio | `StackedBar100` | `ALStackedBar` | Same segments prop |
| Politics: Ideology Spectrum | `StackedBar100` | `ALStackedBar` | Same segments prop |
| Tone: Sentiment Distribution | `StackedBar100` | `ALStackedBar` | Same segments prop |

### Home Screen
| Location | Old Component | New Component | Notes |
|----------|--------------|---------------|-------|
| `FeedScoreCard.tsx` | Custom bigNumber + label | `ALScoreGauge` | Ring chart wrapping score number |
| `FeedScoreTrend.tsx` | Custom SVG bar Sparkline | `ALLineChart` | Smooth curve with area fill, hideAxes mode |

---

## Old Components Deleted

- `src/components/dashboard/BarChart.tsx` — replaced by ALBarChart
- `src/components/dashboard/StackedBar100.tsx` — replaced by ALStackedBar

---

## Data Format Compatibility

All data flows are preserved exactly. The new components accept the same data structures:

- **ALBarChart:** Same `{ label, value, percentage }[]` shape, prop renamed from `items` to `data`
- **ALStackedBar:** Identical `segments` prop with `{ label, percentage, count, color }[]`
- **ALScoreGauge:** Takes `score` (number) and `label` (string) — same data FeedScoreCard already had
- **ALLineChart:** Takes `{ value, label }[]` — FeedScoreTrend maps its points to this format

---

## gifted-charts Features That Worked Well

- **PieChart donut mode** — clean, animated, with good centerLabelComponent support
- **BarChart animations** — smooth entrance with configurable duration
- **Auto-detection of expo-linear-gradient** — zero configuration needed
- **Tooltip rendering** — renderTooltip callback gave full control over tooltip appearance

## gifted-charts Features That Didn't Work as Expected

- **Stacked horizontal bars** — gifted-charts stacked bars are vertical-only and don't match the app's horizontal 100% stacked pattern. Kept custom ALStackedBar implementation.
- **Radar chart** — Not available in gifted-charts. Built custom SVG implementation with react-native-svg.
- **LineChart pointerConfig** — Works but requires careful null-checking of items array in pointerLabelComponent callback.

## Dependency Notes

- **No react-native-linear-gradient needed** — expo-linear-gradient works out of the box
- **No pod install needed** — gifted-charts is pure JS/TS (no native code)
- **Package installed with --legacy-peer-deps** due to existing expo-router/expo-linking peer dep conflict (pre-existing issue, not caused by gifted-charts)

---

## What's NOT Changed

- All non-chart dashboard components (BigNumber, MetricCard, InsightHero, SectionHeader, ComparisonView, DashboardTour)
- All data computation logic (computeDashboardData.ts, insightBuilders.js)
- All hooks (useDashboard, useAnalysis, etc.)
- Tab bar structure and navigation
- Pull-to-refresh behavior
- Locked overlay / paywall integration
- Dark mode theming (all new components use theme tokens)
- Accessibility labels and roles (preserved on all new components)
