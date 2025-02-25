import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSubjectsStore } from '../../store/subjects';
import { useNotesStore } from '../../store/notes';

export default function SubjectsScreen() {
  const subjects = useSubjectsStore((state) => state.subjects);
  const notes = useNotesStore((state) => state.notes);

  return (
    <View style={styles.container}>
      <FlashList
        data={subjects}
        renderItem={({ item }) => (
          <Link href={`/subject/${item.id}`} asChild>
            <Pressable style={styles.subjectCard}>
              <View style={[styles.colorDot, { backgroundColor: item.color }]} />
              <View style={styles.subjectInfo}>
                <Text style={styles.subjectName}>{item.name}</Text>
                <Text style={styles.noteCount}>
                  {notes.filter((note) => note.subjectId === item.id).length} notes
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </Pressable>
          </Link>
        )}
        estimatedItemSize={72}
        contentContainerStyle={styles.list}
      />
      <Link href="/new-subject" asChild>
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
  list: {
    padding: 16,
  },
  subjectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
        cursor: 'pointer',
      },
    }),
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  noteCount: {
    fontSize: 14,
    color: '#8E8E93',
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