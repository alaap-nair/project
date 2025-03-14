import { View, StyleSheet, Pressable, Platform, ActivityIndicator, Text } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useNotesStore } from "../../store/notes";
import { NoteCard } from "../../components/NoteCard";
import { useEffect, useState } from "react";
import { TouchableOpacity } from "react-native";
import { router } from 'expo-router';

export default function NotesScreen() {
  const { notes, fetchNotes } = useNotesStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNotes = async () => {
      await fetchNotes();
      setLoading(false);
    };
    loadNotes();
  }, []);

  const handleAddNote = () => {
    router.push('/create');
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
      {notes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No notes yet</Text>
          <TouchableOpacity style={styles.emptyButton} onPress={handleAddNote}>
            <Text style={styles.emptyButtonText}>Create your first note</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlashList
          data={notes}
          renderItem={({ item }) => <NoteCard note={item} />}
          estimatedItemSize={120}
          contentContainerStyle={styles.list}
        />
      )}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddNote}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  list: {
    padding: 16,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.25)",
        cursor: "pointer",
      },
    }),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: "#8E8E93",
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
