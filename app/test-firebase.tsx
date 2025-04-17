import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { auth } from '../config/firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';

export default function TestFirebase() {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      console.log('Auth state changed:', user ? user.email : 'No user');
    });

    return () => unsubscribe();
  }, []);

  const testSignIn = async () => {
    try {
      setError(null);
      // Replace with your test credentials
      await signInWithEmailAndPassword(auth, 'test@example.com', 'password123');
      console.log('Sign in successful');
    } catch (err: any) {
      setError(err.message);
      console.error('Sign in error:', err);
    }
  };

  const testSignOut = async () => {
    try {
      await signOut(auth);
      console.log('Sign out successful');
    } catch (err: any) {
      setError(err.message);
      console.error('Sign out error:', err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firebase Test</Text>
      
      <View style={styles.status}>
        <Text style={styles.label}>Current User:</Text>
        <Text style={styles.value}>{user ? user.email : 'Not signed in'}</Text>
      </View>

      {error && (
        <View style={styles.error}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.buttons}>
        <Button title="Sign In" onPress={testSignIn} />
        <Button title="Sign Out" onPress={testSignOut} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  status: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  value: {
    fontSize: 16,
    marginTop: 5,
  },
  error: {
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  errorText: {
    color: '#d32f2f',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
}); 