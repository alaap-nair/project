import '../app.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { default as app, firestore, auth } from '../config/firebase';
import { checkFirebaseConnection, showConnectionAlert } from '../utils/apiUtils';
import { initializeSampleData } from '../utils/sampleData';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '../store/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Key for storing session status
const SESSION_ACTIVE_KEY = 'bolt_notes_session_active';

export default function RootLayout() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  const cleanup = useAuthStore(state => state.cleanup);
  const user = useAuthStore(state => state.user);

  // Session management to prevent logout
  useEffect(() => {
    const manageSession = async () => {
      if (user) {
        // When user is logged in, mark session as active
        await AsyncStorage.setItem(SESSION_ACTIVE_KEY, 'true');
        console.log('✅ User session marked as active');
      }
    };

    manageSession();
  }, [user]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsInitializing(true);
        
        // Check if we have an active session from a previous app run
        const sessionActive = await AsyncStorage.getItem(SESSION_ACTIVE_KEY);
        if (sessionActive === 'true') {
          console.log('✅ Active session detected, awaiting Firebase auth');
        }
        
        // Test Firebase connection
        const connected = await checkFirebaseConnection();
        
        if (connected) {
          console.log('✅ Firebase connection successful');
          
          // Initialize sample data
          await initializeSampleData();
        } else {
          console.error('❌ Firebase connection failed');
          showConnectionAlert();
        }
        
        // We'll still set isFirebaseReady to true to allow the app to proceed
        // Firebase operations will fail gracefully if there are connection issues
        setIsFirebaseReady(true);
      } catch (error) {
        console.error('❌ Firebase initialization error:', error);
        setIsFirebaseReady(true);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeApp();

    // Cleanup function
    return () => {
      cleanup();
    };
  }, [cleanup]);

  if (isInitializing) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.container}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.text}>Initializing app...</Text>
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          headerStyle: {
            backgroundColor: '#f5f5f5',
          },
          headerTintColor: '#000',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="dark" />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#333',
  },
});