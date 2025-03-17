import { View, Text, Pressable, StyleSheet, Platform, Alert } from 'react-native';
import { format, formatDistanceToNow } from 'date-fns';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { Task, TaskPriority, TaskCategory } from '../store/tasks';
import { useTasksStore } from '../store/tasks';

interface TaskCardProps {
  task: Task;
  onToggleComplete?: (id: string) => void;
}

const PRIORITY_COLORS = {
  high: '#FF3B30',    // Red
  medium: '#FF9500',  // Orange
  low: '#34C759',     // Green
};

const CATEGORY_COLORS = {
  study: '#5856D6',      // Purple
  homework: '#007AFF',   // Blue
  exam: '#FF2D55',       // Pink
  project: '#FF9500',    // Orange
  other: '#8E8E93',      // Gray
};

export function TaskCard({ task, onToggleComplete }: TaskCardProps) {
  const { deleteTask, toggleTaskCompletion } = useTasksStore();
  const priorityColor = PRIORITY_COLORS[task.priority];
  const categoryColor = CATEGORY_COLORS[task.category] || CATEGORY_COLORS.other;
  
  // Add validation to ensure deadline is a valid date
  const dueDate = task.deadline ? new Date(task.deadline) : null;
  const isOverdue = !task.completed && dueDate && dueDate < new Date();

  const getReminderText = () => {
    if (!task.reminderTime || !dueDate) return null;
    const reminderDate = new Date(dueDate.getTime() - task.reminderTime * 60 * 1000);
    if (reminderDate < new Date()) return null;
    return formatDistanceToNow(reminderDate) + ' before due date';
  };

  // Get the reminder text once to avoid multiple calculations
  const reminderText = getReminderText();

  const handleToggleComplete = (e) => {
    e.stopPropagation();
    if (onToggleComplete) {
      onToggleComplete(task._id);
    } else {
      toggleTaskCompletion(task._id);
    }
  };

  const handleDeleteTask = (e) => {
    e.stopPropagation();
    Alert.alert(
      "Delete Task",
      `Are you sure you want to delete "${task.title}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              await deleteTask(task._id);
            } catch (err) {
              console.error('Error deleting task:', err);
              Alert.alert('Error', 'Failed to delete task. Please try again.');
            }
          } 
        }
      ]
    );
  };

  return (
    <Link href={`/task/${task._id}`} asChild>
      <Pressable style={styles.container}>
        <Pressable 
          style={[styles.checkbox, task.completed && styles.checkboxChecked]}
          onPress={handleToggleComplete}
        >
          {task.completed && (
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          )}
        </Pressable>

        <View style={styles.content}>
          <View style={styles.header}>
            <Text 
              style={[
                styles.title, 
                task.completed && styles.completedTitle,
                isOverdue && styles.overdueTitle,
              ]}
              numberOfLines={1}
            >
              {task.title}
            </Text>
            {dueDate ? (
              <Text style={[styles.date, isOverdue && styles.overdueDate]}>
                {format(dueDate, 'MMM d, yyyy')}
              </Text>
            ) : (
              <Text style={styles.date}>No deadline</Text>
            )}
          </View>

          <Text 
            style={[styles.description, task.completed && styles.completedText]} 
            numberOfLines={2}
          >
            {task.description}
          </Text>

          <View style={styles.footer}>
            <View style={styles.tags}>
              <View style={[styles.priorityTag, { backgroundColor: priorityColor + '20' }]}>
                <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
                <Text style={[styles.tagText, { color: priorityColor }]}>
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </Text>
              </View>

              <View style={[styles.categoryTag, { backgroundColor: categoryColor + '20' }]}>
                <Text style={[styles.tagText, { color: categoryColor }]}>
                  {task.category.charAt(0).toUpperCase() + task.category.slice(1)}
                </Text>
              </View>
            </View>

            {task.reminderTime && reminderText && (
              <View style={styles.reminderContainer}>
                <Ionicons name="notifications" size={14} color="#8E8E93" />
                <Text style={styles.reminderText}>
                  Reminder {reminderText}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        <Pressable 
          style={styles.deleteButton}
          onPress={handleDeleteTask}
        >
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
        </Pressable>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#8E8E93',
  },
  date: {
    fontSize: 14,
    color: '#8E8E93',
  },
  description: {
    fontSize: 14,
    color: '#3C3C43',
    marginBottom: 8,
    lineHeight: 20,
  },
  completedText: {
    color: '#8E8E93',
  },
  footer: {
    marginTop: 8,
  },
  overdueTitle: {
    color: '#FF3B30',
  },
  overdueDate: {
    color: '#FF3B30',
  },
  reminderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  reminderText: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 4,
  },
  tags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
}); 