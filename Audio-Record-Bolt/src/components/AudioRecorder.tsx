import React, { useState } from 'react';
import { Mic, Square, Save } from 'lucide-react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';

interface AudioRecorderProps {
  onRecordingComplete?: () => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete }) => {
  const { 
    isRecording, 
    recordingName, 
    setRecordingName, 
    startRecording, 
    stopRecording,
    error
  } = useAudioRecorder();
  
  const handleStartRecording = async () => {
    await startRecording();
  };
  
  const handleStopRecording = () => {
    stopRecording();
    if (onRecordingComplete) {
      onRecordingComplete();
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Record Audio</h2>
      
      <div className="mb-4">
        <label htmlFor="recording-name" className="block text-sm font-medium text-gray-700 mb-1">
          Recording Name
        </label>
        <input
          id="recording-name"
          type="text"
          value={recordingName}
          onChange={(e) => setRecordingName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter recording name"
          disabled={isRecording}
        />
      </div>
      
      <div className="flex justify-center space-x-4">
        {!isRecording ? (
          <button
            onClick={handleStartRecording}
            className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <Mic className="mr-2 h-5 w-5" />
            Start Recording
          </button>
        ) : (
          <button
            onClick={handleStopRecording}
            className="flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            <Square className="mr-2 h-5 w-5" />
            Stop Recording
          </button>
        )}
      </div>
      
      {isRecording && (
        <div className="mt-4 flex items-center justify-center">
          <div className="h-3 w-3 bg-red-600 rounded-full animate-pulse mr-2"></div>
          <span className="text-sm text-gray-600">Recording...</span>
        </div>
      )}
      
      {error && (
        <div className="mt-4 text-red-600 text-sm">
          {error}
        </div>
      )}
    </div>
  );
};