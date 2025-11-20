import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { ProgressRing } from '../../components/common/ProgressRing';
import { useAppStore } from '../../stores/appStore';
import { Task, ThemeName } from '../../types';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../constants/theme';

interface ActiveTask extends Task {
  startTime: Date;
  isActive: boolean;
}

export const MorningAssistant: React.FC = () => {
  const { user, activeRoutine, currentTrip, recordTaskCompletion, addDailyInsight } = useAppStore();
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [sessionStartTime] = useState(new Date());
  const [taskStartTime, setTaskStartTime] = useState(new Date());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showMotivation, setShowMotivation] = useState(false);

  const theme: ThemeName = user?.preferences?.theme || 'sunrise-vibes';
  const colors = COLORS[theme];
  
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const tasks = activeRoutine?.tasks || [];
  const currentTask = tasks[currentTaskIndex];
  
  const motivationalMessages = [
    "You're crushing it! 💪",
    "Almost there, superstar! ⭐",
    "Your future self will thank you! 🌟",
    "Look at you being amazing! ✨",
    "One task closer to your goals! 🎯",
    "You're a morning warrior! ⚡",
    "Productivity mode: ON! 🔥",
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isPaused && currentTask) {
        setElapsedTime(prev => prev + 1);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, currentTask]);

  useEffect(() => {
    if (currentTask && elapsedTime > 0 && elapsedTime % 30 === 0) {
      // Show gentle encouragement every 30 seconds
      if (Math.random() > 0.7) {
        setShowMotivation(true);
        setTimeout(() => setShowMotivation(false), 3000);
      }
    }
  }, [elapsedTime, currentTask]);

  const completeCurrentTask = () => {
    if (!currentTask) return;

    const completionTime = Math.floor(elapsedTime / 60) || 1; // At least 1 minute
    recordTaskCompletion(currentTask.id, completionTime);
    
    setCompletedTasks([...completedTasks, currentTask.id]);
    
    // Haptic feedback for completion
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Animate completion
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.1,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();

    if (currentTaskIndex < tasks.length - 1) {
      // Move to next task
      setCurrentTaskIndex(currentTaskIndex + 1);
      setTaskStartTime(new Date());
      setElapsedTime(0);
    } else {
      // All tasks completed!
      completeRoutine();
    }
  };

  const skipCurrentTask = () => {
    if (!currentTask) return;

    Alert.alert(
      'Skip Task?',
      `Are you sure you want to skip "${currentTask.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            
            if (currentTaskIndex < tasks.length - 1) {
              setCurrentTaskIndex(currentTaskIndex + 1);
              setTaskStartTime(new Date());
              setElapsedTime(0);
            } else {
              completeRoutine();
            }
          },
        },
      ]
    );
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const completeRoutine = () => {
    const totalTime = Math.floor((Date.now() - sessionStartTime.getTime()) / 60000);
    const completionPercentage = (completedTasks.length / tasks.length) * 100;
    
    // Save daily insight
    const today = new Date().toISOString().split('T')[0];
    addDailyInsight({
      date: today,
      routineCompletion: completionPercentage,
      punctualityRating: 'on-time', // This would be calculated based on trip data
      weatherConditions: {
        temperature: 72,
        condition: 'sunny',
        humidity: 45,
        windSpeed: 5,
        precipitation: 0,
      },
      tasksCompleted: completedTasks.length,
      totalTasks: tasks.length,
      learningAdjustments: [],
    });

    Alert.alert(
      '🎉 Routine Complete!',
      `Amazing work! You completed ${completedTasks.length} out of ${tasks.length} tasks in ${totalTime} minutes.`,
      [
        {
          text: 'Awesome!',
          onPress: () => {
            // Reset state for next session
            setCurrentTaskIndex(0);
            setCompletedTasks([]);
            setElapsedTime(0);
          },
        },
      ]
    );

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const getProgressPercentage = () => {
    if (tasks.length === 0) return 0;
    const baseProgress = (completedTasks.length / tasks.length) * 100;
    const currentTaskProgress = currentTask ? (elapsedTime / (currentTask.estimatedTime * 60)) * (100 / tasks.length) : 0;
    return Math.min(100, baseProgress + currentTaskProgress);
  };

  const getTimeStatus = () => {
    if (!currentTask) return { status: 'completed', color: colors.success };
    
    const estimatedSeconds = currentTask.estimatedTime * 60;
    const percentageComplete = (elapsedTime / estimatedSeconds) * 100;
    
    if (percentageComplete <= 80) {
      return { status: 'on-track', color: colors.success };
    } else if (percentageComplete <= 100) {
      return { status: 'almost-done', color: colors.warning };
    } else {
      return { status: 'over-time', color: colors.error };
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!activeRoutine || tasks.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyState}>
          <Ionicons name="time" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No Active Routine
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Create a routine to start your morning assistant
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const timeStatus = getTimeStatus();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.background, `${colors.primary}15`]}
        style={styles.gradientBackground}
      >
        {/* Header Progress */}
        <View style={styles.header}>
          <View style={styles.progressContainer}>
            <ProgressRing
              progress={getProgressPercentage()}
              size={80}
              theme={theme}
              showPercentage={true}
              label="Complete"
            />
            <View style={styles.progressInfo}>
              <Text style={[styles.progressTitle, { color: colors.text }]}>
                {completedTasks.length} of {tasks.length} tasks
              </Text>
              <Text style={[styles.progressSubtitle, { color: colors.textSecondary }]}>
                {activeRoutine.name}
              </Text>
            </View>
          </View>
        </View>

        {/* Current Task */}
        {currentTask && (
          <View style={styles.currentTaskSection}>
            <Card theme={theme} variant="glass" style={styles.currentTaskCard}>
              <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <View style={styles.taskHeader}>
                  <Text style={styles.taskEmoji}>{currentTask.icon}</Text>
                  <View style={styles.taskInfo}>
                    <Text style={[styles.taskName, { color: colors.text }]}>
                      {currentTask.name}
                    </Text>
                    <Text style={[styles.taskInstructions, { color: colors.textSecondary }]}>
                      {currentTask.customInstructions || `Estimated: ${currentTask.estimatedTime} minutes`}
                    </Text>
                  </View>
                </View>

                <View style={styles.timeDisplay}>
                  <View style={styles.timeInfo}>
                    <Text style={[styles.elapsedTime, { color: timeStatus.color }]}>
                      {formatTime(elapsedTime)}
                    </Text>
                    <Text style={[styles.estimatedTime, { color: colors.textSecondary }]}>
                      / {formatTime(currentTask.estimatedTime * 60)}
                    </Text>
                  </View>
                  
                  <View style={[styles.statusIndicator, { backgroundColor: timeStatus.color }]}>
                    <Text style={styles.statusText}>
                      {timeStatus.status === 'on-track' && '✓'}
                      {timeStatus.status === 'almost-done' && '⚡'}
                      {timeStatus.status === 'over-time' && '⏰'}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            </Card>

            {/* Task Actions */}
            <View style={styles.taskActions}>
              <Button
                title={isPaused ? 'Resume' : 'Pause'}
                onPress={togglePause}
                variant="outline"
                theme={theme}
                style={styles.actionButton}
              />
              
              <Button
                title="Complete ✓"
                onPress={completeCurrentTask}
                theme={theme}
                style={[styles.actionButton, styles.completeButton]}
              />
              
              <TouchableOpacity
                style={styles.skipButton}
                onPress={skipCurrentTask}
              >
                <Ionicons name="play-forward" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Motivation Message */}
        {showMotivation && (
          <Card theme={theme} variant="glass" style={styles.motivationCard}>
            <Text style={[styles.motivationText, { color: colors.primary }]}>
              {motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]}
            </Text>
          </Card>
        )}

        {/* Next Tasks Preview */}
        {currentTaskIndex < tasks.length - 1 && (
          <Card theme={theme} variant="glass" style={styles.nextTasksCard}>
            <Text style={[styles.nextTasksTitle, { color: colors.text }]}>
              Up Next
            </Text>
            {tasks.slice(currentTaskIndex + 1, currentTaskIndex + 3).map((task, index) => (
              <View key={task.id} style={styles.nextTask}>
                <Text style={styles.nextTaskEmoji}>{task.icon}</Text>
                <Text style={[styles.nextTaskName, { color: colors.textSecondary }]}>
                  {task.name}
                </Text>
                <Text style={[styles.nextTaskTime, { color: colors.textSecondary }]}>
                  {task.estimatedTime}m
                </Text>
              </View>
            ))}
          </Card>
        )}

        {/* Trip Info */}
        {currentTrip && (
          <Card theme={theme} variant="glass" style={styles.tripInfoCard}>
            <View style={styles.tripHeader}>
              <Ionicons name="car" size={20} color={colors.primary} />
              <Text style={[styles.tripTitle, { color: colors.text }]}>
                Leave for {currentTrip.destination.name}
              </Text>
            </View>
            <Text style={[styles.tripTime, { color: colors.primary }]}>
              {currentTrip.departureTime.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </Card>
        )}
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
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressInfo: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  progressTitle: {
    ...TYPOGRAPHY.h3,
    marginBottom: SPACING.xs,
  },
  progressSubtitle: {
    ...TYPOGRAPHY.body2,
  },
  currentTaskSection: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  currentTaskCard: {
    marginBottom: SPACING.md,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  taskEmoji: {
    fontSize: 48,
    marginRight: SPACING.md,
  },
  taskInfo: {
    flex: 1,
  },
  taskName: {
    ...TYPOGRAPHY.h2,
    marginBottom: SPACING.xs,
  },
  taskInstructions: {
    ...TYPOGRAPHY.body2,
  },
  timeDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  elapsedTime: {
    ...TYPOGRAPHY.h1,
    fontWeight: '700',
  },
  estimatedTime: {
    ...TYPOGRAPHY.h4,
    marginLeft: SPACING.xs,
  },
  statusIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 16,
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
  },
  completeButton: {
    flex: 2,
  },
  skipButton: {
    padding: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  motivationCard: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  motivationText: {
    ...TYPOGRAPHY.body1,
    fontWeight: '600',
    textAlign: 'center',
  },
  nextTasksCard: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  nextTasksTitle: {
    ...TYPOGRAPHY.h4,
    marginBottom: SPACING.sm,
  },
  nextTask: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  nextTaskEmoji: {
    fontSize: 16,
    marginRight: SPACING.sm,
  },
  nextTaskName: {
    ...TYPOGRAPHY.body2,
    flex: 1,
  },
  nextTaskTime: {
    ...TYPOGRAPHY.caption,
  },
  tripInfoCard: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  tripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  tripTitle: {
    ...TYPOGRAPHY.body1,
    marginLeft: SPACING.xs,
  },
  tripTime: {
    ...TYPOGRAPHY.h3,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h2,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.body2,
    textAlign: 'center',
  },
});