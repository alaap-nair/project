import React, { useEffect } from "react";
import { View, FlatList, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useNotesStore } from "../store/notes";
import { NoteCard } from "./NoteCard"; // Make sure this path is correct

export function NotesScreen() {
  const { notes, fetchNotes } = useNotesStore();

  useEffect(() => {
    fetchNotes(); // Fetch notes when the screen loads
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Notes</Text>

      {notes.length === 0 ? (
        <Text style={styles.emptyMessage}>No notes available</Text>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => item._id} // Use MongoDB's _id
          renderItem={({ item }) => <NoteCard note={item} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#F8F8F8",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  emptyMessage: {
    fontSize: 16,
    color: "#777",
    textAlign: "center",
    marginTop: 20,
  },
});

