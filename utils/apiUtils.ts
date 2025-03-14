import { apiClient } from '../config';
import { Alert, Platform } from 'react-native';

/**
 * Checks if the backend server is reachable
 * @returns Promise<boolean> - true if server is reachable, false otherwise
 */
export const checkServerConnection = async (): Promise<boolean> => {
  try {
    const response = await apiClient.get('/', { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    console.error('Server connection check failed:', error);
    return false;
  }
};

/**
 * Shows an alert with server connection issues and possible solutions
 */
export const showConnectionAlert = () => {
  let message = 'Could not connect to the server. Please check that:';
  
  if (Platform.OS === 'ios') {
    message += '\n\n1. The backend server is running on your computer';
    message += '\n2. You\'re using the correct URL in config.ts';
    message += '\n3. If using a physical device, make sure it\'s on the same network as your computer';
  } else if (Platform.OS === 'android') {
    message += '\n\n1. The backend server is running on your computer';
    message += '\n2. You\'re using the correct URL in config.ts';
    message += '\n3. If using an emulator, make sure to use 10.0.2.2 instead of localhost';
    message += '\n4. If using a physical device, make sure it\'s on the same network as your computer';
  } else {
    message += '\n\n1. The backend server is running';
    message += '\n2. You\'re using the correct URL in config.ts';
  }
  
  Alert.alert(
    'Connection Error',
    message,
    [{ text: 'OK' }]
  );
};

/**
 * Handles API errors in a consistent way
 * @param error - The error object from axios
 * @param fallbackMessage - A fallback message to show if error doesn't have a response
 */
export const handleApiError = (error: any, fallbackMessage = 'An error occurred') => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const serverMessage = error.response.data?.message || fallbackMessage;
    return serverMessage;
  } else if (error.request) {
    // The request was made but no response was received
    showConnectionAlert();
    return 'Could not connect to the server';
  } else {
    // Something happened in setting up the request that triggered an Error
    return fallbackMessage;
  }
}; 