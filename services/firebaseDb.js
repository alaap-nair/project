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
  serverTimestamp 
} from 'firebase/firestore';
import { firestore } from '../firebase.config';
import { Alert, Linking, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';

// Helper function to handle index error links
export const handleIndexError = (indexError) => {
  if (!indexError || !indexError.message) return;
  
  // Extract the Firebase console URL from the error message
  const urlMatch = indexError.message.match(/(https:\/\/console\.firebase\.google\.com\/.*?)(\s|$)/);
  
  if (urlMatch && urlMatch[1]) {
    const indexUrl = urlMatch[1];
    
    // Show alert with option to open Firebase console
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
                        if (Platform.OS !== 'web') {
                          await Clipboard.setStringAsync(indexUrl);
                        } else {
                          // For web, use the browser clipboard API
                          navigator.clipboard.writeText(indexUrl)
                            .catch(e => console.warn("Web clipboard API failed:", e));
                        }
                        Alert.alert("URL Copied", "The index URL has been copied to your clipboard.");
                      } catch (e) {
                        console.warn("Couldn't copy URL:", e);
                      }
                    }
                  },
                  { text: "OK" }
                ]
              );
            });
          }
        }
      ]
    );
    
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