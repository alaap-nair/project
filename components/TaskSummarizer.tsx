import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, ScrollView, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTasksStore, TaskCategory, TaskPriority, TimeframeFilter, SummarizeOptions } from '../store/tasks';

export function TaskSummarizer() {
  const { summarizeTasks, summarizing, summary, clearSummary } = useTasksStore();
  const [filters, setFilters] = useState<SummarizeOptions>({
    timeframe: 'all',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSummarize = async () => {
    try {
      setLoading(true);
      setError(null);
      await summarizeTasks({
        category: filters.category === 'all' ? undefined : filters.category as TaskCategory,
        priority: filters.priority === 'all' ? undefined : filters.priority as TaskPriority,
        completed: filters.completed === undefined ? undefined : filters.completed === true,
        timeframe: filters.timeframe as TimeframeFilter,
      });
    } catch (error) {
      console.error('Error summarizing tasks:', error);
      setError('Failed to generate summary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!summary) return;
    
    try {
      await Share.share({
        message: summary,
        title: 'Task Summary',
      });
    } catch (error) {
      console.error('Error sharing summary:', error);
    }
  };

  const handleFilterChange = (key: keyof SummarizeOptions, value: any) => {
    setFilters(prev => {
      // If the value is the same as the current value, remove the filter
      if (prev[key] === value) {
        const newFilters = { ...prev };
        delete newFilters[key];
        return newFilters;
      }
      
      // Otherwise, set the new value
      return { ...prev, [key]: value };
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI Task Summary</Text>
      
      <View style={styles.filtersContainer}>
        <Text style={styles.filterTitle}>Timeframe:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {(['all', 'today', 'week', 'month'] as TimeframeFilter[]).map((timeframe) => (
            <Pressable
              key={timeframe}
              style={[
                styles.filterChip,
                filters.timeframe === timeframe && styles.activeFilterChip
              ]}
              onPress={() => handleFilterChange('timeframe', timeframe)}
            >
              <Text style={[
                styles.filterChipText,
                filters.timeframe === timeframe && styles.activeFilterChipText
              ]}>
                {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        
        <Text style={styles.filterTitle}>Priority:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {(['high', 'medium', 'low'] as TaskPriority[]).map((priority) => (
            <Pressable
              key={priority}
              style={[
                styles.filterChip,
                filters.priority === priority && styles.activeFilterChip
              ]}
              onPress={() => handleFilterChange('priority', priority)}
            >
              <Text style={[
                styles.filterChipText,
                filters.priority === priority && styles.activeFilterChipText
              ]}>
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        
        <Text style={styles.filterTitle}>Category:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {(['study', 'homework', 'exam', 'project', 'other'] as TaskCategory[]).map((category) => (
            <Pressable
              key={category}
              style={[
                styles.filterChip,
                filters.category === category && styles.activeFilterChip
              ]}
              onPress={() => handleFilterChange('category', category)}
            >
              <Text style={[
                styles.filterChipText,
                filters.category === category && styles.activeFilterChipText
              ]}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        
        <Text style={styles.filterTitle}>Status:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {[
            { label: 'Completed', value: true },
            { label: 'Pending', value: false }
          ].map((status) => (
            <Pressable
              key={status.label}
              style={[
                styles.filterChip,
                filters.completed === status.value && styles.activeFilterChip
              ]}
              onPress={() => handleFilterChange('completed', status.value)}
            >
              <Text style={[
                styles.filterChipText,
                filters.completed === status.value && styles.activeFilterChipText
              ]}>
                {status.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      
      <Pressable 
        style={styles.generateButton}
        onPress={handleSummarize}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="analytics-outline" size={20} color="#fff" />
            <Text style={styles.generateButtonText}>Generate Summary</Text>
          </>
        )}
      </Pressable>
      
      {summary && (
        <View style={styles.summaryContainer}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Summary</Text>
            <View style={styles.summaryActions}>
              <Pressable onPress={handleShare} style={styles.actionButton}>
                <Ionicons name="share-outline" size={20} color="#007AFF" />
              </Pressable>
              <Pressable onPress={clearSummary} style={styles.actionButton}>
                <Ionicons name="close-outline" size={20} color="#FF3B30" />
              </Pressable>
            </View>
          </View>
          <ScrollView style={styles.summaryContent}>
            <Text style={styles.summaryText}>{summary}</Text>
          </ScrollView>
        </View>
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
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  filterScroll: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 14,
    color: '#3C3C43',
  },
  activeFilterChipText: {
    color: '#fff',
  },
  generateButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  summaryContainer: {
    marginTop: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  summaryActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 4,
    marginLeft: 8,
  },
  summaryContent: {
    maxHeight: 200,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
  },
}); 