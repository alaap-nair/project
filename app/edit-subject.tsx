import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useSubjectsStore } from '../store/subjects';
import { Ionicons } from '@expo/vector-icons';

const COLORS = [
  '#FF3B30', '#FF9500', '#FFCC00', '#4CD964', '#5AC8FA', 
  '#007AFF', '#5856D6', '#FF2D55', '#8E8E93', '#34C759'
];

export default function EditSubjectScreen() {
  const { id } = useLocalSearchParams();
  const { subjects, updateSubject, loading } = useSubjectsStore();
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [nameError, setNameError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (subjects.length > 0 && id) {
      const subject = subjects.find(s => s._id === id);
      if (subject) {
        setName(subject.name);
        setSelectedColor(subject.color);
      } else {
        Alert.alert('Error', 'Subject not found');
        router.back();
      }
    }
  }, [subjects, id]);

  const handleUpdateSubject = async () => {
    // Validate input
    if (!name.trim()) {
      setNameError('Subject name is required');
      return;
    }
    
    if (!selectedColor) {
      Alert.alert('Error', 'Please select a color');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await updateSubject(id as string, {
        name: name.trim(),
        color: selectedColor
      });
      router.back();
    } catch (error) {
      console.error('Error updating subject:', error);
      Alert.alert('Error', 'Failed to update subject. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && !name) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Edit Subject',
          headerRight: () => (
            <TouchableOpacity 
              onPress={handleUpdateSubject}
              disabled={isSubmitting}
            >
              <Text style={[
                styles.saveButton, 
                isSubmitting && styles.saveButtonDisabled
              ]}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.form}>
        <Text style={styles.label}>Subject Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={(text) => {
            setName(text);
            setNameError('');
          }}
          placeholder="Enter subject name"
          autoCapitalize="words"
          autoFocus
        />
        {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

        <Text style={styles.label}>Color</Text>
        <View style={styles.colorGrid}>
          {COLORS.map((color, index) => (
            <TouchableOpacity
              key={`${color}-${index}`}
              style={[
                styles.colorOption,
                { backgroundColor: color },
                selectedColor === color && styles.selectedColorOption,
              ]}
              onPress={() => setSelectedColor(color)}
            >
              {selectedColor === color && (
                <Ionicons name="checkmark" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.previewSection}>
          <Text style={styles.previewLabel}>Preview</Text>
          <View style={[styles.previewCard, { backgroundColor: selectedColor + '20' }]}>
            <View style={[styles.colorDot, { backgroundColor: selectedColor }]} />
            <Text style={styles.previewText}>{name || 'Subject Name'}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.updateButton}
        onPress={handleUpdateSubject}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.updateButtonText}>Update Subject</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E1E1E1',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: -12,
    marginBottom: 16,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    margin: 8,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  selectedColorOption: {
    borderWidth: 2,
    borderColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  previewSection: {
    marginTop: 16,
  },
  previewLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  previewText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#000',
  },
  saveButton: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  updateButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
}); 