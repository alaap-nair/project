import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useUserStore } from '../store/user';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function PrivacySettingsScreen() {
  const { profile, updateProfile } = useUserStore();
  const [showProfile, setShowProfile] = useState(profile?.privacy?.showProfile ?? true);
  const [showNotes, setShowNotes] = useState(profile?.privacy?.showNotes ?? false);
  const [showProgress, setShowProgress] = useState(profile?.privacy?.showProgress ?? true);
  const [showFriends, setShowFriends] = useState(profile?.privacy?.showFriends ?? true);

  const handlePrivacyUpdate = async (key: string, value: boolean) => {
    try {
      await updateProfile({
        privacy: {
          ...profile?.privacy,
          [key]: value,
        },
      });
      Alert.alert('Success', 'Privacy settings updated successfully');
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      Alert.alert('Error', 'Failed to update privacy settings');
    }
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
        <Text style={styles.headerTitle}>Profile Visibility</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Visibility</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Show Profile</Text>
              <Text style={styles.settingDescription}>
                Allow other users to view your profile information
              </Text>
            </View>
            <Switch
              value={showProfile}
              onValueChange={(value) => {
                setShowProfile(value);
                handlePrivacyUpdate('showProfile', value);
              }}
              trackColor={{ false: '#767577', true: '#6949FF' }}
              thumbColor={showProfile ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Content Sharing</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Show Notes</Text>
              <Text style={styles.settingDescription}>
                Allow other users to view your study notes
              </Text>
            </View>
            <Switch
              value={showNotes}
              onValueChange={(value) => {
                setShowNotes(value);
                handlePrivacyUpdate('showNotes', value);
              }}
              trackColor={{ false: '#767577', true: '#6949FF' }}
              thumbColor={showNotes ? '#fff' : '#f4f3f4'}
            />
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Show Progress</Text>
              <Text style={styles.settingDescription}>
                Allow other users to view your study progress and achievements
              </Text>
            </View>
            <Switch
              value={showProgress}
              onValueChange={(value) => {
                setShowProgress(value);
                handlePrivacyUpdate('showProgress', value);
              }}
              trackColor={{ false: '#767577', true: '#6949FF' }}
              thumbColor={showProgress ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Social Settings</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Show Friends</Text>
              <Text style={styles.settingDescription}>
                Allow other users to see your friend list
              </Text>
            </View>
            <Switch
              value={showFriends}
              onValueChange={(value) => {
                setShowFriends(value);
                handlePrivacyUpdate('showFriends', value);
              }}
              trackColor={{ false: '#767577', true: '#6949FF' }}
              thumbColor={showFriends ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Export Data</Text>
              <Text style={styles.settingDescription}>
                Download a copy of your personal data
              </Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Delete Data</Text>
              <Text style={styles.settingDescription}>
                Permanently delete all your personal data
              </Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </View>
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
  arrow: {
    fontSize: 20,
    color: '#666',
  },
}); 