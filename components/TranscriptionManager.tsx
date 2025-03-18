import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { AudioRecorder } from './AudioRecorder';
import { AudioPlayer } from './AudioPlayer';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import useNotesStore from '../store/notes';
import { useAuthStore } from '../store/auth';
import { apiClient } from '../config';
import { uploadAudioToStorage, configureAudioPlaybackSession } from '../utils/audioUtils';
import * as FileSystem from 'expo-file-system';

interface TranscriptionManagerProps {
  onTranscriptionComplete: (transcript: string) => void;
  existingAudioUri?: string;
  noteId?: string;
}

export function TranscriptionManager({ 
  onTranscriptionComplete, 
  existingAudioUri,
  noteId
}: TranscriptionManagerProps) {
  const { addAudioToNote, addTranscriptToNote } = useNotesStore();
  const { user } = useAuthStore();
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(existingAudioUri || null);
  const [isUploading, setIsUploading] = useState(false);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [showRecorder, setShowRecorder] = useState(!existingAudioUri);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Clean up sound when component unmounts
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const handleRecordingComplete = async (uri: string, duration: number) => {
    try {
      console.log('Raw recording URI:', uri);
      
      // Check if user is authenticated
      if (!user) {
        setError('You must be logged in to save recordings');
        return;
      }
      
      // Validate URI
      if (!uri || typeof uri !== 'string') {
        setError('Invalid recording URI');
        return;
      }
      
      // Fix potential URI format issues for local playback
      let fixedUri = uri;
      
      // For iOS, file:// URIs need to be properly formatted
      if (Platform.OS === 'ios' && !uri.startsWith('file://')) {
        fixedUri = uri.replace('file:', 'file://');
      }
      
      console.log('Using audio URI for local playback:', fixedUri);
      
      setAudioUri(fixedUri);
      setAudioDuration(duration);
      setShowRecorder(false);
      
      // Upload to Firebase Storage to get a permanent URL
      if (noteId) {
        try {
          setIsUploading(true);
          setError(null);
          
          // Check file exists before uploading
          try {
            const fileInfo = await FileSystem.getInfoAsync(fixedUri);
            if (!fileInfo.exists) {
              throw new Error(`Recording file does not exist at path: ${fixedUri}`);
            }
            console.log('File info:', fileInfo);
          } catch (fileError) {
            console.error('Error checking file info:', fileError);
            setError('Recording file could not be accessed. Please try again.');
            return;
          }
          
          // Upload to user-specific storage path
          console.log('Starting upload to Firebase Storage...');
          const cloudStorageUrl = await uploadAudioToStorage(fixedUri, `users/${user.uid}/audio`);
          
          if (!cloudStorageUrl) {
            throw new Error('Upload completed but no URL was returned');
          }
          
          console.log('Uploaded to Firebase Storage:', cloudStorageUrl);
          
          // Save permanent URL to note
          await addAudioToNote(noteId, cloudStorageUrl);
          console.log('Permanent audio URL saved to note:', noteId);
          
          // Update local URI to use the permanent URL
          setAudioUri(cloudStorageUrl);
          
          // Automatically start transcription with the cloud URL
          handleTranscribe(cloudStorageUrl);
        } catch (err) {
          console.error('Error uploading and saving audio:', err);
          if (err instanceof Error) {
            console.error('Error details:', err.message);
            setError(`Failed to save audio: ${err.message}`);
          } else {
            setError('Failed to save audio recording. The recording is available temporarily but may not persist when you close the app.');
          }
          
          // Still try to transcribe using the local URI
          handleTranscribe(fixedUri);
        } finally {
          setIsUploading(false);
        }
      } else {
        // If no noteId, just use the local URI for transcription
        handleTranscribe(fixedUri);
      }
    } catch (err) {
      console.error('Error handling recording completion:', err);
      if (err instanceof Error) {
        console.error('Error details:', err.message);
        setError(`Error: ${err.message}`);
      } else {
        setError('An error occurred while processing the recording.');
      }
    }
  };

  const handleTranscribe = async (uri: string) => {
    if (isTranscribing) return;
    
    setIsTranscribing(true);
    setError(null);

    try {
      // Create form data for the audio file
      const formData = new FormData();
      formData.append('audio', {
        uri: uri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      });

      // Send to backend for transcription
      const response = await apiClient.post('/api/transcribe', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.transcript) {
        const transcript = response.data.transcript;
        
        // Save transcript to note if noteId is provided
        if (noteId) {
          try {
            await addTranscriptToNote(noteId, transcript);
            console.log('Transcript saved to note:', noteId);
          } catch (err) {
            console.error('Error saving transcript to note:', err);
            setError('Failed to save transcript to note');
          }
        }
        
        onTranscriptionComplete(transcript);
      }
    } catch (err: any) {
      console.error('Transcription error:', err);
      
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to transcribe audio. Please try again.');
      }
    } finally {
      setIsTranscribing(false);
    }
  };

  const handlePlayPause = async () => {
    if (!audioUri) return;

    try {
      // Configure audio mode for playback
      await configureAudioPlaybackSession();
      
      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
      } else {
        console.log('Creating new sound from URI:', audioUri);
        try {
          const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: audioUri },
            { shouldPlay: true },
            onPlaybackStatusUpdate
          );
          setSound(newSound);
          setIsPlaying(true);
        } catch (soundErr) {
          console.error('Failed to create sound object:', soundErr);
          setError('Failed to initialize audio playback');
        }
      }
    } catch (err) {
      console.error('Error playing audio:', err);
      setError('Failed to play audio. Please try again.');
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.didJustFinish) {
      setIsPlaying(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNewRecording = () => {
    if (sound) {
      sound.unloadAsync();
      setSound(null);
    }
    setAudioUri(null);
    setShowRecorder(true);
    setIsPlaying(false);
  };

  return (
    <View style={styles.container}>
      {showRecorder ? (
        <AudioRecorder onRecordingComplete={handleRecordingComplete} />
      ) : audioUri ? (
        <View style={styles.audioPlayerContainer}>
          <View style={styles.audioInfoContainer}>
            <TouchableOpacity 
              style={styles.playButton}
              onPress={handlePlayPause}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={24}
                  color="#007AFF"
                />
              )}
            </TouchableOpacity>
            <View style={styles.audioInfo}>
              <Text style={styles.audioTitle}>
                {isUploading ? 'Saving Recording...' : 'Recording'}
              </Text>
              <Text style={styles.audioDuration}>{formatDuration(audioDuration)}</Text>
            </View>
            <TouchableOpacity 
              style={styles.newRecordingButton}
              onPress={handleNewRecording}
              disabled={isUploading}
            >
              <Ionicons name="mic" size={20} color={isUploading ? '#C7C7CC' : '#007AFF'} />
              <Text style={[styles.newRecordingText, isUploading && styles.disabledText]}>New</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
      
      {isTranscribing && (
        <View style={styles.transcribingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.transcribingText}>Transcribing audio...</Text>
        </View>
      )}
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  audioPlayerContainer: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
  },
  audioInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  audioInfo: {
    flex: 1,
  },
  audioTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  audioDuration: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  newRecordingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  newRecordingText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 4,
  },
  disabledText: {
    color: '#C7C7CC',
  },
  transcribingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  transcribingText: {
    marginLeft: 10,
    color: '#007AFF',
  },
  errorText: {
    marginTop: 10,
    color: 'red',
  },
}); 