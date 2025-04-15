import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useSocialStore from '../store/social';
import { useAuthStore } from '../store/auth';
import { useRouter } from 'expo-router';

export default function FriendsScreen() {
  const { user } = useAuthStore();
  const {
    friends,
    loading,
    error,
    getFriends,
    removeFriend,
    sendFriendRequest,
  } = useSocialStore();
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (user) {
      getFriends();
    }
  }, [user]);

  const handleAddFriend = () => {
    Alert.prompt(
      'Add Friend',
      'Enter your friend\'s user ID:',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Send Request',
          onPress: async (userId) => {
            if (userId) {
              try {
                await sendFriendRequest(userId);
                Alert.alert('Success', 'Friend request sent successfully!');
              } catch (error) {
                Alert.alert('Error', error instanceof Error ? error.message : 'Failed to send friend request');
              }
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const handleRemoveFriend = (friendId: string) => {
    Alert.alert(
      'Remove Friend',
      'Are you sure you want to remove this friend?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFriend(friendId);
              Alert.alert('Success', 'Friend removed successfully!');
            } catch (error) {
              Alert.alert('Error', error instanceof Error ? error.message : 'Failed to remove friend');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Friends',
          headerRight: () => (
            <TouchableOpacity
              onPress={handleAddFriend}
              style={styles.headerButton}
            >
              <Ionicons name="person-add" size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
        }}
      />
      
      <View style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search friends..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : friends.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No friends yet</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddFriend}
            >
              <Text style={styles.addButtonText}>Add Friends</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={friends.filter(friend =>
              friend.toLowerCase().includes(searchQuery.toLowerCase())
            )}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <View style={styles.friendItem}>
                <View style={styles.friendInfo}>
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>{item[0]?.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.friendName}>{item}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleRemoveFriend(item)}
                  style={styles.removeButton}
                >
                  <Ionicons name="person-remove" size={24} color="#dc3545" />
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 35,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 30,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  backButton: {
    padding: 10,
    marginRight: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 15,
    borderRadius: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButton: {
    marginRight: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  friendName: {
    fontSize: 16,
    fontWeight: '500',
  },
  removeButton: {
    padding: 5,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#dc3545',
    fontSize: 16,
    textAlign: 'center',
  },
}); 