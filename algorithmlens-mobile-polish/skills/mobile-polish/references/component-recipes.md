# Component Recipes for AlgorithmLens Mobile

Copy-pasteable patterns for building polished components. All recipes use the AlgorithmLens brand palette and follow the design patterns from design-patterns.md.

Adapt these to your project's existing patterns: if the app uses StyleSheet, use that. If it uses a theme context, reference that. These are structural templates, not drop-in code.

---

## 1. Polished Card (Base card wrapper for everything)

```tsx
import { View, StyleSheet, useColorScheme } from 'react-native';

interface PolishedCardProps {
  children: React.ReactNode;
  elevated?: boolean;
  noPadding?: boolean;
}

export function PolishedCard({ children, elevated, noPadding }: PolishedCardProps) {
  const isDark = useColorScheme() === 'dark';
  return (
    <View style={[
      styles.card,
      {
        backgroundColor: isDark ? (elevated ? '#334155' : '#1E293B') : '#FFFFFF',
        ...(isDark
          ? { borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }
          : { shadowOffset: {width:0, height:2}, shadowOpacity:0.08, shadowRadius:8, elevation:3 }
        ),
      },
      noPadding && { padding: 0 },
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: 20, marginHorizontal: 16 },
});
```

---

## 2. Section Header

```tsx
import { View, Text, Pressable, StyleSheet, useColorScheme } from 'react-native';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  onSeeAll?: () => void;
}

export function SectionHeader({ title, subtitle, onSeeAll }: SectionHeaderProps) {
  const isDark = useColorScheme() === 'dark';
  return (
    <View style={styles.container}>
      <View style={styles.textStack}>
        <Text style={[styles.title, { color: isDark ? '#F1F5F9' : '#1E293B' }]}>{title}</Text>
        {subtitle && <Text style={[styles.subtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>{subtitle}</Text>}
      </View>
      {onSeeAll && (
        <Pressable onPress={onSeeAll} hitSlop={{ top:12, bottom:12, left:12, right:12 }}>
          <Text style={{ fontSize:14, fontWeight:'500', color:'#2563EB' }}>Show all</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-end', paddingHorizontal:16, marginBottom:12 },
  textStack: { flex:1 },
  title: { fontSize:22, fontWeight:'700', letterSpacing:-0.3 },
  subtitle: { fontSize:13, marginTop:2 },
});
```

---

## 3. Horizontal Carousel

```tsx
import { FlatList, View } from 'react-native';

interface CarouselProps<T> {
  data: T[];
  renderItem: (info: { item: T; index: number }) => React.ReactNode;
  itemWidth: number;
  gap?: number;
}

export function HorizontalCarousel<T>({ data, renderItem, itemWidth, gap = 12 }: CarouselProps<T>) {
  return (
    <FlatList
      data={data}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16 }}
      ItemSeparatorComponent={() => <View style={{ width: gap }} />}
      snapToInterval={itemWidth + gap}
      decelerationRate="fast"
      renderItem={({ item, index }) => (
        <View style={{ width: itemWidth }}>{renderItem({ item, index })}</View>
      )}
    />
  );
}
```

---

## 4. Filter Pill Tabs (Spotify-style, for dashboard dimension tabs)

```tsx
import { ScrollView, Pressable, Text, StyleSheet, useColorScheme } from 'react-native';

interface FilterPillsProps {
  options: string[];
  selected: string;
  onSelect: (option: string) => void;
}

export function FilterPills({ options, selected, onSelect }: FilterPillsProps) {
  const isDark = useColorScheme() === 'dark';
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal:16, gap:8, paddingVertical:4 }}>
      {options.map((option) => {
        const isActive = option === selected;
        return (
          <Pressable key={option} onPress={() => onSelect(option)}
            style={[styles.pill, isActive ? styles.pillActive : { borderColor: isDark ? '#334155' : '#E2E8F0', backgroundColor:'transparent' }]}>
            <Text style={[styles.pillText, isActive ? { color:'#FFF' } : { color: isDark ? '#F1F5F9' : '#1E293B' }]}>{option}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pill: { paddingVertical:8, paddingHorizontal:18, borderRadius:50, borderWidth:1.5 },
  pillActive: { backgroundColor:'#2563EB', borderColor:'#2563EB' },
  pillText: { fontSize:14, fontWeight:'600' },
});
```

