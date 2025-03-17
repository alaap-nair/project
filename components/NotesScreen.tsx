import React, { useEffect, useState } from "react";
import { View, FlatList, Text, ActivityIndicator, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { useNotesStore } from "../store/notes";
import { NoteCard } from "./NoteCard"; // Make sure this path is correct
import { Ionicons } from "@expo/vector-icons";
import RichTextEditor from "./RichTextEditor"; // We'll create this component next

export function NotesScreen() {
  const { notes, fetchNotes } = useNotesStore();
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchNotes(); // Fetch notes when the screen loads
  }, []);

  const openNoteEditor = () => {
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

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

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={openNoteEditor}>
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Note Creation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <RichTextEditor onClose={handleCloseModal} />
      </Modal>
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
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    right: 20,
    bottom: 20,
    backgroundColor: '#007AFF',
    borderRadius: 28,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
  },
});

