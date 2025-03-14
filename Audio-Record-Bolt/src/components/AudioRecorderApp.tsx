import React, { useState } from 'react';
import { AudioRecorder } from './AudioRecorder';
import { RecordingsList } from './RecordingsList';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { Save } from 'lucide-react';

export const AudioRecorderApp: React.FC = () => {
  const { 
    recordings, 
    deleteRecording, 
    updateRecordingName,
    saveTranscription,
    saveAllRecordings
  } = useAudioRecorder();
  
  const [activeTab, setActiveTab] = useState<'record' | 'recordings'>('record');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  
  const handleSaveAll = () => {
    const success = saveAllRecordings();
    
    if (success) {
      setSaveStatus('Saved successfully!');
    } else {
      setSaveStatus('Failed to save. Try again.');
    }
    
    setTimeout(() => setSaveStatus(null), 3000);
  };
  
  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
              activeTab === 'record'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('record')}
          >
            Record
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
              activeTab === 'recordings'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('recordings')}
          >
            Recordings {recordings.length > 0 && `(${recordings.length})`}
          </button>
        </div>
        
        {recordings.length > 0 && (
          <div className="flex items-center">
            {saveStatus && (
              <span className={`mr-3 text-sm ${saveStatus.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>
                {saveStatus}
              </span>
            )}
            <button
              onClick={handleSaveAll}
              className="flex items-center justify-center px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-sm"
            >
              <Save className="mr-1 h-4 w-4" />
              Save All
            </button>
          </div>
        )}
      </div>
      
      {activeTab === 'record' ? (
        <AudioRecorder onRecordingComplete={() => setActiveTab('recordings')} />
      ) : (
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Recordings</h2>
          <RecordingsList 
            recordings={recordings}
            onDelete={deleteRecording}
            onRename={updateRecordingName}
            onTranscribe={saveTranscription}
          />
        </div>
      )}
    </div>
  );
};