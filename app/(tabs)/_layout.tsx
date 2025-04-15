import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import useNotesStore from '../../store/notes';

export default function TabLayout() {
  const { setShowCreateModal } = useNotesStore();

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          height: 60,
          paddingVertical: 0,
          backgroundColor: '#fff',
          borderTopWidth: 0,
          position: 'absolute',
          bottom: 20,
          left: 20,
          right: 20,
          borderRadius: 25,
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
    >
      <Tabs.Screen
        name="tasks"
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="subjects"
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="library" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="create"
        options={{
          tabBarButton: () => (
            <View style={styles.addButtonContainer}>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowCreateModal(true)}
              >
                <Ionicons name="add" size={32} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="document-text" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="person" size={24} color={color} />
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

