import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/auth';

export default function HomeScreen() {
  const { user } = useAuthStore();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>
          {user ? `Welcome back, ${user.displayName || 'User'}!` : 'Welcome to Bolt Notes'}
        </Text>
        <Text style={styles.subtitle}>Your all-in-one study companion</Text>
      </View>

      <View style={styles.grid}>
        <Link href="/(tabs)/subjects" asChild>
          <TouchableOpacity style={styles.card}>
            <Ionicons name="book" size={32} color="#007AFF" />
            <Text style={styles.cardTitle}>Subjects</Text>
            <Text style={styles.cardDescription}>
              Organize your notes by subject
            </Text>
          </TouchableOpacity>
        </Link>

        <Link href="/(tabs)/tasks" asChild>
          <TouchableOpacity style={styles.card}>
            <Ionicons name="checkmark-circle" size={32} color="#34C759" />
            <Text style={styles.cardTitle}>Tasks</Text>
            <Text style={styles.cardDescription}>
              Manage your study tasks
            </Text>
          </TouchableOpacity>
        </Link>

        <Link href="/(tabs)/profile" asChild>
          <TouchableOpacity style={styles.card}>
            <Ionicons name="person" size={32} color="#5856D6" />
            <Text style={styles.cardTitle}>Profile</Text>
            <Text style={styles.cardDescription}>
              View your progress and settings
            </Text>
          </TouchableOpacity>
        </Link>

        <Link href="/account-settings" asChild>
          <TouchableOpacity style={styles.card}>
            <Ionicons name="settings" size={32} color="#FF9500" />
            <Text style={styles.cardTitle}>Settings</Text>
            <Text style={styles.cardDescription}>
              Customize your experience
            </Text>
          </TouchableOpacity>
        </Link>
      </View>

      {!user && (
        <View style={styles.authSection}>
          <Text style={styles.authTitle}>Get Started</Text>
          <View style={styles.authButtons}>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity style={styles.authButton}>
                <Text style={styles.authButtonText}>Login</Text>
              </TouchableOpacity>
            </Link>
            <Link href="/(auth)/signup" asChild>
              <TouchableOpacity style={[styles.authButton, styles.signupButton]}>
                <Text style={[styles.authButtonText, styles.signupButtonText]}>Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#f8f8f8',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 16,
  },
  card: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
    color: '#000',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
  },
  authSection: {
    padding: 20,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  authTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#000',
  },
  authButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  authButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  authButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signupButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  signupButtonText: {
    color: '#007AFF',
  },
}); 