import { Note } from '../store/notes';

interface Summary {
  keyPoints: string[];
  mainTakeaways: string[];
  wordCount: number;
}

export function summarizeNote(note: Note): Summary {
  // Split content into sentences
  const sentences = note.content
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  // Extract key points (sentences that are likely important)
  const keyPoints = sentences
    .filter(sentence => {
      // Look for sentences that:
      // 1. Start with important words
      // 2. Are shorter (likely to be key points)
      // 3. Contain important keywords
      const importantWords = ['important', 'key', 'note', 'remember', 'should', 'must', 'need'];
      const startsWithImportant = importantWords.some(word => 
        sentence.toLowerCase().startsWith(word)
      );
      const hasImportantKeywords = importantWords.some(word => 
        sentence.toLowerCase().includes(word)
      );
      return startsWithImportant || (hasImportantKeywords && sentence.length < 100);
    })
    .slice(0, 5); // Limit to top 5 key points

  // Generate main takeaways
  const mainTakeaways = sentences
    .filter(sentence => {
      // Look for longer, more detailed sentences that summarize concepts
      return sentence.length > 50 && !keyPoints.includes(sentence);
    })
    .slice(0, 3); // Limit to top 3 takeaways

  return {
    keyPoints,
    mainTakeaways,
    wordCount: note.content.split(/\s+/).length
  };
} 