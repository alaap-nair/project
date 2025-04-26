import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import useNotesStore from '../../store/notes';
import { useAuthStore } from '../../store/auth';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';

export default function TabLayout() {
  const { setShowCreateModal } = useNotesStore();
  const { user, isAuthReady } = useAuthStore();
  const [activeTab, setActiveTab] = useState('index');

  useEffect(() => {
    if (isAuthReady && !user) {
      router.replace('/(auth)/login');
    }
  }, [isAuthReady, user]);

  if (!user) return null;

  const handleAddPress = () => {
    if (activeTab === 'tasks') {
      // Create note
      setShowCreateModal(true);
    } else {
      // Create task
      router.push('/new-task');
    }
  };

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          height: 60,
          paddingBottom: 0,
          backgroundColor: '#fff',
          borderTopWidth: 0,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 5,
        },
        tabBarShowLabel: false,
        tabBarItemStyle: {
          height: 60,
          paddingVertical: 0,
        },
        headerShown: false,
      }}
      screenListeners={{
        tabPress: (e) => {
          setActiveTab(e.target.split('-')[0]); // Update active tab
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Notes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="subjects"
        options={{
          title: 'Subjects',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="library-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="add"
        options={{
          tabBarButton: () => (
            <View style={styles.addButtonContainer}>
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddPress}
              >
                <Ionicons name="add" size={32} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkbox-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  addButtonContainer: {
    position: 'absolute',
    backgroundColor: 'transparent',
    alignItems: 'center',
    width: 70,
    height: 70,
    top: -20,
  },
  addButton: {
    width: 60,
    height: 60,
    backgroundColor: '#007AFF',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

