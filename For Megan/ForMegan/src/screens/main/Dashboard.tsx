import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { FloatingActionButton } from '../../components/common/FloatingActionButton';
import { ProgressRing } from '../../components/common/ProgressRing';
import { TaskCard } from '../../components/common/TaskCard';
import { useAppStore } from '../../stores/appStore';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../constants/theme';
import { ThemeName } from '../../types';

const { width } = Dimensions.get('window');

export const Dashboard: React.FC = () => {
  const {
    user,
    activeRoutine,
    currentTrip,
    insights,
    integrations,
  } = useAppStore();

  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const theme: ThemeName = user?.preferences?.theme || 'sunrise-vibes';
  const colors = COLORS[theme];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const getPersonalizedGreeting = () => {
    const hour = currentTime.getHours();
    const firstName = user?.name?.split(' ')[0] || 'Beautiful';
    
    if (hour >= 18) {
      return `Good evening, ${firstName}! Ready for tomorrow?`;
    } else if (hour >= 12) {
      return `Good afternoon, ${firstName}! How's your day going?`;
    } else if (hour >= 5) {
      return `Good morning, ${firstName}! Let's make today amazing!`;
    } else {
      return `Hey night owl, ${firstName}! Planning ahead?`;
    }
  };

  const getRecommendedBedtime = () => {
    const sleepGoal = user?.sleepGoal || 8;
    const wakeTime = activeRoutine ? 
      new Date(Date.now() + 24 * 60 * 60 * 1000) : // Tomorrow
      new Date();
    
    const bedtime = new Date(wakeTime.getTime() - sleepGoal * 60 * 60 * 1000);
    return bedtime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTodaysInsight = () => {
    const today = new Date().toISOString().split('T')[0];
    return insights.find(insight => insight.date === today);
  };

  const ouraIntegration = integrations.find(i => i.type === 'oura');
  const todayInsight = getTodaysInsight();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.background, `${colors.primary}10`]}
        style={styles.gradientBackground}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Header Greeting */}
          <Card theme={theme} variant="glass" style={styles.greetingCard}>
            <Text style={[styles.greeting, { color: colors.text }]}>
              {getPersonalizedGreeting()}
            </Text>
            <Text style={[styles.date, { color: colors.textSecondary }]}>
              {currentTime.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          </Card>

          {/* Sleep & Bedtime Recommendation */}
          <Card theme={theme} variant="glass" style={styles.bedtimeCard}>
            <View style={styles.bedtimeHeader}>
              <View>
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  Tonight's Plan
                </Text>
                <Text style={[styles.bedtimeText, { color: colors.primary }]}>
                  Bed by {getRecommendedBedtime()}
                </Text>
              </View>
              
              {ouraIntegration?.isConnected && (
                <View style={styles.sleepScore}>
                  <ProgressRing
                    progress={75} // Mock sleep score
                    size={60}
                    theme={theme}
                    showPercentage={false}
                    label="Sleep"
                  />
                </View>
              )}
            </View>
            
            <Text style={[styles.bedtimeReason, { color: colors.textSecondary }]}>
              Based on your 8-hour sleep goal and tomorrow's 7:15 AM wake-up
            </Text>
          </Card>

          {/* Tomorrow's Routine Preview */}
          {activeRoutine && (
            <Card theme={theme} variant="glass" style={styles.routineCard}>
              <View style={styles.routineHeader}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  Tomorrow's Routine
                </Text>
                <Text style={[styles.routineTime, { color: colors.primary }]}>
                  {activeRoutine.estimatedDuration} min
                </Text>
              </View>
              
              <View style={styles.taskPreview}>
                {activeRoutine.tasks.slice(0, 3).map((task, index) => (
                  <View key={task.id} style={styles.taskPreviewItem}>
                    <Text style={styles.taskEmoji}>{task.icon}</Text>
                    <Text style={[styles.taskPreviewText, { color: colors.textSecondary }]}>
                      {task.name}
                    </Text>
                  </View>
                ))}
                {activeRoutine.tasks.length > 3 && (
                  <Text style={[styles.moreTasksText, { color: colors.textSecondary }]}>
                    +{activeRoutine.tasks.length - 3} more tasks
                  </Text>
                )}
              </View>
            </Card>
          )}

          {/* Current Trip */}
          {currentTrip && (
            <Card theme={theme} variant="glass" style={styles.tripCard}>
              <View style={styles.tripHeader}>
                <Ionicons name="car" size={24} color={colors.primary} />
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  Next Trip
                </Text>
              </View>
              
              <Text style={[styles.tripDestination, { color: colors.text }]}>
                {currentTrip.destination.name}
              </Text>
              <Text style={[styles.tripTime, { color: colors.textSecondary }]}>
                Leave by {currentTrip.departureTime.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </Card>
          )}

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <Button
              title="Plan Trip"
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              variant="outline"
              theme={theme}
              style={styles.quickActionButton}
            />
            <Button
              title="Edit Routine"
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              variant="outline"
              theme={theme}
              style={styles.quickActionButton}
            />
          </View>

          {/* Stats Overview */}
          <Card theme={theme} variant="glass" style={styles.statsCard}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              This Week
            </Text>
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.primary }]}>
                  85%
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  On Time
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.success }]}>
                  5
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Day Streak
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.accent }]}>
                  23m
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Avg Time
                </Text>
              </View>
            </View>
          </Card>

          {/* Tips Card */}
          <Card theme={theme} variant="glass" style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <Ionicons name="bulb" size={20} color={colors.warning} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Today's Tip
              </Text>
            </View>
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              Based on your patterns, you tend to run 5 minutes behind on weekdays. 
              Consider setting your alarm 5 minutes earlier! 💫
            </Text>
          </Card>

          <View style={styles.bottomPadding} />
        </ScrollView>

        {/* Floating Action Button */}
        <FloatingActionButton
          icon="add"
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
          theme={theme}
          style={styles.fab}
        />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  greetingCard: {
    marginBottom: SPACING.md,
  },
  greeting: {
    ...TYPOGRAPHY.h2,
    marginBottom: SPACING.xs,
  },
  date: {
    ...TYPOGRAPHY.body2,
  },
  bedtimeCard: {
    marginBottom: SPACING.md,
  },
  bedtimeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  cardTitle: {
    ...TYPOGRAPHY.h4,
    marginBottom: SPACING.xs,
  },
  bedtimeText: {
    ...TYPOGRAPHY.h3,
    fontWeight: '700',
  },
  bedtimeReason: {
    ...TYPOGRAPHY.caption,
  },
  sleepScore: {
    alignItems: 'center',
  },
  routineCard: {
    marginBottom: SPACING.md,
  },
  routineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  routineTime: {
    ...TYPOGRAPHY.body1,
    fontWeight: '600',
  },
  taskPreview: {
    gap: SPACING.xs,
  },
  taskPreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskEmoji: {
    fontSize: 16,
    marginRight: SPACING.sm,
  },
  taskPreviewText: {
    ...TYPOGRAPHY.body2,
  },
  moreTasksText: {
    ...TYPOGRAPHY.caption,
    fontStyle: 'italic',
    marginTop: SPACING.xs,
  },
  tripCard: {
    marginBottom: SPACING.md,
  },
  tripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  tripDestination: {
    ...TYPOGRAPHY.body1,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  tripTime: {
    ...TYPOGRAPHY.body2,
  },
  quickActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  quickActionButton: {
    flex: 1,
  },
  statsCard: {
    marginBottom: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.sm,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    ...TYPOGRAPHY.h3,
    fontWeight: '700',
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    marginTop: SPACING.xs,
  },
  tipsCard: {
    marginBottom: SPACING.md,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  tipText: {
    ...TYPOGRAPHY.body2,
    lineHeight: 20,
  },
  bottomPadding: {
    height: 80, // Space for FAB
  },
  fab: {
    position: 'absolute',
    bottom: SPACING.lg,
    right: SPACING.lg,
  },
});