import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNotesStore } from '../store/notes';
import { useTasksStore } from '../store/tasks';

interface LinkedNotesProps {
  taskId: string;
  noteIds: string[];
}

export function LinkedNotes({ taskId, noteIds }: LinkedNotesProps) {
  const { notes } = useNotesStore();
  const { unlinkNoteFromTask } = useTasksStore();
  
  const linkedNotes = notes.filter(note => noteIds?.includes(note._id));

  const handleUnlink = async (noteId: string) => {
    await unlinkNoteFromTask(taskId, noteId);
  };

  if (!linkedNotes.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No linked notes</Text>
        <Link href="/new-note" asChild>
          <Pressable style={styles.addButton}>
            <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
            <Text style={styles.addButtonText}>Add Note</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Linked Notes</Text>
      {linkedNotes.map((note) => (
        <View key={note._id} style={styles.noteCard}>
          <Link href={`/note/${note._id}`} asChild>
            <Pressable style={styles.noteContent}>
              <View>
                <Text style={styles.noteTitle} numberOfLines={1}>
                  {note.title}
                </Text>
                <Text style={styles.notePreview} numberOfLines={2}>
                  {note.content}
                </Text>
              </View>
            </Pressable>
          </Link>
          <Pressable
            style={styles.unlinkButton}
            onPress={() => handleUnlink(note._id)}
          >
            <Ionicons name="close-circle" size={20} color="#FF3B30" />
          </Pressable>
        </View>
      ))}
      <Link href="/new-note" asChild>
        <Pressable style={styles.addButton}>
          <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
          <Text style={styles.addButtonText}>Add Note</Text>
        </Pressable>
      </Link>
    </View>
  );
}

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
  noteCard: {
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
  noteContent: {
    flex: 1,
    padding: 12,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    color: '#1C1C1E',
  },
  notePreview: {
    fontSize: 12,
    color: '#8E8E93',
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