import { View, Text, TextInput, StyleSheet, Platform, ScrollView, Pressable } from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTasksStore, TaskPriority, TaskCategory } from '../store/tasks';
import { useSubjectsStore } from '../store/subjects';
import { REMINDER_TIMES } from '../services/notifications';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '../services/notifications';
import { format } from 'date-fns';

const PRIORITIES: TaskPriority[] = ['high', 'medium', 'low'];
const CATEGORIES: TaskCategory[] = ['study', 'assignment', 'exam', 'reading', 'project', 'other'];

const PRIORITY_COLORS = {
  high: '#FF3B30',
  medium: '#FF9500',
  low: '#34C759',
};

const CATEGORY_COLORS: Record<TaskCategory, string> = {
  study: '#5856D6',
  assignment: '#007AFF',
  exam: '#FF2D55',
  reading: '#4CD964',
  project: '#FF9500',
  other: '#8E8E93',
};

export default function TaskCreateForm({ onSuccess, onCancel, subjectId: initialSubjectId }: { onSuccess?: () => void, onCancel?: () => void, subjectId?: string }) {
  const { addTask } = useTasksStore();
  const { subjects } = useSubjectsStore();
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
    if (initialSubjectId && typeof initialSubjectId === 'string') {
      const subject = subjects.find(s => s._id === initialSubjectId);
      if (subject) {
        setCategory('assignment');
      }
    }
  }, [initialSubjectId, subjects]);

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
      await addTask({
        title: title.trim(),
        description: description.trim(),
        priority,
        category,
        dueDate: dueDate.toISOString(),
        completed: false,
        reminderTime,
        subjectId: typeof initialSubjectId === 'string' ? initialSubjectId : null,
      });
      if (onSuccess) onSuccess();
    } catch (error: any) {
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

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDueDate(selectedDate);
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
        <Pressable onPress={() => setShowDatePicker(true)} style={styles.datePickerButton}>
          <Ionicons name="calendar-outline" size={20} color="#007AFF" />
          <Text style={styles.datePickerText}>{format(dueDate, 'PPP')}</Text>
        </Pressable>
        {showDatePicker && (
          <DateTimePicker
            value={dueDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}
        <View style={styles.buttonRow}>
          {onCancel && (
            <Pressable style={[styles.button, styles.cancelButton]} onPress={onCancel}>
              <Text style={styles.buttonText}>Cancel</Text>
            </Pressable>
          )}
          <Pressable style={[styles.button, styles.addButton]} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Add Task</Text>
          </Pressable>
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
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 16,
    color: '#333',
    backgroundColor: '#F9F9F9',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#F2F2F7',
  },
  optionButtonActive: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  optionText: {
    fontSize: 14,
    color: '#3C3C43',
  },
  optionTextActive: {
    fontWeight: '700',
    color: '#007AFF',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    marginBottom: 16,
  },
  datePickerText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 10,
  },
  addButton: {
    backgroundColor: '#007AFF',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 