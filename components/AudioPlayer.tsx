import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

interface AudioPlayerProps {
  audioUri: string;
  duration?: number;
}

export function AudioPlayer({ audioUri, duration = 0 }: AudioPlayerProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load sound when component mounts
  useEffect(() => {
    loadSound();
    
    // Clean up when component unmounts
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [audioUri]);

  // Set up position update interval when playing
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying) {
      interval = setInterval(async () => {
        if (sound) {
          const status = await sound.getStatusAsync();
          if (status.isLoaded) {
            setPosition(status.positionMillis / 1000);
          }
        }
      }, 500);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isPlaying, sound]);

  const loadSound = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Unload any existing sound
      if (sound) {
        await sound.unloadAsync();
      }
      
      // Create and load the new sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );
      
      setSound(newSound);
      
      // Get the duration if not provided
      if (!duration) {
        const status = await newSound.getStatusAsync();
        if (status.isLoaded) {
          setAudioDuration(status.durationMillis ? status.durationMillis / 1000 : 0);
        }
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error loading audio:', err);
      setError('Failed to load audio');
      setIsLoading(false);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPosition(0);
        sound?.setPositionAsync(0);
      }
    }
  };

  const handlePlayPause = async () => {
    if (!sound) return;
    
    try {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('Error playing/pausing audio:', err);
      setError('Failed to play audio');
    }
  };

  const handleSeek = async (value: number) => {
    if (!sound) return;
    
    try {
      await sound.setPositionAsync(value * 1000);
      setPosition(value);
    } catch (err) {
      console.error('Error seeking audio:', err);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <Text style={styles.loadingText}>Loading audio...</Text>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <>
          <View style={styles.controls}>
            <TouchableOpacity
              style={styles.playButton}
              onPress={handlePlayPause}
              disabled={!sound}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={24}
                color="#007AFF"
              />
            </TouchableOpacity>
            
            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>{formatTime(position)}</Text>
              <Text style={styles.timeText}>{formatTime(audioDuration)}</Text>
            </View>
          </View>
          
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={audioDuration || 1}
            value={position}
            onValueChange={handleSeek}
            minimumTrackTintColor="#007AFF"
            maximumTrackTintColor="#DDDDDD"
            thumbTintColor="#007AFF"
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
  timeContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  loadingText: {
    textAlign: 'center',
    color: '#8E8E93',
    padding: 12,
  },
  errorText: {
    textAlign: 'center',
    color: '#FF3B30',
    padding: 12,
  },
}); 