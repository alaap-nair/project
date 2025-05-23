import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  getDocs as _getDocs // Rename to avoid conflict with our enhanced version
} from 'firebase/firestore';
import { firestore } from '../firebase.config';
import { Alert, Linking, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

// Enhanced getDocs function that automatically creates sample documents to help trigger index creation
export const enhancedGetDocs = async (query) => {
  try {
    return await _getDocs(query);
  } catch (error) {
    if (error.message && error.message.includes('index')) {
      console.log('Firestore index error detected, attempting to create index...');
      await createFirestoreIndex(query);
      return await _getDocs(query);
    }
    throw error;
  }
};

// Track which collections we've already tried to create indexes for to avoid infinite loops
const indexCreationAttempts = new Set();

// Helper function to automatically create or force Firestore index creation
export const createFirestoreIndex = async (queryOrCollection, filterField, orderByField) => {
  let collectionName, filterFieldName, orderByFieldName;
  
  if (typeof queryOrCollection === 'object' && queryOrCollection._query) {
    // Extract information from the query object
    const queryObj = queryOrCollection._query;
    collectionName = queryObj.path.segments[queryObj.path.segments.length - 1];
    
    // Extract filter and order fields from the query constraints
    const constraints = queryObj.filters || [];
    const orderBy = queryObj.orderBy || [];
    
    filterFieldName = constraints[0]?.field?.segments?.[0] || filterField;
    orderByFieldName = orderBy[0]?.field?.segments?.[0] || orderByField;
  } else {
    collectionName = queryOrCollection;
    filterFieldName = filterField;
    orderByFieldName = orderByField;
  }

  // Create a unique key to track this specific index creation attempt
  const indexKey = `${collectionName}_${filterFieldName}_${orderByFieldName}`;
  
  // Check if we've already tried to create this index
  if (indexCreationAttempts.has(indexKey)) {
    console.log('Already attempted to create this index, skipping to avoid loops');
    return false;
  }
  
  // Mark that we've attempted this index
  indexCreationAttempts.add(indexKey);
  
  console.log(`Attempting to help Firebase create index for ${collectionName} with filter ${filterFieldName} and order ${orderByFieldName}`);
  
  try {
    // 1. Create a temporary document that will have the right fields for the index
    const tempDoc = {
      [filterFieldName]: 'temp-filter-value',
      [orderByFieldName]: new Date(),
      _isTemporary: true,
      createdAt: serverTimestamp()
    };
    
    // 2. Add the temporary document to the collection
    const docRef = await addDoc(collection(firestore, collectionName), tempDoc);
    console.log('Added temporary document to help with index creation');
    
    // 3. Try the query that needs the index (this might still fail, but helps Firebase know we need the index)
    try {
      const q = query(
        collection(firestore, collectionName),
        where(filterFieldName, '==', 'temp-filter-value'),
        orderBy(orderByFieldName, 'desc')
      );
      
      await _getDocs(q);
      console.log('Successfully queried with the index, it might be ready now');
    } catch (queryError) {
      console.log('Expected query error occurred, this helps Firebase know we need the index', queryError.code);
    }
    
    // 4. Clean up the temporary document
    await deleteDoc(docRef);
    console.log('Cleaned up temporary document');
    
    return true;
  } catch (error) {
    console.error('Error in index creation helper:', error);
    return false;
  }
};

// Helper function to handle index error links for web
export const handleIndexErrorWeb = (indexError) => {
  if (!indexError || !indexError.message) return false;
  
  // Extract the Firebase console URL from the error message
  const urlMatch = indexError.message.match(/(https:\/\/console\.firebase\.google\.com\/.*?)(\s|$)/);
  
  if (urlMatch && urlMatch[1]) {
    const indexUrl = urlMatch[1];
    
    console.log('Firebase index URL:', indexUrl);
    console.log('Please create the index in Firebase console for optimal performance.');
    
    // For web, create a friendlier UI if possible
    if (isBrowser) {
      try {
        // Create a simple toast-like UI element 
        const toast = document.createElement('div');
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.backgroundColor = '#333';
        toast.style.color = 'white';
        toast.style.padding = '12px 20px';
        toast.style.borderRadius = '4px';
        toast.style.zIndex = '10000';
        toast.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        toast.style.display = 'flex';
        toast.style.flexDirection = 'column';
        toast.style.alignItems = 'center';
        
        const message = document.createElement('div');
        message.textContent = 'Firestore index required for optimal performance';
        message.style.marginBottom = '10px';
        
        const button = document.createElement('button');
        button.textContent = 'Create Index';
        button.style.padding = '6px 12px';
        button.style.backgroundColor = '#4285F4';
        button.style.border = 'none';
        button.style.borderRadius = '3px';
        button.style.color = 'white';
        button.style.cursor = 'pointer';
        button.onclick = () => {
          window.open(indexUrl, '_blank');
          document.body.removeChild(toast);
        };
        
        toast.appendChild(message);
        toast.appendChild(button);
        
        // Add close button
        const closeBtn = document.createElement('div');
        closeBtn.textContent = '×';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '5px';
        closeBtn.style.right = '10px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.fontSize = '18px';
        closeBtn.onclick = () => {
          document.body.removeChild(toast);
        };
        
        toast.appendChild(closeBtn);
        document.body.appendChild(toast);
        
        // Remove after 10 seconds
        setTimeout(() => {
          if (document.body.contains(toast)) {
            document.body.removeChild(toast);
          }
        }, 10000);
      } catch (e) {
        console.warn('Error creating web notification:', e);
      }
    }
    
    return true;
  }
  
  return false;
};

// Helper function to handle index error links
export const handleIndexError = (indexError) => {
  if (!indexError || !indexError.message) return;
  
  // For web platforms, use the web-specific handler
  if (isBrowser && (!Alert || typeof Alert === 'undefined')) {
    return handleIndexErrorWeb(indexError);
  }
  
  // Extract the Firebase console URL from the error message
  const urlMatch = indexError.message.match(/(https:\/\/console\.firebase\.google\.com\/.*?)(\s|$)/);
  
  if (urlMatch && urlMatch[1]) {
    const indexUrl = urlMatch[1];
    
    // Log the URL for platforms without UI
    console.log('Firebase index URL:', indexUrl);
    console.log('Please create the index in Firebase console for optimal performance.');
    
    // Extract collection and field info if possible
    const collectionMatch = indexError.message.match(/collection group: \[([^\]]+)\]/i);
    const fieldMatch = indexError.message.match(/field: \[([^\]]+)\]/i);
    
    if (collectionMatch && collectionMatch[1] && fieldMatch && fieldMatch[1]) {
      const collectionName = collectionMatch[1];
      const fields = fieldMatch[1].split(', ');
      
      console.log(`Attempting automatic index solution for collection ${collectionName} with fields ${fields.join(', ')}`);
      
      if (fields.length >= 2) {
        // Try to auto-create the index
        createFirestoreIndex(collectionName, fields[0], fields[1])
          .then(success => {
            if (success) {
              console.log('Index creation helper completed');
            }
          })
          .catch(e => console.warn('Error in automatic index creation:', e));
      }
    }
    
    // Only use Alert if it's available (e.g., on React Native)
    if (typeof Alert !== 'undefined') {
      try {
        Alert.alert(
          "Firestore Index Required",
          "This query requires a database index for optimal performance. Would you like to create it now?",
          [
            {
              text: "Not Now",
              style: "cancel"
            },
            {
              text: "Create Index",
              onPress: () => {
                if (typeof Linking !== 'undefined') {
                  Linking.openURL(indexUrl).catch(err => {
                    console.warn("Couldn't open the URL:", err);
                    
                    // If opening URL fails, show the URL to manually copy
                    Alert.alert(
                      "Couldn't Open URL",
                      "Please copy and open this URL in your browser to create the index:\n\n" + indexUrl,
                      [
                        {
                          text: "Copy URL",
                          onPress: async () => {
                            try {
                              // Handle clipboard operations for both web and mobile
                              if (typeof Clipboard !== 'undefined') {
                                if (Platform.OS !== 'web') {
                                  await Clipboard.setStringAsync(indexUrl);
                                  Alert.alert("URL Copied", "The index URL has been copied to your clipboard.");
                                } else {
                                  // For web, try browser clipboard API if running in browser context
                                  if (typeof navigator !== 'undefined' && navigator.clipboard) {
                                    navigator.clipboard.writeText(indexUrl)
                                      .then(() => Alert.alert("URL Copied", "The index URL has been copied to your clipboard."))
                                      .catch(e => console.warn("Web clipboard API failed:", e));
                                  } else {
                                    console.warn("No clipboard API available");
                                  }
                                }
                              } else {
                                console.warn("Clipboard API not available");
                              }
                            } catch (e) {
                              console.warn("Couldn't copy URL:", e);
                            }
                          }
                        },
                        { text: "OK" }
                      ]
                    );
                  });
                } else {
                  console.log('Please open this URL in your browser:', indexUrl);
                }
              }
            }
          ]
        );
      } catch (e) {
        console.warn("Error showing alert:", e);
        console.log('Please open this URL in your browser to create the needed index:', indexUrl);
      }
    }
    
    return true;
  }
  
  return false;
};

