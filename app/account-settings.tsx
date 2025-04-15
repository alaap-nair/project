import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { useAuthStore } from '../store/auth';
import { useUserStore } from '../store/user';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export default function AccountSettingsScreen() {
  const { user } = useAuthStore();
  const { profile, updateProfile } = useUserStore();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('English');

  const handleUpdateProfile = async (data: any) => {
    try {
      await updateProfile(data);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete user data from Firestore
              await updateDoc(doc(db, 'users', user!.uid), {
                deleted: true,
                deletedAt: new Date(),
              });
              // Delete user account
              await user?.delete();
              router.replace('/login');
            } catch (error) {
              console.error('Error deleting account:', error);
              Alert.alert('Error', 'Failed to delete account');
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={28} color="#6949FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account Information</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={user?.email || ''}
              editable={false}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Display Name</Text>
            <TextInput
              style={styles.input}
              value={profile?.displayName || ''}
              onChangeText={(text) => handleUpdateProfile({ displayName: text })}
              placeholder="Enter your display name"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Email Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive notifications about your account via email
              </Text>
            </View>
            <Switch
              value={emailNotifications}
              onValueChange={setEmailNotifications}
              trackColor={{ false: '#767577', true: '#6949FF' }}
              thumbColor={emailNotifications ? '#fff' : '#f4f3f4'}
            />
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive push notifications on your device
              </Text>
            </View>
            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
              trackColor={{ false: '#767577', true: '#6949FF' }}
              thumbColor={pushNotifications ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Dark Mode</Text>
              <Text style={styles.settingDescription}>
                Enable dark mode for the app
              </Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={darkMode ? '#007AFF' : '#f4f3f4'}
            />
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Language</Text>
              <Text style={styles.settingDescription}>
                Choose your preferred language
              </Text>
            </View>
            <TouchableOpacity
              style={styles.languageButton}
              onPress={() => {
                // Show language selection modal
              }}
            >
              <Text style={styles.languageText}>{language}</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push('/privacy-settings')}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Privacy Settings</Text>
              <Text style={styles.settingDescription}>
                Manage your privacy preferences
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <TouchableOpacity
            style={[styles.settingItem, styles.dangerItem]}
            onPress={handleDeleteAccount}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, styles.dangerText]}>
                Delete Account
              </Text>
              <Text style={styles.settingDescription}>
                Permanently delete your account and all associated data
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#dc3545" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  placeholder: {
    width: 44, // Same width as back button for balanced centering
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  settingInfo: {
    flex: 1,
    marginRight: 10,
  },
  settingLabel: {
    fontSize: 16,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageText: {
    fontSize: 16,
    marginRight: 5,
  },
  dangerItem: {
    backgroundColor: '#fff5f5',
    borderRadius: 8,
    padding: 10,
  },
  dangerText: {
    color: '#dc3545',
  },
}); 