import React, { useEffect, useState } from "react";
import { View, FlatList, Text, ActivityIndicator, StyleSheet, TouchableOpacity, Modal, Alert, ScrollView } from "react-native";
import useNotesStore from "../store/notes";
import { useAuthStore } from "../store/auth";
import { NoteCard } from "./NoteCard"; // Make sure this path is correct
import { Ionicons } from "@expo/vector-icons";
import RichTextEditor from "./RichTextEditor"; // We'll create this component next
import { router } from "expo-router";

export function NotesScreen() {
  const { notes, fetchNotes, loading, error } = useNotesStore();
  const { user, isLoading: authLoading, isAuthReady } = useAuthStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [summary, setSummary] = useState('');
  const [summarizing, setSummarizing] = useState(false);
  const [summaryModalVisible, setSummaryModalVisible] = useState(false);

  // Fetch notes when user is authenticated
  useEffect(() => {
    let isMounted = true;

    const loadNotes = async () => {
      if (user && isMounted) {
        await fetchNotes();
      }
    };

    loadNotes();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Only redirect to login if not in a modal and no user
  useEffect(() => {
    if (isAuthReady && !user && !modalVisible && !summaryModalVisible) {
      router.replace('/auth/login');
    }
  }, [isAuthReady, user, modalVisible, summaryModalVisible]);

  // Don't render anything until auth check is complete
  if (authLoading || !isAuthReady) {
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

  const handleNotePress = (note) => {
    setSelectedNote(note);
    setSummary('');
    setSummaryModalVisible(true);
  };

  const handleCloseSummaryModal = () => {
    setSummaryModalVisible(false);
    setSelectedNote(null);
    setSummary('');
  };

  const handleSummarize = async () => {
    if (!selectedNote) return;
    setSummarizing(true);
    setSummary('');
    try {
      const response = await fetch('http://localhost:3001/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: selectedNote.content }),
      });
      const data = await response.json();
      if (data.summary) {
        setSummary(data.summary);
      } else {
        setSummary('Failed to generate summary.');
      }
    } catch (err) {
      setSummary('Error connecting to summarization service.');
    }
    setSummarizing(false);
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
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleNotePress(item)}>
              <NoteCard note={item} />
            </TouchableOpacity>
          )}
        />
      )}

      {/* Note Detail & Summarization Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={summaryModalVisible}
        onRequestClose={handleCloseSummaryModal}
      >
        <View style={[styles.centeredContainer, { backgroundColor: 'rgba(0,0,0,0.2)' }]}> 
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '90%', maxHeight: '80%' }}>
            <ScrollView>
              <Text style={{ fontWeight: 'bold', fontSize: 20, marginBottom: 8 }}>Note</Text>
              <Text style={{ marginBottom: 16 }}>{selectedNote?.content}</Text>
              <TouchableOpacity
                style={[styles.createButton, { marginBottom: 16, backgroundColor: '#6949FF' }]}
                onPress={handleSummarize}
                disabled={summarizing}
              >
                <Text style={styles.createButtonText}>{summarizing ? 'Summarizing...' : 'Summarize with AI'}</Text>
              </TouchableOpacity>
              {summary ? (
                <View style={{ backgroundColor: '#F3F3F3', borderRadius: 8, padding: 12 }}>
                  <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Summary:</Text>
                  <Text>{summary}</Text>
                </View>
              ) : null}
              <TouchableOpacity onPress={handleCloseSummaryModal} style={{ marginTop: 20, alignSelf: 'center' }}>
                <Text style={{ color: '#007AFF', fontWeight: 'bold' }}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

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

