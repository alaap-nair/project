import { View, Text, StyleSheet, Platform } from 'react-native';
import { useNotesStore } from '../../store/notes';
import { format, isValid } from 'date-fns';

export default function CalendarScreen() {
  const notes = useNotesStore((state) => state.notes);
  
  // Group notes by date with validation
  const notesByDate = notes.reduce((acc, note) => {
    try {
      const noteDate = new Date(note.createdAt);
      if (!isValid(noteDate)) {
        console.warn('Invalid date found:', note.createdAt);
        return acc;
      }
      const date = format(noteDate, 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(note);
    } catch (error) {
      console.warn('Error processing note date:', error);
    }
    return acc;
  }, {} as Record<string, typeof notes>);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (!isValid(date)) return 'Invalid date';
      return format(date, 'EEEE, MMMM d, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (!isValid(date)) return '--:--';
      return format(date, 'h:mm a');
    } catch {
      return '--:--';
    }
  };

  return (
    <View style={styles.container}>
      {Object.entries(notesByDate).map(([date, dateNotes]) => (
        <View key={date} style={styles.dateGroup}>
          <Text style={styles.dateHeader}>
            {formatDate(date)}
          </Text>
          {dateNotes.map((note) => (
            <View key={note._id} style={styles.noteItem}>
              <Text style={styles.noteTime}>
                {formatTime(note.createdAt)}
              </Text>
              <Text style={styles.noteTitle}>{note.title}</Text>
            </View>
          ))}
        </View>
      ))}
      {Object.keys(notesByDate).length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No notes yet</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    padding: 16,
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#007AFF',
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
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
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  noteTime: {
    fontSize: 14,
    color: '#8E8E93',
    marginRight: 12,
    minWidth: 70,
  },
  noteTitle: {
    fontSize: 16,
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#8E8E93',
  },
});