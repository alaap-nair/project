import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { AudioRecorder } from './AudioRecorder';
import { apiClient } from '../config';

interface TranscriptionManagerProps {
  onTranscriptionComplete: (transcript: string) => void;
}

export function TranscriptionManager({ onTranscriptionComplete }: TranscriptionManagerProps) {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRecordingComplete = async (audioUri: string) => {
    setIsTranscribing(true);
    setError(null);

    try {
      // Create form data for the audio file
      const formData = new FormData();
      formData.append('audio', {
        uri: audioUri,
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
        onTranscriptionComplete(response.data.transcript);
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

  return (
    <View style={styles.container}>
      <AudioRecorder onRecordingComplete={handleRecordingComplete} />
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