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
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  // Handle authentication check
  useEffect(() => {
    const checkAuth = async () => {
      if (!user) {
        router.replace('/auth/login');
      }
      setIsAuthChecked(true);
    };
    checkAuth();
  }, [user]);

  // Fetch notes only after auth check and when user is present
  useEffect(() => {
    let isMounted = true;

    const loadNotes = async () => {
      if (isAuthChecked && user && isMounted) {
        await fetchNotes();
      }
    };

    loadNotes();

    return () => {
      isMounted = false;
    };
  }, [isAuthChecked, user, modalVisible]);

  // Don't render anything until auth check is complete
  if (!isAuthChecked) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // If no user is found after auth check, don't render the screen
  if (!user) {
    return null;
  }

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
    backgroundColor: '#fff',
    paddingTop: 60,
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
    paddingLeft: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: -40,
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
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'center',
    minWidth: 200,
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
  }
});

