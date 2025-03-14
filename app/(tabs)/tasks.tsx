import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useTasksStore, TaskPriority, TaskCategory } from '../../store/tasks';
import { TaskCard } from '../../components/TaskCard';

type Filter = {
  priority?: TaskPriority;
  category?: TaskCategory;
  completed?: boolean;
};

type SortBy = 'dueDate' | 'priority' | 'category';

export default function TasksScreen() {
  const { tasks, fetchTasks, toggleTaskCompletion } = useTasksStore();
  const [filter, setFilter] = useState<Filter>({});
  const [sortBy, setSortBy] = useState<SortBy>('dueDate');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTasks = async () => {
      await fetchTasks();
      setLoading(false);
    };
    loadTasks();
  }, []);

  const filteredTasks = tasks.filter((task) => {
    if (filter.priority && task.priority !== filter.priority) return false;
    if (filter.category && task.category !== filter.category) return false;
    if (filter.completed !== undefined && task.completed !== filter.completed) return false;
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    switch (sortBy) {
      case 'dueDate':
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      case 'priority': {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      case 'category':
        return a.category.localeCompare(b.category);
      default:
        return 0;
    }
  });

  const FilterButton = ({ label, isActive, onPress }) => (
    <Pressable
      style={[styles.filterButton, isActive && styles.filterButtonActive]}
      onPress={onPress}
    >
      <Text style={[styles.filterButtonText, isActive && styles.filterButtonTextActive]}>
        {label}
      </Text>
    </Pressable>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <FilterButton
            label="All"
            isActive={Object.keys(filter).length === 0}
            onPress={() => setFilter({})}
          />
          <FilterButton
            label="Active"
            isActive={filter.completed === false}
            onPress={() => setFilter({ ...filter, completed: false })}
          />
          <FilterButton
            label="Completed"
            isActive={filter.completed === true}
            onPress={() => setFilter({ ...filter, completed: true })}
          />
          <View style={styles.divider} />
          <FilterButton
            label="High Priority"
            isActive={filter.priority === 'high'}
            onPress={() => setFilter({ ...filter, priority: 'high' })}
          />
          <FilterButton
            label="Medium Priority"
            isActive={filter.priority === 'medium'}
            onPress={() => setFilter({ ...filter, priority: 'medium' })}
          />
          <FilterButton
            label="Low Priority"
            isActive={filter.priority === 'low'}
            onPress={() => setFilter({ ...filter, priority: 'low' })}
          />
        </ScrollView>
      </View>

      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <Pressable
          style={[styles.sortButton, sortBy === 'dueDate' && styles.sortButtonActive]}
          onPress={() => setSortBy('dueDate')}
        >
          <Text style={styles.sortButtonText}>Due Date</Text>
        </Pressable>
        <Pressable
          style={[styles.sortButton, sortBy === 'priority' && styles.sortButtonActive]}
          onPress={() => setSortBy('priority')}
        >
          <Text style={styles.sortButtonText}>Priority</Text>
        </Pressable>
        <Pressable
          style={[styles.sortButton, sortBy === 'category' && styles.sortButtonActive]}
          onPress={() => setSortBy('category')}
        >
          <Text style={styles.sortButtonText}>Category</Text>
        </Pressable>
      </View>

      <FlashList
        data={sortedTasks}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onToggleComplete={toggleTaskCompletion}
          />
        )}
        estimatedItemSize={120}
        contentContainerStyle={styles.list}
      />

      <Link href="/new-task" asChild>
        <Pressable style={styles.fab}>
          <Ionicons name="add" size={24} color="#fff" />
        </Pressable>
      </Link>
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
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#fff',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#F2F2F7',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#3C3C43',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: '#E5E5EA',
    marginHorizontal: 8,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  sortLabel: {
    fontSize: 14,
    color: '#3C3C43',
    marginRight: 12,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#F2F2F7',
  },
  sortButtonActive: {
    backgroundColor: '#007AFF',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#3C3C43',
  },
  list: {
    padding: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
        cursor: 'pointer',
      },
    }),
  },
}); 