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
  Modal,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useSocialStore from '../store/social';
import { useAuthStore } from '../store/auth';

export default function ClassesScreen() {
  const { user } = useAuthStore();
  const {
    enrolledClasses,
    loading,
    error,
    getEnrolledClasses,
    createClass,
    joinClass,
    leaveClass,
  } = useSocialStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassDescription, setNewClassDescription] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (user) {
      getEnrolledClasses();
    }
  }, [user]);

  const handleCreateClass = async () => {
    if (!newClassName.trim()) {
      Alert.alert('Error', 'Please enter a class name');
      return;
    }

    try {
      await createClass(newClassName.trim(), newClassDescription.trim(), true);
      setShowCreateModal(false);
      setNewClassName('');
      setNewClassDescription('');
      Alert.alert('Success', 'Class created successfully!');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create class');
    }
  };

  const handleJoinClass = () => {
    Alert.prompt(
      'Join Class',
      'Enter the class enrollment code:',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Join',
          onPress: async (code) => {
            if (code) {
              try {
                await joinClass(code.trim().toUpperCase());
                Alert.alert('Success', 'Joined class successfully!');
              } catch (error) {
                Alert.alert('Error', error instanceof Error ? error.message : 'Failed to join class');
              }
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const handleLeaveClass = (classId: string, className: string) => {
    Alert.alert(
      'Leave Class',
      `Are you sure you want to leave ${className}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveClass(classId);
              Alert.alert('Success', 'Left class successfully!');
            } catch (error) {
              Alert.alert('Error', error instanceof Error ? error.message : 'Failed to leave class');
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
          title: 'Classes',
          headerRight: () => (
            <TouchableOpacity
              onPress={handleCreateClass}
              style={styles.headerButton}
            >
              <Ionicons name="add" size={24} color="#007AFF" />
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
              placeholder="Search classes..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : enrolledClasses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No classes yet</Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={styles.button}
                onPress={() => setShowCreateModal(true)}
              >
                <Text style={styles.buttonText}>Create Class</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={handleJoinClass}
              >
                <Text style={[styles.buttonText, styles.secondaryButtonText]}>Join Class</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <FlatList
            data={enrolledClasses.filter(classItem =>
              classItem.name.toLowerCase().includes(searchQuery.toLowerCase())
            )}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <View style={styles.classItem}>
                <View style={styles.classInfo}>
                  <Text style={styles.className}>{item.name}</Text>
                  <Text style={styles.classDescription} numberOfLines={2}>
                    {item.description || 'No description'}
                  </Text>
                  <View style={styles.classMetadata}>
                    <Text style={styles.classCode}>Code: {item.enrollmentCode}</Text>
                    <Text style={styles.classRole}>
                      {item.creatorId === user?.uid ? 'Creator' : 'Student'}
                    </Text>
                  </View>
                </View>
                {item.creatorId !== user?.uid && (
                  <TouchableOpacity
                    onPress={() => handleLeaveClass(item._id, item.name)}
                    style={styles.leaveButton}
                  >
                    <Ionicons name="exit" size={24} color="#dc3545" />
                  </TouchableOpacity>
                )}
              </View>
            )}
          />
        )}

        <Modal
          visible={showCreateModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowCreateModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Create New Class</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Class Name"
                value={newClassName}
                onChangeText={setNewClassName}
              />
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                placeholder="Class Description (optional)"
                value={newClassDescription}
                onChangeText={setNewClassDescription}
                multiline
                numberOfLines={4}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowCreateModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.createButton]}
                  onPress={handleCreateClass}
                >
                  <Text style={styles.createButtonText}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 15,
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
  buttonGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
  classItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  classInfo: {
    flex: 1,
    marginRight: 10,
  },
  className: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  classDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  classMetadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  classCode: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  classRole: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  leaveButton: {
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#007AFF',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 