import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, ScrollView } from 'react-native';
import { useSubjectsStore } from '../store/subjects';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const COLORS = [
  '#FF3B30', // Red
  '#FF9500', // Orange
  '#FFCC00', // Yellow
  '#34C759', // Green
  '#5856D6', // Purple
  '#007AFF', // Blue
  '#4A56E2', // Indigo
  '#AF52DE', // Pink
  '#000000', // Black
];

export default function AddSubjectScreen() {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { addSubject } = useSubjectsStore();

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Subject name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await addSubject({
        name: name.trim(),
        color: selectedColor,
      });
      router.back();
    } catch (err) {
      setError('Failed to create subject. Please try again.');
      console.error('Error creating subject:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Subject</Text>
        <TouchableOpacity 
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={styles.saveButton}
        >
          <Text style={[styles.saveButtonText, isSubmitting && styles.saveButtonTextDisabled]}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {error && (
          <Text style={styles.error}>{error}</Text>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Subject Name"
            placeholderTextColor="#666"
            autoFocus
          />
        </View>

        <Text style={styles.colorLabel}>Color</Text>
        <View style={styles.colorGrid}>
          {COLORS.map((color, index) => (
            <TouchableOpacity
              key={`${color}-${index}`}
              style={[
                styles.colorOption,
                { backgroundColor: color },
                selectedColor === color && styles.colorOptionSelected,
              ]}
              onPress={() => setSelectedColor(color)}
            >
              {selectedColor === color && (
                <Ionicons name="checkmark" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.preview}>
          <Text style={styles.previewLabel}>Preview</Text>
          <View style={[styles.subjectCard, { backgroundColor: selectedColor + '20' }]}>
            <View style={[styles.colorDot, { backgroundColor: selectedColor }]} />
            <Text style={styles.subjectName}>
              {name || 'Subject Name'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  closeButton: {
    padding: 8,
  },
  saveButton: {
    padding: 8,
  },
  saveButtonText: {
    color: '#007AFF',
    fontSize: 17,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    opacity: 0.5,
  },
  content: {
    padding: 16,
  },
  error: {
    color: '#FF3B30',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    fontSize: 17,
    color: '#000',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
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
  colorLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  preview: {
    marginTop: 8,
  },
  previewLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  subjectCard: {
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
  subjectName: {
    fontSize: 17,
    fontWeight: '500',
    color: '#000',
  },
}); 