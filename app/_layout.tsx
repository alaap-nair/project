import '../app.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { app, firestore } from '../firebase.config';
import { checkFirebaseConnection, showConnectionAlert } from '../utils/apiUtils';
import { initializeSampleData } from '../utils/sampleData';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsInitializing(true);
        
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
  }, []);

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
          headerStyle: {
            backgroundColor: '#f5f5f5',
          },
          headerTintColor: '#000',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
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