---

## 5. Insight Card (Dashboard primary content card)

```tsx
import { View, Text, Pressable, StyleSheet, useColorScheme } from 'react-native';

interface InsightCardProps {
  eyebrow: string;
  title: string;
  takeaway: string;
  eyebrowColor?: string;
  chart?: React.ReactNode;
  howWeMeasure?: string;
}

export function InsightCard({ eyebrow, title, takeaway, eyebrowColor = '#10B981', chart, howWeMeasure }: InsightCardProps) {
  const isDark = useColorScheme() === 'dark';
  return (
    <PolishedCard>
      <Text style={[styles.eyebrow, { color: eyebrowColor }]}>{eyebrow}</Text>
      <Text style={[styles.title, { color: isDark ? '#F1F5F9' : '#1E293B' }]}>{title}</Text>
      <Text style={[styles.takeaway, { color: isDark ? '#94A3B8' : '#64748B' }]}>{takeaway}</Text>
      {chart && <View style={styles.chartContainer}>{chart}</View>}
      {howWeMeasure && (
        <Pressable style={styles.howWeMeasure}>
          <Text style={{ fontSize:13, fontWeight:'500', color: isDark ? '#64748B' : '#94A3B8' }}>How we measure this →</Text>
        </Pressable>
      )}
    </PolishedCard>
  );
}

const styles = StyleSheet.create({
  eyebrow: { fontSize:11, fontWeight:'600', textTransform:'uppercase', letterSpacing:1.5, marginBottom:8 },
  title: { fontSize:18, fontWeight:'700', lineHeight:24, marginBottom:8 },
  takeaway: { fontSize:14, lineHeight:20, marginBottom:16 },
  chartContainer: { marginBottom:16, borderRadius:12, overflow:'hidden' },
  howWeMeasure: { paddingTop:12, borderTopWidth:StyleSheet.hairlineWidth, borderTopColor:'rgba(148,163,184,0.2)' },
});
```

---

## 6. Scan History List Item

```tsx
import { View, Text, Pressable, StyleSheet, useColorScheme } from 'react-native';

interface ScanHistoryItemProps {
  platform: string;
  platformIcon: React.ReactNode;
  timestamp: string;
  postCount: number;
  onPress: () => void;
}

export function ScanHistoryItem({ platform, platformIcon, timestamp, postCount, onPress }: ScanHistoryItemProps) {
  const isDark = useColorScheme() === 'dark';
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.container, pressed && { opacity:0.7, transform:[{ scale:0.98 }] }]}>
      <View style={[styles.iconContainer, { backgroundColor: isDark ? '#172554' : '#EFF6FF' }]}>{platformIcon}</View>
      <View style={styles.textContainer}>
        <Text style={[styles.platform, { color: isDark ? '#F1F5F9' : '#1E293B' }]}>{platform}</Text>
        <Text style={[styles.timestamp, { color: isDark ? '#94A3B8' : '#64748B' }]}>{timestamp} · {postCount} posts</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection:'row', alignItems:'center', paddingVertical:14, paddingHorizontal:16, gap:12 },
  iconContainer: { width:44, height:44, borderRadius:10, justifyContent:'center', alignItems:'center' },
  textContainer: { flex:1 },
  platform: { fontSize:16, fontWeight:'600' },
  timestamp: { fontSize:13, marginTop:2 },
});
```

---

## 7. Hero Gradient Card (requires expo-linear-gradient)

```tsx
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface HeroCardProps {
  title: string;
  subtitle: string;
  eyebrow?: string;
}

export function HeroCard({ title, subtitle, eyebrow }: HeroCardProps) {
  return (
    <View style={styles.wrapper}>
      <LinearGradient colors={['#1D4ED8', '#2563EB', '#3B82F6']} start={{ x:0, y:0 }} end={{ x:1, y:1 }} style={styles.gradient}>
        {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginHorizontal:16, borderRadius:20, overflow:'hidden', shadowOffset:{width:0,height:8}, shadowOpacity:0.2, shadowRadius:24, shadowColor:'#1D4ED8', elevation:8 },
  gradient: { padding:24, minHeight:160, justifyContent:'flex-end' },
  eyebrow: { fontSize:11, fontWeight:'600', textTransform:'uppercase', letterSpacing:1.5, color:'rgba(255,255,255,0.7)', marginBottom:8 },
  title: { fontSize:24, fontWeight:'800', color:'#FFFFFF', lineHeight:30, marginBottom:4 },
  subtitle: { fontSize:14, color:'rgba(255,255,255,0.8)', lineHeight:20 },
});
```

