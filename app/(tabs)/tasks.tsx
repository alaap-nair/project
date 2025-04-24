import React, { useEffect, useState } from "react";
import { View, FlatList, Text, ActivityIndicator, StyleSheet, TouchableOpacity, Modal, Alert, ScrollView } from "react-native";
import useNotesStore from "../../store/notes";
import { useAuthStore } from "../../store/auth";
import { NoteCard } from "../../components/NoteCard";
import { Ionicons } from "@expo/vector-icons";
import RichTextEditor from "../../components/RichTextEditor";
import { router } from "expo-router";

export default function NotesScreen() {
  const { notes, fetchNotes, loading, error, showCreateModal, setShowCreateModal, modalVisible, openNoteEditor, closeNoteEditor } = useNotesStore();
  const { user, isLoading: authLoading, isAuthReady } = useAuthStore();
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

  // Handle showCreateModal changes
  useEffect(() => {
    if (showCreateModal && !modalVisible) {
      openNoteEditor();
    }
  }, [showCreateModal]);

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

  const handleLocalOpenNoteEditor = () => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please log in to create notes.');
      return;
    }
    
    openNoteEditor();
  };

  const handleCloseModal = () => {
    closeNoteEditor();
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
            onPress={handleLocalOpenNoteEditor}
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
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#FF3B30',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 