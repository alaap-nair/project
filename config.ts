import axios from 'axios';

// API Configuration
export const API_URL = __DEV__ 
  ? 'http://10.40.15.252:3000'  // Development (Local Network)
  : 'https://your-production-api.com'; // Production

// Configure Axios defaults
axios.defaults.baseURL = API_URL;
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.withCredentials = true; 