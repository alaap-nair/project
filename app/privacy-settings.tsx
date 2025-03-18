import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { useUserStore } from '../store/user';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

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
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={showProfile ? '#007AFF' : '#f4f3f4'}
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
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={showNotes ? '#007AFF' : '#f4f3f4'}
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
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={showProgress ? '#007AFF' : '#f4f3f4'}
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
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={showFriends ? '#007AFF' : '#f4f3f4'}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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