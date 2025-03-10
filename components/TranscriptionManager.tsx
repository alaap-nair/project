import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { AudioRecorder } from './AudioRecorder';
import axios from 'axios';

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
      const response = await axios.post('http://localhost:5000/api/transcribe', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.transcript) {
        onTranscriptionComplete(response.data.transcript);
      }
    } catch (err) {
      console.error('Transcription error:', err);
      setError('Failed to transcribe audio. Please try again.');
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
    alignItems: 'center',
    padding: 16,
  },
  transcribingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  transcribingText: {
    marginLeft: 8,
    color: '#8E8E93',
  },
  errorText: {
    color: '#FF3B30',
    marginTop: 8,
    textAlign: 'center',
  },
}); 