import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  listAll
} from 'firebase/storage';
import { storage } from '../firebase.config';

// Upload a file to Firebase Storage
export const uploadFile = async (file, path) => {
  try {
    // For React Native, file should be a blob or uri
    const storageRef = ref(storage, path);
    
    // If file is a URI (from expo-image-picker or similar)
    if (typeof file === 'string' && file.startsWith('file://')) {
      // Convert URI to blob for React Native
      const response = await fetch(file);
      const blob = await response.blob();
      const snapshot = await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } 
    // If file is already a blob
    else {
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

// Get download URL for a file
export const getFileURL = async (path) => {
  try {
    const storageRef = ref(storage, path);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error('Error getting file URL:', error);
    throw error;
  }
};

// Delete a file from Firebase Storage
export const deleteFile = async (path) => {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

// List all files in a directory
export const listFiles = async (path) => {
  try {
    const storageRef = ref(storage, path);
    const res = await listAll(storageRef);
    
    const fileURLs = await Promise.all(
      res.items.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef);
        return {
          name: itemRef.name,
          fullPath: itemRef.fullPath,
          url
        };
      })
    );
    
    return fileURLs;
  } catch (error) {
    console.error('Error listing files:', error);
    throw error;
  }
}; 