import { View, Text, StyleSheet, Pressable, Platform, Modal } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useNotesStore from '../store/notes';
import { useTasksStore } from '../store/tasks';
import { useAuthStore } from '../store/auth';
import { useState } from 'react';
import { RichTextEditor } from './RichTextEditor';

interface LinkedNotesProps {
  taskId: string;
  noteIds: string[];
}

export function LinkedNotes({ taskId, noteIds }: LinkedNotesProps) {
  const { notes } = useNotesStore();
  const { unlinkNoteFromTask } = useTasksStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const [showNoteModal, setShowNoteModal] = useState(false);
  
  const linkedNotes = notes.filter(note => noteIds?.includes(note._id));

  const handleUnlink = async (noteId: string) => {
    // Check if user has permission to unlink note
    const noteToUnlink = notes.find(note => note._id === noteId);
    if (!noteToUnlink || (noteToUnlink.userId && noteToUnlink.userId !== user?.uid)) {
      alert("You don't have permission to unlink this note");
      return;
    }
    
    await unlinkNoteFromTask(taskId, noteId);
  };

  const handleAddNote = () => {
    // Check if user is logged in
    if (!user) {
      router.push("/auth/login");
      return null;
    }
    
    setShowNoteModal(true);
  };

  if (!linkedNotes.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No linked notes</Text>
        <Pressable style={styles.addButton} onPress={handleAddNote}>
          <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
          <Text style={styles.addButtonText}>Add Note</Text>
        </Pressable>
        
        {showNoteModal && (
          <Modal
            animationType="slide"
            transparent={false}
            visible={showNoteModal}
            onRequestClose={() => setShowNoteModal(false)}
          >
            <View style={styles.modalContainer}>
              <RichTextEditor
                onClose={() => setShowNoteModal(false)}
                linkToTaskId={taskId}
              />
            </View>
          </Modal>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Linked Notes</Text>
      {linkedNotes.map((note) => {
        // Check if user has permission to view this note
        const hasPermission = !note.userId || note.userId === user?.uid;
        
        return (
          <View key={note._id} style={styles.noteCard}>
            <Link href={hasPermission ? `/note/${note._id}` : ""} asChild>
              <Pressable 
                style={styles.noteContent}
                onPress={() => {
                  if (!hasPermission) {
                    alert("You don't have permission to view this note");
                  }
                }}
              >
                <View>
                  <Text style={styles.noteTitle} numberOfLines={1}>
                    {note.title}
                  </Text>
                  <Text style={styles.notePreview} numberOfLines={2}>
                    {note.content}
                  </Text>
                  {!hasPermission && (
                    <Text style={styles.permissionText}>
                      <Ionicons name="lock-closed" size={12} color="#FF9500" /> Private note
                    </Text>
                  )}
                </View>
              </Pressable>
            </Link>
            {hasPermission && (
              <Pressable
                style={styles.unlinkButton}
                onPress={() => handleUnlink(note._id)}
              >
                <Ionicons name="close-circle" size={20} color="#FF3B30" />
              </Pressable>
            )}
          </View>
        );
      })}
      <Pressable style={styles.addButton} onPress={handleAddNote}>
        <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
        <Text style={styles.addButtonText}>Add Note</Text>
      </Pressable>
      
      {showNoteModal && (
        <Modal
          animationType="slide"
          transparent={false}
          visible={showNoteModal}
          onRequestClose={() => setShowNoteModal(false)}
        >
          <View style={styles.modalContainer}>
            <RichTextEditor
              onClose={() => setShowNoteModal(false)}
              linkToTaskId={taskId}
            />
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1C1C1E',
  },
  noteCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  noteContent: {
    flex: 1,
    padding: 12,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    color: '#1C1C1E',
  },
  notePreview: {
    fontSize: 12,
    color: '#8E8E93',
  },
  permissionText: {
    fontSize: 11,
    color: '#FF9500',
    marginTop: 4,
  },
  unlinkButton: {
    padding: 12,
  },
  emptyContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  addButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
}); 