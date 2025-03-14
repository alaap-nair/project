import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator, Platform } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useSubjectsStore } from '../../store/subjects';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';

function SubjectCard({ subject }) {
  return (
    <View style={[styles.subjectCard, { backgroundColor: subject.color + '20' }]}>
      <View style={[styles.colorDot, { backgroundColor: subject.color }]} />
      <Text style={styles.subjectName}>{subject.name}</Text>
    </View>
  );
}

export default function SubjectsScreen() {
  const { subjects, fetchSubjects } = useSubjectsStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSubjects = async () => {
      await fetchSubjects();
      setLoading(false);
    };
    loadSubjects();
  }, []);

  const handleAddSubject = () => {
    router.push('/add-subject');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlashList
        data={subjects}
        renderItem={({ item }) => <SubjectCard subject={item} />}
        estimatedItemSize={80}
        contentContainerStyle={styles.list}
      />
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
});