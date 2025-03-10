import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, FileText } from 'lucide-react';
import { AudioRecording } from '../types';
import { AudioPlayer } from './AudioPlayer';
import { formatTime } from '../services/transcriptionService';
import { transcribeAudio } from '../services/transcriptionService';

interface RecordingsListProps {
  recordings: AudioRecording[];
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onTranscribe: (id: string, transcription: any) => void;
}

export const RecordingsList: React.FC<RecordingsListProps> = ({
  recordings,
  onDelete,
  onRename,
  onTranscribe
}) => {
  const [expandedRecording, setExpandedRecording] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isTranscribing, setIsTranscribing] = useState<string | null>(null);
  const [currentSegmentId, setCurrentSegmentId] = useState<number | undefined>(undefined);
  const [processedRecordings, setProcessedRecordings] = useState<{[key: string]: boolean}>({});
  
  // Restore audio URLs from base64 data when component mounts or recordings change
  useEffect(() => {
    recordings.forEach(recording => {
      // Only process recordings we haven't processed yet
      if (!processedRecordings[recording.id] && recording.audioData && (!recording.audioUrl || !recording.audioUrl.startsWith('blob:'))) {
        try {
          console.log(`Processing recording: ${recording.id}`);
          
          // Create a new blob URL from the stored base64 data
          const parts = recording.audioData.split(',');
          if (parts.length < 2) {
            console.error('Invalid audioData format for recording:', recording.id);
            return;
          }
          
          const byteString = atob(parts[1]);
          const mimeString = parts[0].split(':')[1]?.split(';')[0] || 'audio/wav';
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          
          const blob = new Blob([ab], { type: mimeString });
          const audioUrl = URL.createObjectURL(blob);
          
          // Update the recording with the new URL
          recording.audioUrl = audioUrl;
          
          // Mark this recording as processed
          setProcessedRecordings(prev => ({
            ...prev,
            [recording.id]: true
          }));
          
          console.log(`Successfully processed recording: ${recording.id}`);
        } catch (error) {
          console.error('Error processing audio data for recording:', recording.id, error);
        }
      }
    });
  }, [recordings, processedRecordings]);
  
  const handleExpand = (id: string) => {
    setExpandedRecording(expandedRecording === id ? null : id);
  };
  
  const startEditing = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
  };
  
  const saveEdit = () => {
    if (editingId && editName.trim()) {
      onRename(editingId, editName);
      setEditingId(null);
    }
  };
  
  const cancelEdit = () => {
    setEditingId(null);
  };
  
  const handleTranscribe = async (id: string, audioUrl: string) => {
    try {
      setIsTranscribing(id);
      
      // Fetch the audio blob from the URL
      const response = await fetch(audioUrl);
      const audioBlob = await response.blob();
      
      // Send for transcription
      const transcription = await transcribeAudio(audioBlob);
      
      // Save the transcription
      onTranscribe(id, transcription);
      
    } catch (error) {
      console.error('Transcription error:', error);
    } finally {
      setIsTranscribing(null);
    }
  };
  
  if (recordings.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No recordings yet. Start recording to see your files here.
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {recordings.map((recording) => (
        <div key={recording.id} className="bg-white rounded-lg shadow-md overflow-hidden">
          <div 
            className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
            onClick={() => handleExpand(recording.id)}
          >
            <div className="flex items-center">
              {editingId === recording.id ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit();
                    if (e.key === 'Escape') cancelEdit();
                  }}
                  className="border border-gray-300 rounded px-2 py-1 mr-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
              ) : (
                <h3 className="font-medium text-lg">{recording.name}</h3>
              )}
              <span className="ml-2 text-sm text-gray-500">
                {formatTime(recording.duration)}
              </span>
            </div>
            
            <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
              {editingId === recording.id ? (
                <>
                  <button
                    onClick={saveEdit}
                    className="text-blue-600 hover:text-blue-800 p-1"
                  >
                    Save
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="text-gray-600 hover:text-gray-800 p-1"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => startEditing(recording.id, recording.name)}
                    className="text-gray-600 hover:text-gray-800 p-1"
                    aria-label="Rename recording"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(recording.id);
                    }}
                    className="text-red-600 hover:text-red-800 p-1"
                    aria-label="Delete recording"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>
          
          {expandedRecording === recording.id && (
            <div className="p-4 border-t border-gray-200">
              {recording.audioUrl ? (
                <AudioPlayer 
                  audioUrl={recording.audioUrl} 
                  duration={recording.duration}
                  currentSegmentId={currentSegmentId}
                />
              ) : (
                <div className="bg-yellow-50 p-4 rounded-md text-yellow-800">
                  Audio playback unavailable. The audio data may be corrupted.
                </div>
              )}
              
              <div className="mt-4">
                {!recording.transcription && recording.audioUrl && (
                  <button
                    onClick={() => handleTranscribe(recording.id, recording.audioUrl)}
                    disabled={isTranscribing === recording.id}
                    className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
                  >
                    <FileText className="mr-2 h-5 w-5" />
                    {isTranscribing === recording.id ? 'Transcribing...' : 'Transcribe Recording'}
                  </button>
                )}
                
                {recording.transcription && (
                  <div className="mt-4">
                    <h4 className="font-medium text-lg mb-2">Transcription</h4>
                    <div className="bg-gray-50 p-4 rounded-md">
                      {recording.transcription.segments.map((segment) => (
                        <div 
                          key={segment.id}
                          className={`mb-2 p-2 rounded ${currentSegmentId === segment.id ? 'bg-blue-100' : ''}`}
                          onClick={() => {
                            setCurrentSegmentId(segment.id);
                            // Find the recording in the expanded state and seek to this segment's start time
                          }}
                        >
                          <div className="text-sm text-gray-500 mb-1">
                            {formatTime(segment.start)} - {formatTime(segment.end)}
                          </div>
                          <p>{segment.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};