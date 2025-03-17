import { Alert, Platform } from 'react-native';
import { FirebaseError } from 'firebase/app';
import { firestore } from '../firebase.config';
import { collection, getDocs, query, limit } from 'firebase/firestore';

/**
 * Checks if Firebase is reachable
 * @returns Promise<boolean> - true if Firebase is reachable, false otherwise
 */
export const checkFirebaseConnection = async (): Promise<boolean> => {
  try {
    // Try to fetch a single document from any collection
    const q = query(collection(firestore, 'test-connection'), limit(1));
    await getDocs(q);
    return true;
  } catch (error) {
    console.error('Firebase connection check failed:', error);
    return false;
  }
};

/**
 * Shows an alert with Firebase connection issues and possible solutions
 */
export const showConnectionAlert = () => {
  let message = 'Could not connect to Firebase. Please check that:';
  
  message += '\n\n1. You have an active internet connection';
  message += '\n2. Your Firebase configuration is correct';
  message += '\n3. Your Firebase project is properly set up';
  
  if (Platform.OS === 'web') {
    message += '\n4. Your browser allows connections to Firebase';
  }
  
  Alert.alert(
    'Connection Error',
    message,
    [{ text: 'OK' }]
  );
};

/**
 * Handles Firebase errors in a consistent way
 * @param error - The error object from Firebase
 * @param fallbackMessage - A fallback message to show if error doesn't have a specific code
 */
export const handleFirebaseError = (error: unknown, fallbackMessage = 'An error occurred'): string => {
  if (error instanceof FirebaseError) {
    // Handle specific Firebase error codes
    switch (error.code) {
      case 'permission-denied':
        return 'You don\'t have permission to access this data';
      case 'unavailable':
        showConnectionAlert();
        return 'Firebase service is currently unavailable';
      case 'not-found':
        return 'The requested document was not found';
      case 'already-exists':
        return 'The document already exists';
      case 'cancelled':
        return 'The operation was cancelled';
      case 'invalid-argument':
        return 'Invalid data was provided';
      default:
        return error.message || fallbackMessage;
    }
  } else if (error instanceof Error) {
    return error.message;
  } else {
    return fallbackMessage;
  }
}; 