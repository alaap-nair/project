import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase.config';
import { Audio } from 'expo-av';

// Helper function to get the filename from a URI
export const getFilenameFromUri = (uri: string): string => {
  if (!uri) return `recording-${Date.now()}.m4a`;
  
  const splitURI = uri.split('/');
  const filename = splitURI[splitURI.length - 1];
  
  // Ensure the filename has an extension
  if (!filename.includes('.')) {
    return `${filename}.m4a`;
  }
  
  return filename;
};

// Convert a local audio URI to a blob for upload
export const uriToBlob = async (uri: string): Promise<Blob> => {
  try {
    const response = await fetch(uri);
    return await response.blob();
  } catch (error) {
    console.error('Error converting URI to blob:', error);
    throw error;
  }
};

// Upload audio file to Firebase Storage and return permanent URL
export const uploadAudioToStorage = async (uri: string): Promise<string> => {
  try {
    console.log('Starting audio upload from URI:', uri);
    
    let uploadUri = uri;
    
    // On iOS, the file:// prefix needs to be properly handled
    if (Platform.OS === 'ios' && !uri.startsWith('file://')) {
      uploadUri = uri.replace('file:', 'file://');
    }
    
    console.log('Using upload URI:', uploadUri);
    
    // Create a reference to the storage location
    const filename = getFilenameFromUri(uploadUri);
    const storageRef = ref(storage, `audio/${filename}`);
    
    let blob: Blob;
    
    try {
      // Try to convert URI to blob for upload
      blob = await uriToBlob(uploadUri);
    } catch (blobError) {
      console.error('Failed to convert to blob, trying FileSystem:', blobError);
      
      // Fallback to FileSystem if fetch doesn't work
      if (FileSystem.readAsStringAsync) {
        const fileContent = await FileSystem.readAsStringAsync(uploadUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        // Convert base64 to blob
        const base64Response = await fetch(`data:audio/m4a;base64,${fileContent}`);
        blob = await base64Response.blob();
      } else {
        throw new Error('Both fetch and FileSystem methods failed to read the file');
      }
    }
    
    // Upload the blob to Firebase Storage
    await uploadBytes(storageRef, blob);
    console.log('Audio file uploaded successfully');
    
    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    console.log('Download URL:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading audio to storage:', error);
    throw error;
  }
};

// Configure audio session for optimal recording
export const configureAudioSession = async (): Promise<void> => {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: true,
    });
  } catch (error) {
    console.error('Error configuring audio session:', error);
    throw error;
  }
};

// Configure audio session for optimal playback
export const configureAudioPlaybackSession = async (): Promise<void> => {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: true,
    });
  } catch (error) {
    console.error('Error configuring audio playback session:', error);
    throw error;
  }
}; 