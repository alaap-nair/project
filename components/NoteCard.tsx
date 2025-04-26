import { View, Text, Pressable, StyleSheet, Platform, Alert, ScrollView, TouchableOpacity, GestureResponderEvent } from 'react-native';
import { format } from 'date-fns';
import { Link, Href } from 'expo-router';
import type { Note, AudioRecording } from '../store/notes';
import { useSubjectsStore } from '../store/subjects';
import useNotesStore from '../store/notes';
import { useAuthStore } from '../store/auth';
import { NoteSummary } from './NoteSummary';
import { TranscriptionManager } from './TranscriptionManager';
import { AudioPlayer } from './AudioPlayer';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

interface NoteCardProps {
  note: Note;
}

interface AudioRecordingItemProps {
  recording: AudioRecording;
  noteId: string;
  onTranscriptionComplete: (transcript: string) => void;
}

function AudioRecordingItem({ recording, noteId, onTranscriptionComplete }: AudioRecordingItemProps) {
  const { addTranscriptToNote } = useNotesStore();
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleTranscribe = async () => {
    if (isTranscribing) return;

    try {
      setIsTranscribing(true);
      setError(null);
      
      // Create FormData for the audio file
      const formData = new FormData();
      // @ts-ignore - React Native's FormData accepts additional properties
      formData.append('audio', {
        uri: recording.url,
        type: 'audio/wav',
        name: 'recording.wav'
      });

      // Send the audio file to your transcription endpoint
      const response = await fetch('http://localhost:3000/api/transcribe', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to transcribe audio');
      }

      const result = await response.json();
      
      if (result.text) {
        await addTranscriptToNote(noteId, result.text);
        onTranscriptionComplete(result.text);
      }
    } catch (err) {
      console.error('Transcription error:', err);
      setError('Failed to transcribe audio. Please try again.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const getPreviewText = (text: string) => {
    const words = text.split(' ');
    if (words.length <= 10) return text;
    return words.slice(0, 10).join(' ') + '...';
  };

  return (
    <View style={styles.recordingItem}>
      <AudioPlayer audioUri={recording.url} />
      <View style={styles.recordingActions}>
        <TouchableOpacity 
          style={[styles.transcribeButton, isTranscribing && styles.transcribeButtonDisabled]}
          onPress={handleTranscribe}
          disabled={isTranscribing}
        >
          <Ionicons 
            name="document-text" 
            size={20} 
            color={isTranscribing ? '#C7C7CC' : '#007AFF'} 
          />
          <Text style={[styles.transcribeText, isTranscribing && styles.transcribeTextDisabled]}>
            {isTranscribing ? 'Transcribing...' : 'Transcribe'}
          </Text>
        </TouchableOpacity>
      </View>
      {recording.transcript && (
        <TouchableOpacity 
          style={styles.transcriptContainer}
          onPress={() => setIsExpanded(!isExpanded)}
        >
          <View style={styles.transcriptHeader}>
            <Text style={styles.transcriptTitle}>Transcript</Text>
            <Ionicons 
              name={isExpanded ? 'chevron-up' : 'chevron-down'} 
              size={16} 
              color="#8E8E93" 
            />
          </View>
          <Text 
            style={styles.transcriptText} 
            numberOfLines={isExpanded ? undefined : 2}
          >
            {isExpanded ? recording.transcript : getPreviewText(recording.transcript)}
          </Text>
        </TouchableOpacity>
      )}
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
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
    console.log('Transcription complete:', transcript);
  };

  const handleDeleteNote = (e: GestureResponderEvent) => {
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
    <Link href={`/note/${note._id}` as unknown as Href} asChild>
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
        
        {/* Audio recordings section */}
        {note.audioRecordings && note.audioRecordings.length > 0 && (
          <View style={styles.audioSection}>
            <View style={styles.audioHeader}>
              <Ionicons name="musical-notes" size={16} color="#007AFF" />
              <Text style={styles.audioTitle}>Audio Recordings ({note.audioRecordings.length})</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recordingsScroll}>
              {note.audioRecordings.map((recording, index) => (
                <AudioRecordingItem
                  key={index}
                  recording={recording}
                  noteId={note._id}
                  onTranscriptionComplete={handleTranscriptionComplete}
                />
              ))}
            </ScrollView>
          </View>
        )}
        
        {/* Show TranscriptionManager when user has permission */}
        {hasPermission && (
          <TranscriptionManager 
            onTranscriptionComplete={handleTranscriptionComplete}
            noteId={note._id}
          />
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
    marginBottom: 8,
  },
  audioTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginLeft: 4,
  },
  recordingsScroll: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  recordingItem: {
    marginRight: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    width: 280,
  },
  recordingActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  transcribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  transcribeButtonDisabled: {
    opacity: 0.6,
  },
  transcribeText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 4,
    fontWeight: '500',
  },
  transcribeTextDisabled: {
    color: '#C7C7CC',
  },
  transcriptContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 6,
  },
  transcriptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  transcriptTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  transcriptText: {
    fontSize: 12,
    color: '#3C3C43',
    lineHeight: 16,
  },
  errorText: {
    marginTop: 8,
    fontSize: 12,
    color: '#FF3B30',
    textAlign: 'center',
  },
});