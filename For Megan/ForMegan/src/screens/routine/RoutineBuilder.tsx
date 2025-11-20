import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  PanResponder,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { TaskCard } from '../../components/common/TaskCard';
import { useAppStore } from '../../stores/appStore';
import { Task, Routine, ThemeName } from '../../types';
import { DEFAULT_TASK_TEMPLATES, ROUTINE_TEMPLATES } from '../../constants/tasks';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../constants/theme';

const { width } = Dimensions.get('window');

interface DraggableTaskProps {
  task: Task;
  index: number;
  onDrop: (fromIndex: number, toIndex: number) => void;
  theme: ThemeName;
  onRemove: (taskId: string) => void;
}

const DraggableTask: React.FC<DraggableTaskProps> = ({
  task,
  index,
  onDrop,
  theme,
  onRemove,
}) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;
  const [isDragging, setIsDragging] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsDragging(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Animated.spring(scale, {
          toValue: 1.05,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        setIsDragging(false);
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
        }).start();
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        styles.draggableTask,
        {
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { scale: scale },
          ],
          zIndex: isDragging ? 1000 : 1,
          opacity: isDragging ? 0.8 : 1,
        },
      ]}
      {...panResponder.panHandlers}
    >
      <TaskCard
        task={task}
        theme={theme}
        style={[
          styles.taskCardStyle,
          isDragging && styles.draggingCard,
        ]}
      />
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => onRemove(task.id)}
      >
        <Ionicons name="close-circle" size={20} color={COLORS[theme].error} />
      </TouchableOpacity>
    </Animated.View>
  );
};

