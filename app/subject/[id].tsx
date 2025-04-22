import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useSubjectsStore } from '../../store/subjects';
import { useTasksStore } from '../../store/tasks';
import { TaskCard } from '../../components/TaskCard';

export default function SubjectDetailScreen() {
  const { id } = useLocalSearchParams();
  const { subjects, updateSubject, deleteSubject, loading: subjectLoading } = useSubjectsStore();
  const { tasks, fetchTasks, loading: tasksLoading } = useTasksStore();
  const [subject, setSubject] = useState(null);
  const [subjectTasks, setSubjectTasks] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (subjects.length > 0) {
      const foundSubject = subjects.find(s => s._id === id);
      if (foundSubject) {
        setSubject(foundSubject);
      } else {
        Alert.alert('Error', 'Subject not found');
        router.back();
      }
    }
  }, [id, subjects]);

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    if (tasks.length > 0 && subject) {
      const filteredTasks = tasks.filter(task => task.subjectId === subject._id);
      setSubjectTasks(filteredTasks);
    }
  }, [tasks, subject]);

  const loadTasks = async () => {
    try {
      await fetchTasks();
    } catch (err) {
      console.error('Error loading tasks:', err);
      Alert.alert('Error', 'Failed to load tasks. Please try again.');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };

  const handleEditSubject = () => {
    router.push({
      pathname: '/edit-subject',
      params: { id: subject._id }
    });
  };

  const handleDeleteSubject = async () => {
    Alert.alert(
      "Delete Subject",
      `Are you sure you want to delete "${subject.name}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              await deleteSubject(subject._id);
              router.back();
            } catch (err) {
              console.error('Error deleting subject:', err);
              Alert.alert('Error', 'Failed to delete subject. Please try again.');
            }
          } 
        }
      ]
    );
  };

  const handleAddTask = () => {
    router.push({
      pathname: '/new-task',
      params: { subjectId: subject._id }
    });
  };

  if (subjectLoading || !subject) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: subject.name,
          headerLeft: () => (
            <View style={styles.headerButtons}>
              <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                <Ionicons name="arrow-back" size={22} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.replace('/')} style={styles.headerButton}>
                <Ionicons name="home" size={22} color="#007AFF" />
              </TouchableOpacity>
            </View>
          ),
          headerRight: () => (
            <View style={styles.headerButtons}>
              <TouchableOpacity onPress={handleEditSubject} style={styles.headerButton}>
                <Ionicons name="pencil" size={22} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDeleteSubject} style={styles.headerButton}>
                <Ionicons name="trash-outline" size={22} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <View style={[styles.subjectHeader, { backgroundColor: subject.color + '20' }]}>
        <View style={[styles.colorIndicator, { backgroundColor: subject.color }]} />
        <Text style={styles.subjectName}>{subject.name}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{subjectTasks.length}</Text>
          <Text style={styles.statLabel}>Tasks</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {subjectTasks.filter(task => task.completed).length}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {subjectTasks.filter(task => !task.completed && new Date(task.deadline) < new Date()).length}
          </Text>
          <Text style={styles.statLabel}>Overdue</Text>
        </View>
      </View>

      <View style={styles.tasksSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tasks</Text>
          <TouchableOpacity onPress={handleAddTask}>
            <Text style={styles.addTaskText}>Add Task</Text>
          </TouchableOpacity>
        </View>

        {tasksLoading && !refreshing ? (
          <ActivityIndicator style={styles.tasksLoading} size="large" color="#007AFF" />
        ) : subjectTasks.length === 0 ? (
          <View style={styles.emptyTasksContainer}>
            <Ionicons name="checkbox-outline" size={64} color="#8E8E93" />
            <Text style={styles.emptyTasksText}>No tasks for this subject</Text>
            <TouchableOpacity 
              style={styles.emptyTasksButton}
              onPress={handleAddTask}
            >
              <Text style={styles.emptyTasksButtonText}>Add Task</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlashList
            data={subjectTasks}
            renderItem={({ item }) => <TaskCard task={item} />}
            estimatedItemSize={100}
            contentContainerStyle={styles.tasksList}
            onRefresh={handleRefresh}
            refreshing={refreshing}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginHorizontal: 8,
    padding: 4,
  },
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginBottom: 16,
  },
  colorIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
  },
  subjectName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  statLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  tasksSection: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  addTaskText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  tasksList: {
    padding: 16,
    paddingTop: 0,
  },
  tasksLoading: {
    marginTop: 40,
  },
  emptyTasksContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTasksText: {
    fontSize: 18,
    color: '#8E8E93',
    marginTop: 16,
    marginBottom: 24,
  },
  emptyTasksButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyTasksButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 