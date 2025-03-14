import { View, Text, TextInput, StyleSheet, Platform, ScrollView, Pressable } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTasksStore, TaskPriority, TaskCategory } from '../store/tasks';
import { REMINDER_TIMES } from '../services/notifications';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '../services/notifications';

const PRIORITIES: TaskPriority[] = ['high', 'medium', 'low'];
const CATEGORIES: TaskCategory[] = ['study', 'homework', 'exam', 'project', 'other'];

const PRIORITY_COLORS = {
  high: '#FF3B30',
  medium: '#FF9500',
  low: '#34C759',
};

const CATEGORY_COLORS = {
  study: '#5856D6',
  homework: '#007AFF',
  exam: '#FF2D55',
  project: '#FF9500',
  other: '#8E8E93',
};

export default function NewTaskScreen() {
  const { addTask } = useTasksStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [category, setCategory] = useState<TaskCategory>('other');
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [reminderTime, setReminderTime] = useState<number | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    checkNotificationPermissions();
  }, []);

  const checkNotificationPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await Notifications.getPermissionsAsync();
      setNotificationsEnabled(status === 'granted');
    }
  };

  const requestNotificationPermissions = async () => {
    if (Platform.OS !== 'web') {
      const token = await registerForPushNotificationsAsync();
      setNotificationsEnabled(!!token);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert('Please enter a task title');
      return;
    }

    try {
      console.log('Creating task with deadline:', dueDate.toISOString());
      
      await addTask({
        title: title.trim(),
        description: description.trim(),
        priority,
        category,
        deadline: dueDate.toISOString(),
        completed: false,
        reminderTime,
      });

      router.back();
    } catch (error: any) {
      console.error('Error creating task:', error);
      
      // Show a more detailed error message
      let errorMessage = 'Failed to create task. Please try again.';
      
      if (error.message) {
        if (error.message.includes('Network Error')) {
          errorMessage = 'Network error: Could not connect to the server. Please check your internet connection and make sure the backend server is running.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      alert(errorMessage);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Task title"
          placeholderTextColor="#8E8E93"
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Task description"
          placeholderTextColor="#8E8E93"
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Priority</Text>
        <View style={styles.optionsContainer}>
          {PRIORITIES.map((p) => (
            <Pressable
              key={p}
              style={[
                styles.optionButton,
                { backgroundColor: PRIORITY_COLORS[p] + '20' },
                priority === p && styles.optionButtonActive,
              ]}
              onPress={() => setPriority(p)}
            >
              <View
                style={[
                  styles.colorDot,
                  { backgroundColor: PRIORITY_COLORS[p] },
                ]}
              />
              <Text
                style={[
                  styles.optionText,
                  { color: PRIORITY_COLORS[p] },
                  priority === p && styles.optionTextActive,
                ]}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Category</Text>
        <View style={styles.optionsContainer}>
          {CATEGORIES.map((c) => (
            <Pressable
              key={c}
              style={[
                styles.optionButton,
                { backgroundColor: CATEGORY_COLORS[c] + '20' },
                category === c && styles.optionButtonActive,
              ]}
              onPress={() => setCategory(c)}
            >
              <Text
                style={[
                  styles.optionText,
                  { color: CATEGORY_COLORS[c] },
                  category === c && styles.optionTextActive,
                ]}
              >
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Due Date</Text>
        <Pressable
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar" size={20} color="#007AFF" />
          <Text style={styles.dateButtonText}>
            {dueDate.toLocaleDateString()}
          </Text>
        </Pressable>

        {showDatePicker && (
          <DateTimePicker
            value={dueDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                setDueDate(selectedDate);
              }
            }}
          />
        )}

        <Text style={styles.label}>Reminder</Text>
        {!notificationsEnabled ? (
          <Pressable
            style={styles.enableNotificationsButton}
            onPress={requestNotificationPermissions}
          >
            <Ionicons name="notifications-off" size={20} color="#FF3B30" />
            <Text style={styles.enableNotificationsText}>
              Enable notifications to set reminders
            </Text>
          </Pressable>
        ) : (
          <View style={styles.optionsContainer}>
            <Pressable
              style={[
                styles.optionButton,
                !reminderTime && styles.optionButtonActive,
              ]}
              onPress={() => setReminderTime(null)}
            >
              <Text
                style={[
                  styles.optionText,
                  !reminderTime && styles.optionTextActive,
                ]}
              >
                None
              </Text>
            </Pressable>
            {REMINDER_TIMES.map((time) => (
              <Pressable
                key={time.value}
                style={[
                  styles.optionButton,
                  reminderTime === time.value && styles.optionButtonActive,
                ]}
                onPress={() => setReminderTime(time.value)}
              >
                <Text
                  style={[
                    styles.optionText,
                    reminderTime === time.value && styles.optionTextActive,
                  ]}
                >
                  {time.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        <Pressable
          style={[styles.submitButton, !title.trim() && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!title.trim()}
        >
          <Text style={styles.submitButtonText}>Create Task</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3C3C43',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  optionButtonActive: {
    borderWidth: 1,
    borderColor: 'currentColor',
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  optionTextActive: {
    fontWeight: '600',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  dateButtonText: {
    fontSize: 16,
    color: '#000',
    marginLeft: 8,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: {
    backgroundColor: '#007AFF80',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  enableNotificationsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  enableNotificationsText: {
    marginLeft: 8,
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '500',
  },
}); 