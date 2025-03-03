/**
 * Utility functions for working with localStorage
 */

// Check if localStorage is available
export const isLocalStorageAvailable = (): boolean => {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

// Get the available storage space in bytes
export const getAvailableStorageSpace = (): number | null => {
  if (!isLocalStorageAvailable()) return null;
  
  try {
    // Most browsers have a 5MB limit
    const defaultLimit = 5 * 1024 * 1024; // 5MB in bytes
    let usedSpace = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key) || '';
        usedSpace += key.length + value.length;
      }
    }
    
    return Math.max(0, defaultLimit - usedSpace);
  } catch (e) {
    console.error('Error calculating storage space:', e);
    return null;
  }
};

// Clear all recordings from localStorage
export const clearAllRecordings = (): boolean => {
  try {
    localStorage.removeItem('audioRecordings');
    return true;
  } catch (e) {
    console.error('Error clearing recordings:', e);
    return false;
  }
};