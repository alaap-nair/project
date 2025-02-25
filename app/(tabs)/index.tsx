import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNotesStore } from '../../store/notes';
import { NoteCard } from '../../components/NoteCard';

export default function NotesScreen() {
  const notes = useNotesStore((state) => state.notes);

  return (
    <View style={styles.container}>
      <FlashList
        data={notes}
        renderItem={({ item }) => <NoteCard note={item} />}
        estimatedItemSize={120}
        contentContainerStyle={styles.list}
      />
      <Link href="/new-note" asChild>
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