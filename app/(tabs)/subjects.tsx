import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator, Platform, Alert } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useSubjectsStore } from '../../store/subjects';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Swipeable } from 'react-native-gesture-handler';

function SubjectCard({ subject, onDelete }) {
  const renderRightActions = () => {
    return (
      <TouchableOpacity 
        style={styles.deleteAction}
        onPress={() => {
          Alert.alert(
            "Delete Subject",
            `Are you sure you want to delete "${subject.name}"?`,
            [
              { text: "Cancel", style: "cancel" },
              { text: "Delete", style: "destructive", onPress: () => onDelete(subject._id) }
            ]
          );
        }}
      >
        <Ionicons name="trash-outline" size={24} color="#fff" />
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable renderRightActions={renderRightActions}>
      <TouchableOpacity 
        style={[styles.subjectCard, { backgroundColor: subject.color + '20' }]}
        onPress={() => router.push(`/subject/${subject._id}`)}
      >
        <View style={[styles.colorDot, { backgroundColor: subject.color }]} />
        <Text style={styles.subjectName}>{subject.name}</Text>
        <View style={styles.cardActions}>
          <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
}

export default function SubjectsScreen() {
  const { subjects, fetchSubjects, deleteSubject, loading, error } = useSubjectsStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      await fetchSubjects();
    } catch (err) {
      console.error('Error loading subjects:', err);
      Alert.alert('Error', 'Failed to load subjects. Please try again.');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSubjects();
    setRefreshing(false);
  };

  const handleDeleteSubject = async (id) => {
    try {
      await deleteSubject(id);
    } catch (err) {
      console.error('Error deleting subject:', err);
      Alert.alert('Error', 'Failed to delete subject. Please try again.');
    }
  };

  const handleAddSubject = () => {
    router.push('/add-subject');
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Subjects</Text>
      </View>
      
      {subjects.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="book-outline" size={64} color="#8E8E93" />
          <Text style={styles.emptyText}>No subjects yet</Text>
          <Text style={styles.emptySubtext}>Add subjects to organize your notes and tasks</Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={handleAddSubject}
          >
            <Text style={styles.emptyButtonText}>Add Subject</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlashList
          data={subjects}
          renderItem={({ item }) => (
            <SubjectCard 
              subject={item} 
              onDelete={handleDeleteSubject}
            />
          )}
          estimatedItemSize={80}
          contentContainerStyle={styles.list}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />
      )}
      
      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddSubject}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
  },
  list: {
    padding: 16,
  },
  subjectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
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
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  subjectName: {
    fontSize: 17,
    fontWeight: '500',
    color: '#000',
    flex: 1,
  },
  cardActions: {
    marginLeft: 'auto',
  },
  deleteAction: {
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
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
    }),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});