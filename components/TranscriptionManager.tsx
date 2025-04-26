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
  noteId: string;
}

export function TranscriptionManager({ 
  onTranscriptionComplete,
  noteId
}: TranscriptionManagerProps) {
  const { addAudioToNote, addTranscriptToNote } = useNotesStore();
  const { user } = useAuthStore();
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [showRecorder, setShowRecorder] = useState(true);
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
      console.log('Recording completed, URI:', uri);
      await addAudioToNote(noteId, uri);
      setShowRecorder(true);
    } catch (err) {
      console.error('Error handling recording:', err);
      setError('Failed to save recording. Please try again.');
    }
  };

  const handleTranscribe = async (uri: string) => {
    try {
      setError(null);
      
      // Create FormData for the audio file
      const formData = new FormData();
      formData.append('audio', {
        uri,
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
      {showRecorder && (
        <AudioRecorder onRecordingComplete={handleRecordingComplete} />
      )}
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
  transcribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  transcribeText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 4,
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
  errorText: {
    marginTop: 10,
    color: 'red',
  },
}); 