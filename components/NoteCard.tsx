import { View, Text, Pressable, StyleSheet, Platform, Alert } from 'react-native';
import { format } from 'date-fns';
import { Link } from 'expo-router';
import type { Note } from '../store/notes';
import { useSubjectsStore } from '../store/subjects';
import useNotesStore from '../store/notes';
import { useAuthStore } from '../store/auth';
import { NoteSummary } from './NoteSummary';
import { TranscriptionManager } from './TranscriptionManager';
import { AudioPlayer } from './AudioPlayer';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';

interface NoteCardProps {
  note: Note;
}

export function NoteCard({ note }: NoteCardProps) {
  const subjects = useSubjectsStore((state) => state.subjects);
  const { deleteNote } = useNotesStore();
  const { user } = useAuthStore();
  const subject = subjects.find((s) => s._id === note.subjectId);
  const [showTranscription, setShowTranscription] = useState(false);

  // Check if user has permission to interact with this note
  const hasPermission = user && note.userId === user.uid;

  const handleTranscriptionComplete = (transcript: string) => {
    // This is now handled directly in the TranscriptionManager component
    console.log('Transcription complete:', transcript);
  };

  const handleDeleteNote = (e) => {
    e.stopPropagation();
    
    if (!hasPermission) {
      Alert.alert("Permission Denied", "You don't have permission to delete this note.");
      return;
    }
    
    Alert.alert(
      "Delete Note",
      `Are you sure you want to delete "${note.title}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              await deleteNote(note._id);
            } catch (err) {
              console.error('Error deleting note:', err);
              Alert.alert('Error', 'Failed to delete note. Please try again.');
            }
          } 
        }
      ]
    );
  };

  return (
    <Link href={`/note/${note._id}`} asChild>
      <Pressable style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {note.title}
          </Text>
          <View style={styles.headerActions}>
            <Text style={styles.date}>
              {note.updatedAt ? format(new Date(note.updatedAt), 'MMM d, yyyy') : "No Date"}
            </Text>
            {hasPermission && (
              <Pressable 
                style={styles.deleteButton}
                onPress={handleDeleteNote}
              >
                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              </Pressable>
            )}
          </View>
        </View>
        {subject && (
          <View style={[styles.subjectTag, { backgroundColor: subject.color + '20' }]}>
            <Text style={[styles.subjectText, { color: subject.color }]}>
              {subject.name}
            </Text>
          </View>
        )}
        
        {/* Audio section */}
        {note.audioUrl ? (
          <View style={styles.audioSection}>
            <View style={styles.audioHeader}>
              <Ionicons name="musical-note" size={16} color="#007AFF" />
              <Text style={styles.audioTitle}>Audio Recording</Text>
            </View>
            <AudioPlayer audioUri={note.audioUrl} />
          </View>
        ) : null}
        
        {/* Transcript section */}
        {note.transcript ? (
          <View style={styles.transcriptContainer}>
            <Text style={styles.transcriptTitle}>Transcript</Text>
            <Text style={styles.transcriptText} numberOfLines={3}>
              {note.transcript}
            </Text>
          </View>
        ) : (
          hasPermission && (
            <TranscriptionManager 
              onTranscriptionComplete={handleTranscriptionComplete}
              existingAudioUri={note.audioUrl}
              noteId={note._id}
            />
          )
        )}
        <NoteSummary note={note} />
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  date: {
    fontSize: 14,
    color: '#8E8E93',
    marginRight: 8,
  },
  deleteButton: {
    padding: 4,
  },
  subjectTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  subjectText: {
    fontSize: 12,
    fontWeight: '500',
  },
  audioSection: {
    marginVertical: 8,
  },
  audioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  audioTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginLeft: 4,
  },
  transcriptContainer: {
    marginVertical: 8,
    padding: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  transcriptTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  transcriptText: {
    fontSize: 14,
    color: '#3C3C43',
    lineHeight: 20,
  },
});