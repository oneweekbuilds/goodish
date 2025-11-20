import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useAppStore } from '../stores/appStore';
import { ThemeName } from '../types';
import { COLORS } from '../constants/theme';

const { width } = Dimensions.get('window');

export const SimpleDashboard: React.FC = () => {
  const { user, routines } = useAppStore();
  const [currentTime, setCurrentTime] = useState(new Date());

  const theme: ThemeName = user?.preferences?.theme || 'sunrise-vibes';
  const colors = COLORS[theme];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

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

  const activeRoutine = routines.find(r => r.isDefault) || routines[0];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header Greeting */}
        <View style={[styles.greetingCard, { backgroundColor: colors.surface }]}>
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
        </View>

        {/* Sleep & Bedtime */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Tonight's Plan
          </Text>
          <Text style={[styles.bedtimeText, { color: colors.primary }]}>
            Bed by 10:30 PM
          </Text>
          <Text style={[styles.bedtimeReason, { color: colors.textSecondary }]}>
            Based on your 8-hour sleep goal and tomorrow's 7:15 AM wake-up
          </Text>
        </View>

        {/* Routine Preview */}
        {activeRoutine && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.routineHeader}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Tomorrow's Routine
              </Text>
              <Text style={[styles.routineTime, { color: colors.primary }]}>
                {activeRoutine.estimatedDuration} min
              </Text>
            </View>
            
            <View style={styles.taskPreview}>
              {activeRoutine.tasks.slice(0, 4).map((task, index) => (
                <View key={task.id} style={styles.taskPreviewItem}>
                  <Text style={styles.taskEmoji}>{task.icon}</Text>
                  <Text style={[styles.taskPreviewText, { color: colors.textSecondary }]}>
                    {task.name}
                  </Text>
                  <Text style={[styles.taskTime, { color: colors.textSecondary }]}>
                    {task.estimatedTime}m
                  </Text>
                </View>
              ))}
              {activeRoutine.tasks.length > 4 && (
                <Text style={[styles.moreTasksText, { color: colors.textSecondary }]}>
                  +{activeRoutine.tasks.length - 4} more tasks
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Stats */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            This Week's Progress
          </Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.primary }]}>89%</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                On Time
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.success }]}>5</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Day Streak
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.accent }]}>23m</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Avg Time
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.actionButtonText}>Plan Trip</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.secondary }]}
          >
            <Text style={styles.actionButtonText}>Edit Routine</Text>
          </TouchableOpacity>
        </View>

        {/* Tips */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.tipsHeader}>
            <Text style={styles.tipEmoji}>💡</Text>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Today's Tip
            </Text>
          </View>
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            Based on your patterns, you tend to run 5 minutes behind on weekdays. 
            Consider setting your alarm 5 minutes earlier! ✨
          </Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  greetingCard: {
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.15)',
  },
  greeting: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.15)',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '500',
    marginBottom: 8,
  },
  bedtimeText: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  bedtimeReason: {
    fontSize: 12,
  },
  routineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  routineTime: {
    fontSize: 16,
    fontWeight: '600',
  },
  taskPreview: {
    gap: 8,
  },
  taskPreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskEmoji: {
    fontSize: 16,
    marginRight: 12,
  },
  taskPreviewText: {
    fontSize: 14,
    flex: 1,
  },
  taskTime: {
    fontSize: 12,
  },
  moreTasksText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.15)',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bottomPadding: {
    height: 80,
  },
});