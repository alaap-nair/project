import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { AudioRecorder } from './AudioRecorder';
import { AudioPlayer } from './AudioPlayer';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { Audio } from 'expo-av';
import { useNotesStore } from '../store/notes';

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
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(existingAudioUri || null);
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
    setAudioUri(uri);
    setAudioDuration(duration);
    setShowRecorder(false);
    
    // Save audio to note if noteId is provided
    if (noteId) {
      try {
        await addAudioToNote(noteId, uri);
        console.log('Audio saved to note:', noteId);
      } catch (err) {
        console.error('Error saving audio to note:', err);
        setError('Failed to save audio to note');
      }
    }
    
    // Automatically start transcription if needed
    if (uri) {
      handleTranscribe(uri);
    }
  };

  const handleTranscribe = async (uri: string) => {
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
      const response = await axios.post('http://localhost:3000/api/transcribe', formData, {
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
      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: true },
          onPlaybackStatusUpdate
        );
        setSound(newSound);
        setIsPlaying(true);
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
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={24}
                color="#007AFF"
              />
            </TouchableOpacity>
            <View style={styles.audioInfo}>
              <Text style={styles.audioTitle}>Recording</Text>
              <Text style={styles.audioDuration}>{formatDuration(audioDuration)}</Text>
            </View>
            <TouchableOpacity 
              style={styles.newRecordingButton}
              onPress={handleNewRecording}
            >
              <Ionicons name="mic" size={20} color="#007AFF" />
              <Text style={styles.newRecordingText}>New</Text>
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