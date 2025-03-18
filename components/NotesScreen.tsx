import React, { useEffect, useState } from "react";
import { View, FlatList, Text, ActivityIndicator, StyleSheet, TouchableOpacity, Modal, Alert } from "react-native";
import useNotesStore from "../store/notes";
import { useAuthStore } from "../store/auth";
import { NoteCard } from "./NoteCard"; // Make sure this path is correct
import { Ionicons } from "@expo/vector-icons";
import RichTextEditor from "./RichTextEditor"; // We'll create this component next
import { router } from "expo-router";

export function NotesScreen() {
  const { notes, fetchNotes, loading, error } = useNotesStore();
  const { user } = useAuthStore();
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    // Only fetch notes if the user is authenticated
    if (user) {
      fetchNotes();
    } else {
      // Redirect to login if not authenticated
      router.replace('/(auth)/login');
    }
  }, [user]);

  // Refresh notes when the component mounts and when the modal closes (potentially after a new note is created)
  useEffect(() => {
    if (user && !modalVisible) {
      fetchNotes();
    }
  }, [modalVisible]);

  const openNoteEditor = () => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please log in to create notes.');
      return;
    }
    
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => user && fetchNotes()}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Notes</Text>

      {notes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyMessage}>No notes available</Text>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={openNoteEditor}
          >
            <Text style={styles.createButtonText}>Create Your First Note</Text>
          </TouchableOpacity>
        </View>
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
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  emptyMessage: {
    fontSize: 16,
    color: "#777",
    textAlign: "center",
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    color: '#ff3b30',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
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

