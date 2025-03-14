import { useState, useRef, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AudioRecording } from '../types';

export const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<AudioRecording[]>([]);
  const [recordingName, setRecordingName] = useState('New Recording');
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  
  // Load recordings from localStorage on initial render
  useEffect(() => {
    try {
      const savedRecordings = localStorage.getItem('audioRecordings');
      if (savedRecordings) {
        const parsedRecordings = JSON.parse(savedRecordings);
        
        // We need to recreate the Date objects since they're serialized as strings
        const formattedRecordings = parsedRecordings.map((recording: any) => ({
          ...recording,
          createdAt: new Date(recording.createdAt)
        }));
        
        setRecordings(formattedRecordings);
        console.log('Loaded recordings from localStorage:', formattedRecordings.length);
      }
    } catch (err) {
      console.error('Error loading recordings from localStorage:', err);
    }
  }, []);
  
  // Save recordings to localStorage whenever they change
  useEffect(() => {
    try {
      // Create a safe copy for storage by removing circular references
      const recordingsForStorage = recordings.map(recording => {
        // Create a new object with only the properties we want to store
        return {
          id: recording.id,
          name: recording.name,
          audioData: recording.audioData,
          duration: recording.duration,
          createdAt: recording.createdAt,
          transcription: recording.transcription
        };
      });
      
      if (recordingsForStorage.length > 0) {
        const storageString = JSON.stringify(recordingsForStorage);
        localStorage.setItem('audioRecordings', storageString);
        console.log('Saved recordings to localStorage:', recordingsForStorage.length);
      }
    } catch (err) {
      console.error('Error saving recordings to localStorage:', err);
      setError('Failed to save recordings. Storage might be full.');
    }
  }, [recordings]);
  
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      startTimeRef.current = Date.now();
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const duration = (Date.now() - startTimeRef.current) / 1000; // in seconds
        
        // Convert the blob to base64 for storage
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          
          const newRecording: AudioRecording = {
            id: uuidv4(),
            name: recordingName || `Recording ${recordings.length + 1}`,
            audioUrl,
            audioData: base64Audio, // Store the base64 data
            duration,
            createdAt: new Date(),
          };
          
          setRecordings((prev) => [...prev, newRecording]);
          setRecordingName('New Recording');
          
          // Explicitly save to localStorage after adding a new recording
          const updatedRecordings = [...recordings, newRecording];
          const recordingsForStorage = updatedRecordings.map(rec => ({
            id: rec.id,
            name: rec.name,
            audioData: rec.audioData,
            duration: rec.duration,
            createdAt: rec.createdAt,
            transcription: rec.transcription
          }));
          
          try {
            localStorage.setItem('audioRecordings', JSON.stringify(recordingsForStorage));
            console.log('Explicitly saved new recording to localStorage');
          } catch (storageErr) {
            console.error('Error saving new recording:', storageErr);
            setError('Failed to save recording. Storage might be full.');
          }
        };
        
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start(1000); // Collect data every second
      setIsRecording(true);
      setError(null);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Could not access microphone. Please check permissions.');
    }
  }, [recordingName, recordings]);
  
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);
  
  const deleteRecording = useCallback((id: string) => {
    setRecordings((prev) => {
      const updatedRecordings = prev.filter((recording) => recording.id !== id);
      
      try {
        const recordingsForStorage = updatedRecordings.map(rec => ({
          id: rec.id,
          name: rec.name,
          audioData: rec.audioData,
          duration: rec.duration,
          createdAt: rec.createdAt,
          transcription: rec.transcription
        }));
        
        localStorage.setItem('audioRecordings', JSON.stringify(recordingsForStorage));
        console.log('Saved updated recordings after deletion');
      } catch (err) {
        console.error('Error saving after deletion:', err);
      }
      
      return updatedRecordings;
    });
  }, []);
  
  const updateRecordingName = useCallback((id: string, name: string) => {
    setRecordings((prev) => {
      const updatedRecordings = prev.map((recording) => 
        recording.id === id ? { ...recording, name } : recording
      );
      
      try {
        const recordingsForStorage = updatedRecordings.map(rec => ({
          id: rec.id,
          name: rec.name,
          audioData: rec.audioData,
          duration: rec.duration,
          createdAt: rec.createdAt,
          transcription: rec.transcription
        }));
        
        localStorage.setItem('audioRecordings', JSON.stringify(recordingsForStorage));
        console.log('Saved updated recordings after rename');
      } catch (err) {
        console.error('Error saving after rename:', err);
      }
      
      return updatedRecordings;
    });
  }, []);
  
  const saveTranscription = useCallback((id: string, transcription: any) => {
    setRecordings((prev) => {
      const updatedRecordings = prev.map((recording) => 
        recording.id === id ? { ...recording, transcription } : recording
      );
      
      try {
        const recordingsForStorage = updatedRecordings.map(rec => ({
          id: rec.id,
          name: rec.name,
          audioData: rec.audioData,
          duration: rec.duration,
          createdAt: rec.createdAt,
          transcription: rec.transcription
        }));
        
        localStorage.setItem('audioRecordings', JSON.stringify(recordingsForStorage));
        console.log('Saved updated recordings after transcription');
      } catch (err) {
        console.error('Error saving after transcription:', err);
      }
      
      return updatedRecordings;
    });
  }, []);
  
  // Function to manually trigger saving all recordings
  const saveAllRecordings = useCallback(() => {
    try {
      const recordingsForStorage = recordings.map(rec => ({
        id: rec.id,
        name: rec.name,
        audioData: rec.audioData,
        duration: rec.duration,
        createdAt: rec.createdAt,
        transcription: rec.transcription
      }));
      
      localStorage.setItem('audioRecordings', JSON.stringify(recordingsForStorage));
      console.log('Manually saved all recordings');
      return true;
    } catch (err) {
      console.error('Error manually saving all recordings:', err);
      setError('Failed to save recordings. Storage might be full.');
      return false;
    }
  }, [recordings]);
  
  return {
    isRecording,
    recordings,
    recordingName,
    error,
    setRecordingName,
    startRecording,
    stopRecording,
    deleteRecording,
    updateRecordingName,
    saveTranscription,
    saveAllRecordings
  };
};