---

## 8. Empty State

```tsx
import { View, Text, Pressable, StyleSheet, useColorScheme } from 'react-native';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  const isDark = useColorScheme() === 'dark';
  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>{icon}</View>
      <Text style={[styles.title, { color: isDark ? '#F1F5F9' : '#1E293B' }]}>{title}</Text>
      <Text style={[styles.description, { color: isDark ? '#94A3B8' : '#64748B' }]}>{description}</Text>
      {actionLabel && onAction && (
        <Pressable onPress={onAction} style={({ pressed }) => [styles.cta, pressed && { opacity:0.85, transform:[{ scale:0.97 }] }]}>
          <Text style={styles.ctaText}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, justifyContent:'center', alignItems:'center', paddingHorizontal:40, paddingVertical:60 },
  iconWrapper: { marginBottom:20, opacity:0.6 },
  title: { fontSize:20, fontWeight:'700', textAlign:'center', marginBottom:8 },
  description: { fontSize:15, textAlign:'center', lineHeight:22, marginBottom:28 },
  cta: { backgroundColor:'#2563EB', paddingVertical:14, paddingHorizontal:32, borderRadius:50 },
  ctaText: { color:'#FFF', fontSize:16, fontWeight:'600' },
});
```

---

## 9. Skeleton Loader

```tsx
import { useEffect, useRef } from 'react';
import { View, Animated, useColorScheme } from 'react-native';

interface SkeletonProps {
  width: number | string;
  height: number;
  radius?: number;
}

export function SkeletonBox({ width, height, radius = 8 }: SkeletonProps) {
  const shimmer = useRef(new Animated.Value(0)).current;
  const isDark = useColorScheme() === 'dark';

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(shimmer, { toValue:1, duration:1000, useNativeDriver:true }),
      Animated.timing(shimmer, { toValue:0, duration:1000, useNativeDriver:true }),
    ])).start();
  }, []);

  const opacity = shimmer.interpolate({ inputRange:[0,1], outputRange:[0.3,0.7] });

  return <Animated.View style={{ width, height, borderRadius:radius, backgroundColor: isDark ? '#334155' : '#E2E8F0', opacity }} />;
}

export function InsightCardSkeleton() {
  return (
    <View style={{ padding:20, gap:12, marginHorizontal:16, borderRadius:16 }}>
      <SkeletonBox width={80} height={12} radius={4} />
      <SkeletonBox width="70%" height={20} radius={4} />
      <SkeletonBox width="100%" height={14} radius={4} />
      <SkeletonBox width="90%" height={14} radius={4} />
      <SkeletonBox width="100%" height={120} radius={12} />
    </View>
  );
}
```

---

## 10. Pressable with Scale Feedback

```tsx
import { Pressable, Animated, PressableProps } from 'react-native';
import { useRef } from 'react';

interface PressableScaleProps extends PressableProps {
  children: React.ReactNode;
  scaleValue?: number;
}

export function PressableScale({ children, scaleValue = 0.97, style, ...props }: PressableScaleProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, { toValue:scaleValue, useNativeDriver:true, speed:50, bounciness:4 }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, { toValue:1, useNativeDriver:true, speed:40, bounciness:6 }).start();
  };

  return (
    <Pressable onPressIn={onPressIn} onPressOut={onPressOut} {...props}>
      <Animated.View style={[style, { transform:[{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}
```

---

## 11. Badge / Pill