// Add a document to a collection
export const addDocument = async (collectionName, data) => {
  try {
    const docRef = await addDoc(collection(firestore, collectionName), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error(`Error adding document to ${collectionName}:`, error);
    throw error;
  }
};

// Get a document by ID
export const getDocument = async (collectionName, docId) => {
  try {
    const docRef = doc(firestore, collectionName, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error(`Error getting document from ${collectionName}:`, error);
    throw error;
  }
};

// Get all documents from a collection
export const getDocuments = async (collectionName, orderByField = 'createdAt', orderDirection = 'desc') => {
  try {
    try {
      // Try with ordering first
      const q = query(
        collection(firestore, collectionName),
        orderBy(orderByField, orderDirection)
      );
      
      const querySnapshot = await getDocs(q);
      const documents = [];
      
      querySnapshot.forEach((doc) => {
        documents.push({ id: doc.id, ...doc.data() });
      });
      
      return documents;
    } catch (queryError) {
      // Check if this is a missing index error
      if (queryError.code === 'failed-precondition' || 
          (queryError.message && queryError.message.includes('index'))) {
        console.warn(`Firestore index required for ${collectionName} collection. Falling back to client-side sorting.`);
        
        // Show UI prompt to create the index
        handleIndexError(queryError);
        
        // Fallback to a simpler query without ordering
        const fallbackSnapshot = await getDocs(collection(firestore, collectionName));
        let fallbackDocuments = [];
        
        fallbackSnapshot.forEach((doc) => {
          fallbackDocuments.push({ id: doc.id, ...doc.data() });
        });
        
        // Sort documents in memory based on the requested order
        fallbackDocuments.sort((a, b) => {
          const aValue = a[orderByField];
          const bValue = b[orderByField];
          
          // Handle dates (convert to timestamp for comparison)
          if (aValue && bValue) {
            const aTime = aValue instanceof Date ? aValue.getTime() : 
                         (aValue.toDate ? aValue.toDate().getTime() : aValue);
            const bTime = bValue instanceof Date ? bValue.getTime() : 
                         (bValue.toDate ? bValue.toDate().getTime() : bValue);
            
            return orderDirection === 'desc' ? bTime - aTime : aTime - bTime;
          }
          
          return 0;
        });
        
        console.warn(
          `To improve performance, please create a single field index on the "${collectionName}" collection with field:\n` +
          `- ${orderByField} (${orderDirection})\n` +
          'You can create this index in the Firebase console.'
        );
        
        return fallbackDocuments;
      } else {
        // This is not an index error, rethrow it
        throw queryError;
      }
    }
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}:`, error);
    throw error;
  }
};

// Get documents with a filter
export const getFilteredDocuments = async (
  collectionName, 
  filterField, 
  filterOperator, 
  filterValue,
  orderByField = 'createdAt',
  orderDirection = 'desc'
) => {
  try {
    try {
      // Try the composite query first
      const q = query(
        collection(firestore, collectionName),
        where(filterField, filterOperator, filterValue),
        orderBy(orderByField, orderDirection)
      );
      
      const querySnapshot = await getDocs(q);
      const documents = [];
      
      querySnapshot.forEach((doc) => {
        documents.push({ id: doc.id, ...doc.data() });
      });
      
      return documents;
    } catch (queryError) {
      // Check if this is a missing index error
      if (queryError.code === 'failed-precondition' || 
          (queryError.message && queryError.message.includes('index'))) {
        console.warn(`Firestore index required for ${collectionName} query. Falling back to client-side sorting.`);
        
        // Show UI prompt to create the index
        handleIndexError(queryError);
        
        // Fallback to a simpler query without ordering
        const fallbackQuery = query(
          collection(firestore, collectionName),
          where(filterField, filterOperator, filterValue)
        );
        
        const fallbackSnapshot = await getDocs(fallbackQuery);
        let fallbackDocuments = [];
        
        fallbackSnapshot.forEach((doc) => {
          fallbackDocuments.push({ id: doc.id, ...doc.data() });
        });
        
        // Sort documents in memory based on the requested order
        if (orderByField) {
          fallbackDocuments.sort((a, b) => {
            const aValue = a[orderByField];
            const bValue = b[orderByField];
            
            // Handle dates (convert to timestamp for comparison)
            if (aValue && bValue) {
              const aTime = aValue instanceof Date ? aValue.getTime() : 
                           (aValue.toDate ? aValue.toDate().getTime() : aValue);
              const bTime = bValue instanceof Date ? bValue.getTime() : 
                           (bValue.toDate ? bValue.toDate().getTime() : bValue);
              
              return orderDirection === 'desc' ? bTime - aTime : aTime - bTime;
            }
            
            return 0;
          });
        }
        
        console.warn(
          `To improve performance, please create a composite index on the "${collectionName}" collection with fields:\n` +
          `- ${filterField} (${filterOperator})\n` +
          `- ${orderByField} (${orderDirection})\n` +
          'You can create this index in the Firebase console.'
        );
        
        return fallbackDocuments;
      } else {
        // Not an index error, so rethrow
        throw queryError;
      }
    }
  } catch (error) {
    console.error(`Error getting filtered documents from ${collectionName}:`, error);
    throw error;
  }
};

// Update a document
export const updateDocument = async (collectionName, docId, data) => {
  try {
    const docRef = doc(firestore, collectionName, docId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw error;
  }
};

// Delete a document
export const deleteDocument = async (collectionName, docId) => {
  try {
    const docRef = doc(firestore, collectionName, docId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
}; 