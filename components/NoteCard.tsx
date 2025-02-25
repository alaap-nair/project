import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { format } from 'date-fns';
import { Link } from 'expo-router';
import type { Note } from '../store/notes';
import { useSubjectsStore } from '../store/subjects';

interface NoteCardProps {
  note: Note;
}

export function NoteCard({ note }: NoteCardProps) {
  const subjects = useSubjectsStore((state) => state.subjects);
  const subject = subjects.find((s) => s.id === note.subjectId);

  return (
    <Link href={`/note/${note.id}`} asChild>
      <Pressable style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {note.title}
          </Text>
          <Text style={styles.date}>
            {format(new Date(note.updatedAt), 'MMM d, yyyy')}
          </Text>
        </View>
        {subject && (
          <View style={[styles.subjectTag, { backgroundColor: subject.color + '20' }]}>
            <Text style={[styles.subjectText, { color: subject.color }]}>
              {subject.name}
            </Text>
          </View>
        )}
        <Text style={styles.preview} numberOfLines={2}>
          {note.content}
        </Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  date: {
    fontSize: 14,
    color: '#8E8E93',
  },
  subjectTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  subjectText: {
    fontSize: 12,
    fontWeight: '500',
  },
  preview: {
    fontSize: 14,
    color: '#3C3C43',
    lineHeight: 20,
  },
});