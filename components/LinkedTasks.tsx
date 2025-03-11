import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTasksStore } from '../store/tasks';
import { useNotesStore } from '../store/notes';
import { format } from 'date-fns';

interface LinkedTasksProps {
  noteId: string;
  taskIds: string[];
}

export function LinkedTasks({ noteId, taskIds }: LinkedTasksProps) {
  const { tasks } = useTasksStore();
  const { unlinkTaskFromNote } = useNotesStore();
  
  const linkedTasks = tasks.filter(task => taskIds?.includes(task._id));

  const handleUnlink = async (taskId: string) => {
    await unlinkTaskFromNote(noteId, taskId);
  };

  if (!linkedTasks.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No linked tasks</Text>
        <Link href="/new-task" asChild>
          <Pressable style={styles.addButton}>
            <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
            <Text style={styles.addButtonText}>Add Task</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Linked Tasks</Text>
      {linkedTasks.map((task) => (
        <View key={task._id} style={styles.taskCard}>
          <Link href={`/task/${task._id}`} asChild>
            <Pressable style={styles.taskContent}>
              <View style={styles.taskHeader}>
                <Text style={styles.taskTitle} numberOfLines={1}>
                  {task.title}
                </Text>
                <Text style={styles.taskDate}>
                  {format(new Date(task.dueDate), 'MMM d')}
                </Text>
              </View>
              <View style={styles.taskFooter}>
                <View style={[styles.priorityTag, { backgroundColor: getPriorityColor(task.priority) + '20' }]}>
                  <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(task.priority) }]} />
                  <Text style={[styles.tagText, { color: getPriorityColor(task.priority) }]}>
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                  </Text>
                </View>
                {task.completed && (
                  <View style={styles.completedTag}>
                    <Ionicons name="checkmark-circle" size={14} color="#34C759" />
                    <Text style={styles.completedText}>Completed</Text>
                  </View>
                )}
              </View>
            </Pressable>
          </Link>
          <Pressable
            style={styles.unlinkButton}
            onPress={() => handleUnlink(task._id)}
          >
            <Ionicons name="close-circle" size={20} color="#FF3B30" />
          </Pressable>
        </View>
      ))}
      <Link href="/new-task" asChild>
        <Pressable style={styles.addButton}>
          <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
          <Text style={styles.addButtonText}>Add Task</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return '#FF3B30';
    case 'medium':
      return '#FF9500';
    case 'low':
      return '#34C759';
    default:
      return '#8E8E93';
  }
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1C1C1E',
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  taskContent: {
    flex: 1,
    padding: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
    color: '#1C1C1E',
  },
  taskDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  taskFooter: {
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
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  completedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  completedText: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '500',
  },
  unlinkButton: {
    padding: 12,
  },
  emptyContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  addButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
}); 