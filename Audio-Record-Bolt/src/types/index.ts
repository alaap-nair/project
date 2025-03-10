export interface AudioRecording {
  id: string;
  name: string;
  audioUrl: string;
  audioData?: string; // Base64 encoded audio data for storage
  duration: number;
  createdAt: Date;
  transcription?: Transcription;
}

export interface Transcription {
  text: string;
  segments: TranscriptionSegment[];
}

export interface TranscriptionSegment {
  id: number;
  start: number;
  end: number;
  text: string;
}