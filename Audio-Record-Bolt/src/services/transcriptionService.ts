import axios from 'axios';
import { Transcription, TranscriptionSegment } from '../types';

// This is a mock service that simulates AI transcription
// In a real application, you would connect to an actual transcription API
export const transcribeAudio = async (audioBlob: Blob): Promise<Transcription> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // For demo purposes, we'll create a fake transcription
  // In a real app, you would send the audio to a service like OpenAI Whisper API
  const fakeTranscription: Transcription = {
    text: "This is a simulated transcription of the audio recording. In a real application, this would be generated by an AI service like OpenAI's Whisper API. The transcription would accurately capture the spoken content with proper punctuation and formatting.",
    segments: [
      {
        id: 1,
        start: 0,
        end: 5.2,
        text: "This is a simulated transcription of the audio recording."
      },
      {
        id: 2,
        start: 5.2,
        end: 10.8,
        text: "In a real application, this would be generated by an AI service like OpenAI's Whisper API."
      },
      {
        id: 3,
        start: 10.8,
        end: 18.5,
        text: "The transcription would accurately capture the spoken content with proper punctuation and formatting."
      }
    ]
  };
  
  return fakeTranscription;
  
  // In a real implementation, you would do something like:
  /*
  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.wav');
  formData.append('model', 'whisper-1');
  
  const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'multipart/form-data'
    }
  });
  
  return response.data;
  */
};

// Helper function to format time in MM:SS format
export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};