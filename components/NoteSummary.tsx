import { View, Text, StyleSheet } from 'react-native';
import { Note } from '../store/notes';
import { summarizeNote } from '../utils/summarizer';

interface NoteSummaryProps {
  note: Note;
}

export function NoteSummary({ note }: NoteSummaryProps) {
  const summary = summarizeNote(note);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Key Points</Text>
      {summary.keyPoints.map((point, index) => (
        <View key={index} style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.text}>{point}</Text>
        </View>
      ))}

      <Text style={[styles.sectionTitle, styles.takeawaysTitle]}>Main Takeaways</Text>
      {summary.mainTakeaways.map((takeaway, index) => (
        <View key={index} style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.text}>{takeaway}</Text>
        </View>
      ))}

      <Text style={styles.wordCount}>Word count: {summary.wordCount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1C1C1E',
  },
  takeawaysTitle: {
    marginTop: 16,
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  bullet: {
    fontSize: 16,
    marginRight: 8,
    color: '#007AFF',
  },
  text: {
    fontSize: 14,
    color: '#3C3C43',
    flex: 1,
    lineHeight: 20,
  },
  wordCount: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 16,
    textAlign: 'right',
  },
}); 