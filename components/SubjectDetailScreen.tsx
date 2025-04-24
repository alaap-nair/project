import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SubjectTheme {
  name: string;
  primaryColor: string;
  secondaryColor: string;
}

const SUBJECT_THEMES: { [key: string]: SubjectTheme } = {
  Biology: {
    name: 'Biology',
    primaryColor: '#4CAF50',
    secondaryColor: '#E0FFE0',
  },
  Chemistry: {
    name: 'Chemistry',
    primaryColor: '#9C27B0',
    secondaryColor: '#F3E5F5',
  },
  Physics: {
    name: 'Physics',
    primaryColor: '#2196F3',
    secondaryColor: '#E3F2FD',
  },
  Mathematics: {
    name: 'Mathematics',
    primaryColor: '#F44336',
    secondaryColor: '#FFEBEE',
  },
  History: {
    name: 'History',
    primaryColor: '#795548',
    secondaryColor: '#EFEBE9',
  },
  Literature: {
    name: 'Literature',
    primaryColor: '#FF9800',
    secondaryColor: '#FFF3E0',
  },
};

interface StatCircleProps {
  number: number;
  label: string;
  color: string;
}

const StatCircle: React.FC<StatCircleProps> = ({ number, label, color }) => (
  <View style={[styles.statCircle, { backgroundColor: color }]}>
    <Text style={styles.statNumber}>{number}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

interface TaskTagProps {
  label: string;
  color: string;
}

const TaskTag: React.FC<TaskTagProps> = ({ label, color }) => (
  <View style={[styles.tag, { backgroundColor: color }]}>
    <Text style={styles.tagText}>{label}</Text>
  </View>
);

interface SubjectDetailScreenProps {
  subjectName: string;
}

export default function SubjectDetailScreen({ subjectName }: SubjectDetailScreenProps) {
  const router = useRouter();
  const theme = SUBJECT_THEMES[subjectName] || SUBJECT_THEMES.Biology;
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={{ height: insets.top, backgroundColor: '#f5f5f5' }} />
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>{theme.name}</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
      >
        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statsContainer}>
            <StatCircle number={0} label="Tasks" color={theme.secondaryColor} />
            <StatCircle number={0} label="Completed" color={theme.secondaryColor} />
            <StatCircle number={0} label="Overdue" color={theme.secondaryColor} />
          </View>
        </View>

        {/* Tasks Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tasks</Text>
            <TouchableOpacity>
              <Text style={[styles.addButton, { color: '#007AFF' }]}>Add Task</Text>
            </TouchableOpacity>
          </View>

          {/* Empty State */}
          <View style={styles.emptyState}>
            <View style={styles.emptyStateIcon}>
              <Ionicons name="checkbox-outline" size={48} color="#ccc" />
            </View>
            <Text style={styles.emptyStateText}>No tasks for this subject</Text>
            <TouchableOpacity style={styles.addTaskButton}>
              <Text style={styles.addTaskButtonText}>Add Task</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Delete Subject Button */}
        <TouchableOpacity style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={20} color="#fff" style={styles.deleteIcon} />
          <Text style={styles.deleteButtonText}>Delete Subject</Text>
        </TouchableOpacity>

        {/* Home Button */}
        <TouchableOpacity 
          style={styles.homeButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
          <Text style={styles.homeButtonText}>Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    height: 60,
  },
  backButton: {
    padding: 8,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  searchButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateIcon: {
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  addTaskButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  addTaskButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  deleteIcon: {
    marginRight: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  homeButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 25,
    marginBottom: 16,
  },
  homeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 