export const RoutineBuilder: React.FC = () => {
  const { user, addRoutine, routines } = useAppStore();
  const [routineName, setRoutineName] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<Task[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Task[]>(
    DEFAULT_TASK_TEMPLATES.map((template, index) => ({
      ...template,
      id: `task-${index}`,
      actualTimes: [],
    }))
  );

  const theme: ThemeName = user?.preferences?.theme || 'sunrise-vibes';
  const colors = COLORS[theme];

  const addTaskToRoutine = (task: Task) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newTask = {
      ...task,
      id: `${task.id}-${Date.now()}`,
    };
    setSelectedTasks([...selectedTasks, newTask]);
  };

  const removeTaskFromRoutine = (taskId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTasks(selectedTasks.filter(task => task.id !== taskId));
  };

  const reorderTasks = (fromIndex: number, toIndex: number) => {
    const newTasks = [...selectedTasks];
    const [movedTask] = newTasks.splice(fromIndex, 1);
    newTasks.splice(toIndex, 0, movedTask);
    setSelectedTasks(newTasks);
  };

  const calculateTotalTime = () => {
    return selectedTasks.reduce((total, task) => total + task.estimatedTime, 0);
  };

  const saveRoutine = () => {
    if (!routineName.trim()) {
      Alert.alert('Missing Name', 'Please enter a name for your routine');
      return;
    }

    if (selectedTasks.length === 0) {
      Alert.alert('No Tasks', 'Please add at least one task to your routine');
      return;
    }

    const newRoutine: Routine = {
      id: `routine-${Date.now()}`,
      name: routineName.trim(),
      tasks: selectedTasks,
      isDefault: routines.length === 0,
      estimatedDuration: calculateTotalTime(),
      createdAt: new Date(),
    };

    addRoutine(newRoutine);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      'Routine Saved!', 
      `"${routineName}" has been created successfully`,
      [{ text: 'OK', onPress: () => {
        setRoutineName('');
        setSelectedTasks([]);
      }}]
    );
  };

  const useTemplate = (template: typeof ROUTINE_TEMPLATES[0]) => {
    setRoutineName(template.name);
    // For now, just add some sample tasks since we'd need to match IDs
    const templateTasks = availableTasks.slice(0, 4).map((task, index) => ({
      ...task,
      id: `template-${index}-${Date.now()}`,
    }));
    setSelectedTasks(templateTasks);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.background, `${colors.primary}10`]}
        style={styles.gradientBackground}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Build Your Routine
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Drag tasks to reorder, customize your perfect morning
          </Text>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Templates Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Quick Templates
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {ROUTINE_TEMPLATES.map((template) => (
                <TouchableOpacity
                  key={template.name}
                  onPress={() => useTemplate(template)}
                  style={styles.templateCard}
                >
                  <Card theme={theme} variant="glass" style={styles.templateContent}>
                    <Text style={styles.templateEmoji}>{template.icon}</Text>
                    <Text style={[styles.templateName, { color: colors.text }]}>
                      {template.name}
                    </Text>
                    <Text style={[styles.templateDuration, { color: colors.textSecondary }]}>
                      {template.duration} min
                    </Text>
                  </Card>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Routine Name Input */}
          <Card theme={theme} variant="glass" style={styles.nameInputCard}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Routine Name
            </Text>
            <TextInput
              style={[styles.nameInput, { color: colors.text, borderColor: colors.primary }]}
              value={routineName}
              onChangeText={setRoutineName}
              placeholder="My Amazing Morning"
              placeholderTextColor={colors.textSecondary}
            />
          </Card>

          {/* Current Routine */}
          <View style={styles.section}>
            <View style={styles.routineHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Your Routine
              </Text>
              <Text style={[styles.totalTime, { color: colors.primary }]}>
                {calculateTotalTime()} minutes
              </Text>
            </View>

            {selectedTasks.length === 0 ? (
              <Card theme={theme} variant="glass" style={styles.emptyState}>
                <Ionicons name="add-circle-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No tasks added yet
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                  Choose from the tasks below to build your routine
                </Text>
              </Card>
            ) : (
              <View style={styles.tasksList}>
                {selectedTasks.map((task, index) => (
                  <DraggableTask
                    key={task.id}
                    task={task}
                    index={index}
                    onDrop={reorderTasks}
                    theme={theme}
                    onRemove={removeTaskFromRoutine}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Available Tasks */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Available Tasks
            </Text>
            <View style={styles.availableTasksGrid}>
              {availableTasks.map((task) => (
                <TouchableOpacity
                  key={task.id}
                  onPress={() => addTaskToRoutine(task)}
                  style={styles.availableTask}
                >
                  <Card theme={theme} variant="solid" style={styles.availableTaskContent}>
                    <Text style={styles.taskEmoji}>{task.icon}</Text>
                    <Text style={[styles.taskName, { color: colors.text }]}>
                      {task.name}
                    </Text>
                    <Text style={[styles.taskTime, { color: colors.textSecondary }]}>
                      {task.estimatedTime}m
                    </Text>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>

        {/* Save Button */}
        <View style={styles.footer}>
          <Button
            title="Save Routine"
            onPress={saveRoutine}
            theme={theme}
            style={styles.saveButton}
            disabled={selectedTasks.length === 0 || !routineName.trim()}
          />
        </View>
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
  section: {
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    marginBottom: SPACING.md,
  },
  templateCard: {
    marginRight: SPACING.sm,
  },
  templateContent: {
    alignItems: 'center',
    padding: SPACING.md,
    minWidth: 100,
  },
  templateEmoji: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  templateName: {
    ...TYPOGRAPHY.body2,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  templateDuration: {
    ...TYPOGRAPHY.caption,
  },
  nameInputCard: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    ...TYPOGRAPHY.body1,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  nameInput: {
    ...TYPOGRAPHY.body1,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    backgroundColor: 'transparent',
  },
  routineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  totalTime: {
    ...TYPOGRAPHY.body1,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    ...TYPOGRAPHY.body1,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    ...TYPOGRAPHY.caption,
    textAlign: 'center',
  },
  tasksList: {
    gap: SPACING.sm,
  },
  draggableTask: {
    position: 'relative',
  },
  taskCardStyle: {
    marginVertical: 0,
  },
  draggingCard: {
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 10,
    zIndex: 1001,
  },
  availableTasksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  availableTask: {
    width: (width - SPACING.md * 3) / 2,
  },
  availableTaskContent: {
    alignItems: 'center',
    padding: SPACING.md,
  },
  taskEmoji: {
    fontSize: 24,
    marginBottom: SPACING.xs,
  },
  taskName: {
    ...TYPOGRAPHY.body2,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  taskTime: {
    ...TYPOGRAPHY.caption,
  },
  bottomPadding: {
    height: 100,
  },
  footer: {
    padding: SPACING.md,
    paddingTop: SPACING.sm,
  },
  saveButton: {
    width: '100%',
  },
});