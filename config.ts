import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Determine the appropriate API URL based on environment
const getApiUrl = () => {
  // For web in development, use relative URL
  if (__DEV__ && Platform.OS === 'web') {
    return '';  // Empty string means use relative URLs
  }
  
  // For native in development
  if (__DEV__) {
    // Use localhost with appropriate port for iOS simulator
    if (Platform.OS === 'ios') {
      // For iOS simulator, localhost works
      return 'http://localhost:3000';
    }
    
    // Use 10.0.2.2 for Android emulator (special IP that routes to host machine's localhost)
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:3000';
    }
    
    // For physical devices, use the local network IP of your computer
    // This is your actual local IP address
    return 'http://10.42.13.101:3000';
  }
  
  // For production
  return 'https://your-production-api.com';
};

// API Configuration
export const API_URL = getApiUrl();

console.log('🌐 Using API URL:', API_URL);

// Configure Axios defaults
axios.defaults.baseURL = API_URL;
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.withCredentials = false; // Set to false to avoid CORS issues

// Create an axios instance for consistent configuration
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
  // Add timeout to prevent hanging requests
  timeout: 10000,
});

// Add request interceptor for debugging
apiClient.interceptors.request.use(
  (config) => {
    if (__DEV__) {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data || '');
    }
    return config;
  },
  (error) => {
    if (__DEV__) {
      console.error('❌ Request Error:', error);
    }
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
apiClient.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, 
        response.status, response.statusText);
    }
    return response;
  },
  (error) => {
    if (__DEV__) {
      console.error('❌ Response Error:', error.message);
      
      // Log more detailed error information
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error Data:', error.response.data);
        console.error('Error Status:', error.response.status);
        console.error('Error Headers:', error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error Message:', error.message);
      }
      
      if (error.config) {
        console.error('Request Config:', error.config);
      }
    }
    
    return Promise.reject(error);
  }
); 