import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Card } from './Card';
import { ProgressRing } from './ProgressRing';
import { Task, ThemeName } from '../../types';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../constants/theme';
import { TASK_CATEGORIES } from '../../constants/tasks';

interface TaskCardProps {
  task: Task;
  theme?: ThemeName;
  onPress?: () => void;
  onToggle?: (taskId: string) => void;
  showProgress?: boolean;
  isCompleted?: boolean;
  completionTime?: number;
  style?: any;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  theme = 'sunrise-vibes',
  onPress,
  onToggle,
  showProgress = false,
  isCompleted = false,
  completionTime,
  style,
}) => {
  const colors = COLORS[theme];
  const categoryInfo = TASK_CATEGORIES[task.category];
  
  const averageTime = task.actualTimes.length > 0
    ? task.actualTimes.reduce((a, b) => a + b, 0) / task.actualTimes.length
    : task.estimatedTime;

  const progress = completionTime ? (completionTime / task.estimatedTime) * 100 : 0;

  const handleToggle = () => {
    if (onToggle) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onToggle(task.id);
    }
  };

  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress} activeOpacity={0.8}>
      <Card theme={theme} variant="glass" style={[styles.container, style]}>
        <View style={styles.header}>
          <View style={styles.taskInfo}>
            <View style={styles.iconContainer}>
              <Text style={styles.emoji}>{task.icon}</Text>
            </View>
            
            <View style={styles.textContainer}>
              <Text style={[styles.taskName, { color: colors.text }]}>
                {task.name}
              </Text>
              <Text style={[styles.category, { color: colors.textSecondary }]}>
                {categoryInfo.name} • {Math.round(averageTime)} min
              </Text>
            </View>
          </View>

          <View style={styles.rightSection}>
            {showProgress && completionTime ? (
              <ProgressRing
                progress={Math.min(progress, 100)}
                size={40}
                strokeWidth={4}
                theme={theme}
                showPercentage={false}
              />
            ) : (
              <TouchableOpacity
                onPress={handleToggle}
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: isCompleted ? colors.primary : 'transparent',
                    borderColor: colors.primary,
                  },
                ]}
              >
                {isCompleted && (
                  <Ionicons
                    name="checkmark"
                    size={16}
                    color={theme === 'midnight-mode' || theme === 'y2k-nostalgia' ? colors.text : '#FFFFFF'}
                  />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {task.customInstructions && (
          <Text style={[styles.instructions, { color: colors.textSecondary }]}>
            {task.customInstructions}
          </Text>
        )}

        {task.actualTimes.length > 0 && (
          <View style={styles.streak}>
            <Ionicons name="flame" size={12} color={colors.warning} />
            <Text style={[styles.streakText, { color: colors.textSecondary }]}>
              {task.actualTimes.length} times completed
            </Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  emoji: {
    fontSize: 20,
  },
  textContainer: {
    flex: 1,
  },
  taskName: {
    ...TYPOGRAPHY.body1,
    fontWeight: '600',
    marginBottom: 2,
  },
  category: {
    ...TYPOGRAPHY.caption,
  },
  rightSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructions: {
    ...TYPOGRAPHY.caption,
    marginTop: SPACING.sm,
    fontStyle: 'italic',
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  streakText: {
    ...TYPOGRAPHY.caption,
    marginLeft: 4,
  },
});