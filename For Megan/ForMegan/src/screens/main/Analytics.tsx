import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/common/Card';
import { ProgressRing } from '../../components/common/ProgressRing';
import { useAppStore } from '../../stores/appStore';
import { ThemeName } from '../../types';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../constants/theme';

const { width } = Dimensions.get('window');

interface ChartData {
  label: string;
  value: number;
  color: string;
}

const SimpleBarChart: React.FC<{
  data: ChartData[];
  height?: number;
  theme: ThemeName;
}> = ({ data, height = 200, theme }) => {
  const colors = COLORS[theme];
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <View style={[styles.chartContainer, { height }]}>
      <View style={styles.chart}>
        {data.map((item, index) => (
          <View key={index} style={styles.barContainer}>
            <View
              style={[
                styles.bar,
                {
                  height: (item.value / maxValue) * (height - 40),
                  backgroundColor: item.color,
                },
              ]}
            />
            <Text style={[styles.barLabel, { color: colors.textSecondary }]}>
              {item.label}
            </Text>
            <Text style={[styles.barValue, { color: colors.text }]}>
              {item.value}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const SimpleLineChart: React.FC<{
  data: number[];
  labels: string[];
  theme: ThemeName;
  height?: number;
}> = ({ data, labels, theme, height = 150 }) => {
  const colors = COLORS[theme];
  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue || 1;

  return (
    <View style={[styles.lineChartContainer, { height }]}>
      <View style={styles.lineChart}>
        {data.map((value, index) => {
          const normalizedValue = ((value - minValue) / range) * (height - 40);
          return (
            <View key={index} style={styles.dataPoint}>
              <View
                style={[
                  styles.point,
                  {
                    backgroundColor: colors.primary,
                    bottom: normalizedValue,
                  },
                ]}
              />
              {index < data.length - 1 && (
                <View
                  style={[
                    styles.line,
                    {
                      backgroundColor: colors.primary,
                      bottom: normalizedValue,
                      height: Math.abs(
                        ((data[index + 1] - minValue) / range) * (height - 40) - normalizedValue
                      ),
                    },
                  ]}
                />
              )}
            </View>
          );
        })}
      </View>
      <View style={styles.lineLabels}>
        {labels.map((label, index) => (
          <Text key={index} style={[styles.lineLabel, { color: colors.textSecondary }]}>
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
};

export const Analytics: React.FC = () => {
  const { user, insights, routines } = useAppStore();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');

  const theme: ThemeName = user?.preferences?.theme || 'sunrise-vibes';
  const colors = COLORS[theme];

  // Mock data for demonstration
  const punctualityData: ChartData[] = [
    { label: 'Mon', value: 95, color: colors.success },
    { label: 'Tue', value: 78, color: colors.warning },
    { label: 'Wed', value: 92, color: colors.success },
    { label: 'Thu', value: 88, color: colors.success },
    { label: 'Fri', value: 85, color: colors.success },
    { label: 'Sat', value: 100, color: colors.success },
    { label: 'Sun', value: 94, color: colors.success },
  ];

  const completionTrendData = [85, 92, 78, 95, 89, 96, 91];
  const trendLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const averageCompletionTime = 23; // minutes
  const streakCount = 5;
  const totalTasks = routines.reduce((acc, routine) => acc + routine.tasks.length, 0);

  const achievements = [
    { id: '1', title: 'Early Bird', description: '5 days on time', icon: '🌅', earned: true },
    { id: '2', title: 'Consistency King', description: '7-day streak', icon: '🔥', earned: true },
    { id: '3', title: 'Speed Demon', description: 'Under 20 min average', icon: '⚡', earned: false },
    { id: '4', title: 'Night Owl Reformed', description: 'No late nights', icon: '🦉', earned: true },
  ];

  const periodOptions = [
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'year', label: 'Year' },
  ] as const;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.background, `${colors.primary}10`]}
        style={styles.gradientBackground}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Your Analytics
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Track your morning routine progress
          </Text>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Period Selector */}
          <View style={styles.periodSelector}>
            {periodOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.periodButton,
                  {
                    backgroundColor: selectedPeriod === option.key ? colors.primary : 'transparent',
                    borderColor: colors.primary,
                  },
                ]}
                onPress={() => setSelectedPeriod(option.key)}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    {
                      color: selectedPeriod === option.key ? '#FFFFFF' : colors.primary,
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Key Stats */}
          <View style={styles.statsGrid}>
            <Card theme={theme} variant="glass" style={styles.statCard}>
              <View style={styles.statContent}>
                <ProgressRing
                  progress={89}
                  size={60}
                  theme={theme}
                  showPercentage={false}
                />
                <View style={styles.statText}>
                  <Text style={[styles.statValue, { color: colors.text }]}>89%</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    On Time
                  </Text>
                </View>
              </View>
            </Card>

            <Card theme={theme} variant="glass" style={styles.statCard}>
              <View style={styles.statContent}>
                <Ionicons name="flame" size={32} color={colors.warning} />
                <View style={styles.statText}>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {streakCount}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Day Streak
                  </Text>
                </View>
              </View>
            </Card>

            <Card theme={theme} variant="glass" style={styles.statCard}>
              <View style={styles.statContent}>
                <Ionicons name="time" size={32} color={colors.primary} />
                <View style={styles.statText}>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {averageCompletionTime}m
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Avg Time
                  </Text>
                </View>
              </View>
            </Card>

            <Card theme={theme} variant="glass" style={styles.statCard}>
              <View style={styles.statContent}>
                <Ionicons name="checkmark-circle" size={32} color={colors.success} />
                <View style={styles.statText}>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {totalTasks}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Total Tasks
                  </Text>
                </View>
              </View>
            </Card>
          </View>

          {/* Punctuality Chart */}
          <Card theme={theme} variant="glass" style={styles.chartCard}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>
              Weekly Punctuality
            </Text>
            <SimpleBarChart data={punctualityData} theme={theme} />
          </Card>

          {/* Completion Trend */}
          <Card theme={theme} variant="glass" style={styles.chartCard}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>
              Completion Trend
            </Text>
            <SimpleLineChart
              data={completionTrendData}
              labels={trendLabels}
              theme={theme}
            />
          </Card>

          {/* Achievements */}
          <Card theme={theme} variant="glass" style={styles.achievementsCard}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>
              Achievements
            </Text>
            <View style={styles.achievementsList}>
              {achievements.map((achievement) => (
                <View key={achievement.id} style={styles.achievementItem}>
                  <View style={styles.achievementIcon}>
                    <Text style={styles.achievementEmoji}>
                      {achievement.earned ? achievement.icon : '🔒'}
                    </Text>
                  </View>
                  <View style={styles.achievementDetails}>
                    <Text
                      style={[
                        styles.achievementTitle,
                        {
                          color: achievement.earned ? colors.text : colors.textSecondary,
                        },
                      ]}
                    >
                      {achievement.title}
                    </Text>
                    <Text style={[styles.achievementDescription, { color: colors.textSecondary }]}>
                      {achievement.description}
                    </Text>
                  </View>
                  {achievement.earned && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  )}
                </View>
              ))}
            </View>
          </Card>

          {/* Insights */}
          <Card theme={theme} variant="glass" style={styles.insightsCard}>
            <View style={styles.insightsHeader}>
              <Ionicons name="bulb" size={24} color={colors.warning} />
              <Text style={[styles.chartTitle, { color: colors.text }]}>
                Personal Insights
              </Text>
            </View>
            
            <View style={styles.insightsList}>
              <View style={styles.insightItem}>
                <Text style={[styles.insightText, { color: colors.textSecondary }]}>
                  🌟 You're most punctual on weekends - consider applying that calmness to weekdays!
                </Text>
              </View>
              <View style={styles.insightItem}>
                <Text style={[styles.insightText, { color: colors.textSecondary }]}>
                  ⚡ Your shower time has improved by 2 minutes this week. Great efficiency gains!
                </Text>
              </View>
              <View style={styles.insightItem}>
                <Text style={[styles.insightText, { color: colors.textSecondary }]}>
                  ☕ Coffee preparation is your most consistent task at exactly 3 minutes every day.
                </Text>
              </View>
            </View>
          </Card>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  header: {
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  title: {
    ...TYPOGRAPHY.h1,
  },
  subtitle: {
    ...TYPOGRAPHY.body2,
    marginTop: SPACING.xs,
  },
  scrollView: {
    flex: 1,
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  periodButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  periodButtonText: {
    ...TYPOGRAPHY.body2,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    width: (width - SPACING.md * 3) / 2,
    padding: SPACING.sm,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  statValue: {
    ...TYPOGRAPHY.h3,
    fontWeight: '700',
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
  },
  chartCard: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  chartTitle: {
    ...TYPOGRAPHY.h4,
    marginBottom: SPACING.md,
  },
  chartContainer: {
    width: '100%',
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: '100%',
    paddingTop: 20,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 20,
    borderRadius: 10,
    marginBottom: SPACING.xs,
  },
  barLabel: {
    ...TYPOGRAPHY.caption,
    marginBottom: SPACING.xs,
  },
  barValue: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
  },
  lineChartContainer: {
    width: '100%',
  },
  lineChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    height: '100%',
    position: 'relative',
  },
  dataPoint: {
    position: 'relative',
    flex: 1,
    alignItems: 'center',
  },
  point: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
  },
  line: {
    width: 2,
    position: 'absolute',
    left: '50%',
    marginLeft: -1,
  },
  lineLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.sm,
  },
  lineLabel: {
    ...TYPOGRAPHY.caption,
  },
  achievementsCard: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  achievementsList: {
    gap: SPACING.sm,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  achievementEmoji: {
    fontSize: 24,
  },
  achievementDetails: {
    flex: 1,
  },
  achievementTitle: {
    ...TYPOGRAPHY.body1,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  achievementDescription: {
    ...TYPOGRAPHY.caption,
  },
  insightsCard: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  insightsList: {
    gap: SPACING.sm,
  },
  insightItem: {
    paddingVertical: SPACING.xs,
  },
  insightText: {
    ...TYPOGRAPHY.body2,
    lineHeight: 20,
  },
  bottomPadding: {
    height: 80,
  },
});