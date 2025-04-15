import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useAuthStore } from '../../store/auth';
import { useUserStore } from '../../store/user';
import useSocialStore from '../../store/social';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();
  const { profile, isLoading: profileLoading, error: profileError, fetchProfile } = useUserStore();
  const { 
    friends, 
    enrolledClasses, 
    friendRequests,
    loading: socialLoading, 
    error: socialError,
    getFriends,
    getFriendRequests,
    getEnrolledClasses
  } = useSocialStore();
  const [calendarSync, setCalendarSync] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile(user);
      getFriends();
      getFriendRequests();
      getEnrolledClasses();
    }
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (profileLoading || socialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (profileError || socialError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{profileError || socialError}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {profile?.photoURL ? (
            <Image
              source={{ uri: profile.photoURL }}
              style={styles.avatar}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {profile?.displayName?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.name}>{profile?.displayName || 'User'}</Text>
        <Text style={styles.email}>{profile?.email || ''}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Classmates</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{friends.length}</Text>
            <Text style={styles.statLabel}>Friends</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{enrolledClasses.length}</Text>
            <Text style={styles.statLabel}>Classes</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{friendRequests.length}</Text>
            <Text style={styles.statLabel}>Pending Requests</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Social</Text>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => router.push('/friends')}
        >
          <View style={styles.settingInfo}>
            <Ionicons name="people-outline" size={24} color="#666" />
            <Text style={styles.settingLabel}>Friends</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => router.push('/classes')}
        >
          <View style={styles.settingInfo}>
            <Ionicons name="school-outline" size={24} color="#666" />
            <Text style={styles.settingLabel}>My Classes</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
        {friendRequests.length > 0 && (
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push('/friend-requests')}
          >
            <View style={styles.settingInfo}>
              <Ionicons name="person-add-outline" size={24} color="#666" />
              <Text style={styles.settingLabel}>Friend Requests</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{friendRequests.length}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Settings</Text>
        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Ionicons name="calendar" size={24} color="#666" />
            <View>
              <Text style={styles.settingText}>Sync with Apple Calendar</Text>
              <Text style={styles.settingDescription}>Tasks will automatically appear{'\n'}in your calendar</Text>
            </View>
          </View>
          <Switch
            value={calendarSync}
            onValueChange={setCalendarSync}
            trackColor={{ false: '#767577', true: '#6949FF' }}
            thumbColor={calendarSync ? '#fff' : '#f4f3f4'}
          />
        </View>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => router.push('/account-settings')}
        >
          <View style={styles.settingInfo}>
            <Ionicons name="person-outline" size={24} color="#666" />
            <Text style={styles.settingLabel}>Account Settings</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => router.push('/privacy-settings')}
        >
          <View style={styles.settingInfo}>
            <Ionicons name="shield-outline" size={24} color="#666" />
            <Text style={styles.settingLabel}>Privacy Settings</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="help-circle-outline" size={24} color="#666" />
            <Text style={styles.settingLabel}>Help & Support</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="information-circle-outline" size={24} color="#666" />
            <Text style={styles.settingLabel}>About</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.signOutButton}
        onPress={handleSignOut}
      >
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 16,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 8,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    marginLeft: 12,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 16,
    maxWidth: '80%',
  },
  settingText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 2,
    flexShrink: 1,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    flexShrink: 1,
  },
  signOutButton: {
    margin: 20,
    padding: 15,
    backgroundColor: '#dc3545',
    borderRadius: 8,
    alignItems: 'center',
  },
  signOutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
}); 