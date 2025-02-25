import { View, Text, StyleSheet, Platform } from 'react-native';
import { useNotesStore } from '../../store/notes';
import { format } from 'date-fns';

export default function CalendarScreen() {
  const notes = useNotesStore((state) => state.notes);
  
  // Group notes by date
  const notesByDate = notes.reduce((acc, note) => {
    const date = format(new Date(note.createdAt), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(note);
    return acc;
  }, {} as Record<string, typeof notes>);

  return (
    <View style={styles.container}>
      {Object.entries(notesByDate).map(([date, dateNotes]) => (
        <View key={date} style={styles.dateGroup}>
          <Text style={styles.dateHeader}>
            {format(new Date(date), 'EEEE, MMMM d, yyyy')}
          </Text>
          {dateNotes.map((note) => (
            <View key={note.id} style={styles.noteItem}>
              <Text style={styles.noteTime}>
                {format(new Date(note.createdAt), 'h:mm a')}
              </Text>
              <Text style={styles.noteTitle}>{note.title}</Text>
            </View>
          ))}
        </View>
      ))}
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
});