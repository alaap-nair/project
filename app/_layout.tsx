import '../app.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { checkServerConnection, showConnectionAlert } from '../utils/apiUtils';

export default function RootLayout() {
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        setIsCheckingConnection(true);
        const connected = await checkServerConnection();
        setIsConnected(connected);
        
        if (!connected) {
          showConnectionAlert();
        }
      } catch (error) {
        console.error('Error checking connection:', error);
        setIsConnected(false);
      } finally {
        setIsCheckingConnection(false);
      }
    };

    checkConnection();
  }, []);

  if (isCheckingConnection) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.text}>Connecting to server...</Text>
      </View>
    );
  }

  return (
    <>
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
    </>
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