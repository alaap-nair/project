import { View, Text, StyleSheet, Switch, Platform, Pressable, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTasksStore } from '../store/tasks';

export function CalendarSettings() {
  const { 
    calendarSyncEnabled, 
    toggleCalendarSync, 
    initializeCalendarSync,
    calendarSyncError,
    calendarSyncRetrying,
    retryCalendarSync,
    clearCalendarSyncError
  } = useTasksStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleSync = async () => {
    setIsLoading(true);
    try {
      if (!calendarSyncEnabled) {
        await initializeCalendarSync();
      } else {
        await toggleCalendarSync();
      }
    } catch (error) {
      console.error('Error toggling calendar sync:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = async () => {
    await retryCalendarSync();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="calendar" size={24} color="#007AFF" />
        <Text style={styles.title}>Calendar Sync</Text>
      </View>

      <View style={styles.settingRow}>
        <View>
          <Text style={styles.settingLabel}>
            Sync tasks with {Platform.OS === 'ios' ? 'Apple' : 'Google'} Calendar
          </Text>
          <Text style={styles.settingDescription}>
            Tasks will automatically appear in your calendar
          </Text>
        </View>
        <Switch
          value={calendarSyncEnabled}
          onValueChange={handleToggleSync}
          disabled={isLoading || calendarSyncRetrying}
          trackColor={{ false: '#D1D1D6', true: '#007AFF50' }}
          thumbColor={calendarSyncEnabled ? '#007AFF' : '#FFFFFF'}
        />
      </View>

      {(isLoading || calendarSyncRetrying) && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.loadingText}>
            {calendarSyncRetrying ? 'Retrying sync...' : 'Setting up calendar sync...'}
          </Text>
        </View>
      )}

      {calendarSyncError && (
        <View style={styles.errorContainer}>
          <View style={styles.errorHeader}>
            <Ionicons name="alert-circle" size={20} color="#FF3B30" />
            <Text style={styles.errorTitle}>Sync Error</Text>
          </View>
          <Text style={styles.errorText}>{calendarSyncError}</Text>
          <View style={styles.errorActions}>
            <Pressable 
              style={styles.retryButton} 
              onPress={handleRetry}
              disabled={calendarSyncRetrying}
            >
              <Ionicons name="refresh" size={16} color="#FFFFFF" />
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
            <Pressable 
              style={styles.dismissButton} 
              onPress={clearCalendarSyncError}
            >
              <Text style={styles.dismissButtonText}>Dismiss</Text>
            </Pressable>
          </View>
        </View>
      )}

      {calendarSyncEnabled && !calendarSyncError && (
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle" size={20} color="#8E8E93" />
          <Text style={styles.infoText}>
            Changes to tasks will automatically sync with your calendar. Completed tasks will be removed from the calendar.
          </Text>
        </View>
      )}

      {!calendarSyncEnabled && Platform.OS === 'android' && !calendarSyncError && (
        <Pressable
          style={styles.googleSignInButton}
          onPress={handleToggleSync}
          disabled={isLoading || calendarSyncRetrying}
        >
          <Ionicons name="logo-google" size={20} color="#FFFFFF" />
          <Text style={styles.googleSignInText}>Sign in with Google</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    color: '#1C1C1E',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: '#1C1C1E',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#8E8E93',
    maxWidth: '80%',
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  googleSignInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4285F4',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    gap: 8,
  },
  googleSignInText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginBottom: 12,
  },
  errorActions: {
    flexDirection: 'row',
    gap: 12,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  dismissButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dismissButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '500',
  },
}); 