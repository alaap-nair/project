import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { configureAudioSession } from '../utils/audioUtils';

interface AudioRecorderProps {
  onRecordingComplete: (uri: string, duration: number) => void;
}

export function AudioRecorder({ onRecordingComplete }: AudioRecorderProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording' | 'paused' | 'stopped'>('idle');
  
  // Animation for the recording indicator
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    return () => {
      if (recording) {
        stopRecording();
      }
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
      
      // Start pulsing animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
    return () => {
      clearInterval(interval);
      pulseAnim.stopAnimation();
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      setError(null);
      setDuration(0);
      
      // Reset any existing recording
      if (recording) {
        await recording.stopAndUnloadAsync();
        setRecording(null);
      }
      
      console.log('Requesting permissions..');
      const permissionResponse = await Audio.requestPermissionsAsync();
      
      if (!permissionResponse.granted) {
        throw new Error('Audio recording permission not granted');
      }
      
      // Ensure audio session is properly configured
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: true,
      });
      
      console.log('Starting recording..');
      const newRecording = new Audio.Recording();
      
      try {
        await newRecording.prepareToRecordAsync({
          android: {
            extension: '.m4a',
            outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
            audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
          },
          ios: {
            extension: '.m4a',
            outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
            audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_MAX,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
        });
        
        await newRecording.startAsync();
        setRecording(newRecording);
        setIsRecording(true);
        setRecordingStatus('recording');
        console.log('Recording started successfully');
      } catch (err) {
        console.error('Error during recording setup:', err);
        throw new Error('Failed to initialize recording. Please try again.');
      }
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError(err instanceof Error ? err.message : 'Failed to start recording. Please check permissions and try again.');
      setRecordingStatus('idle');
    }
  };

  async function stopRecording() {
    if (!recording) return;
    
    try {
      setIsRecording(false);
      setRecordingStatus('stopped');
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (uri) {
        console.log('Recording stopped, URI:', uri);
        
        try {
          // Get file info to verify the file exists and is accessible
          if (FileSystem.getInfoAsync) {
            const fileInfo = await FileSystem.getInfoAsync(uri);
            console.log('File info:', fileInfo);
            
            if (!fileInfo.exists) {
              throw new Error('Recording file does not exist');
            }
          }
        } catch (fileErr) {
          console.error('Error checking file info:', fileErr);
        }
        
        onRecordingComplete(uri, duration);
      } else {
        setError('No recording URI was generated. Please try again.');
      }
      setRecording(null);
    } catch (err) {
      console.error('Failed to stop recording:', err);
      setError('Failed to stop recording. Please try again.');
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusContainer}>
        {isRecording && (
          <Animated.View 
            style={[
              styles.recordingIndicator, 
              { transform: [{ scale: pulseAnim }] }
            ]} 
          />
        )}
        <Text style={styles.statusText}>
          {recordingStatus === 'idle' && 'Ready to record'}
          {recordingStatus === 'recording' && 'Recording...'}
          {recordingStatus === 'stopped' && 'Recording complete'}
        </Text>
        {isRecording && (
          <Text style={styles.duration}>{formatDuration(duration)}</Text>
        )}
      </View>
      
      <TouchableOpacity
        style={[styles.recordButton, isRecording && styles.recording]}
        onPress={isRecording ? stopRecording : startRecording}
      >
        <Ionicons
          name={isRecording ? 'stop' : 'mic'}
          size={24}
          color={isRecording ? '#FF3B30' : '#007AFF'}
        />
      </TouchableOpacity>
      
      {error && (
        <Text style={styles.error}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    justifyContent: 'center',
  },
  recordingIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    color: '#3A3A3C',
    fontWeight: '500',
  },
  recordButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
        cursor: 'pointer',
      },
    }),
  },
  recording: {
    backgroundColor: '#FFE5E5',
    transform: [{ scale: 1.1 }],
  },
  duration: {
    marginLeft: 8,
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: 'bold',
  },
  error: {
    marginTop: 12,
    fontSize: 16,
    color: '#FF3B30',
  },
}); 