```tsx
import { View, Text, StyleSheet, useColorScheme } from 'react-native';

type BadgeVariant = 'blue' | 'green' | 'gray' | 'red';

const BADGE_COLORS: Record<BadgeVariant, { bg:string; bgDark:string; text:string; textDark:string }> = {
  blue:  { bg:'#EFF6FF', bgDark:'#172554', text:'#2563EB', textDark:'#60A5FA' },
  green: { bg:'#ECFDF5', bgDark:'#064E3B', text:'#059669', textDark:'#34D399' },
  gray:  { bg:'#F1F5F9', bgDark:'#334155', text:'#64748B', textDark:'#94A3B8' },
  red:   { bg:'#FEF2F2', bgDark:'#450A0A', text:'#DC2626', textDark:'#F87171' },
};

export function Badge({ label, variant = 'blue' }: { label:string; variant?:BadgeVariant }) {
  const isDark = useColorScheme() === 'dark';
  const c = BADGE_COLORS[variant];
  return (
    <View style={[styles.badge, { backgroundColor: isDark ? c.bgDark : c.bg }]}>
      <Text style={[styles.text, { color: isDark ? c.textDark : c.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingVertical:4, paddingHorizontal:10, borderRadius:50, alignSelf:'flex-start' },
  text: { fontSize:12, fontWeight:'600' },
});
```

---

## 12. Bottom Tab Bar Styling

Apply to React Navigation tab bar config:

```tsx
<Tabs screenOptions={{
  tabBarStyle: {
    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
    borderTopColor: isDark ? '#334155' : '#E2E8F0',
    borderTopWidth: StyleSheet.hairlineWidth,
    height: 49 + (insets?.bottom ?? 0),
    paddingTop: 6,
  },
  tabBarActiveTintColor: '#2563EB',
  tabBarInactiveTintColor: '#94A3B8',
  tabBarLabelStyle: { fontSize:10, fontWeight:'500', marginTop:2 },
}} />
```

---

## 13. Metric Display

```tsx
import { View, Text, StyleSheet, useColorScheme } from 'react-native';

interface MetricDisplayProps {
  value: string | number;
  label: string;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
}

export function MetricDisplay({ value, label, trend, trendLabel }: MetricDisplayProps) {
  const isDark = useColorScheme() === 'dark';
  const trendColor = trend === 'up' ? '#10B981' : trend === 'down' ? '#EF4444' : '#94A3B8';
  return (
    <View style={{ alignItems:'center', gap:4 }}>
      <Text style={{ fontSize:32, fontWeight:'800', letterSpacing:-0.5, color:'#2563EB' }}>{value}</Text>
      <Text style={{ fontSize:13, fontWeight:'500', color: isDark ? '#94A3B8' : '#64748B' }}>{label}</Text>
      {trendLabel && (
        <Text style={{ fontSize:12, fontWeight:'600', color:trendColor }}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendLabel}
        </Text>
      )}
    </View>
  );
}
```

---

## 14. Score Ring (requires react-native-svg)

```tsx
import { View, Text, useColorScheme } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export function ScoreRing({ score, size = 80, strokeWidth = 6, label }: ScoreRingProps) {
  const isDark = useColorScheme() === 'dark';
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - score / 100);
  const scoreColor = score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444';

  return (
    <View style={{ width:size, height:size, justifyContent:'center', alignItems:'center' }}>
      <Svg width={size} height={size} style={{ transform:[{ rotate:'-90deg' }] }}>
        <Circle cx={size/2} cy={size/2} r={radius} stroke={isDark ? '#334155' : '#E2E8F0'} strokeWidth={strokeWidth} fill="none" />
        <Circle cx={size/2} cy={size/2} r={radius} stroke={scoreColor} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" />
      </Svg>
      <View style={{ position:'absolute', alignItems:'center' }}>
        <Text style={{ fontSize:20, fontWeight:'800', color: isDark ? '#F1F5F9' : '#1E293B' }}>{score}</Text>
        {label && <Text style={{ fontSize:9, fontWeight:'500', textTransform:'uppercase', letterSpacing:0.5, color: isDark ? '#94A3B8' : '#64748B' }}>{label}</Text>}
      </View>
    </View>
  );
}
```

---

## General Rules — Apply to EVERY Component

1. **Border radius:** 12-16px for cards, full radius for pills
2. **Spacing:** multiples of 4 from the spacing system
3. **Typography:** weights from the scale only
4. **Colors:** brand palette only — no hardcoded #333 or random grays
5. **Dark mode:** every color needs light AND dark variant
6. **Press feedback:** every tappable element needs opacity/scale change
7. **Touch targets:** nothing interactive smaller than 44x44pt
