import React from 'react';
import { AudioRecorderApp } from './components/AudioRecorderApp';
import { Mic } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center">
          <Mic className="h-8 w-8 text-blue-600 mr-3" />
          <h1 className="text-2xl font-bold text-gray-900">Audio Recorder & Transcriber</h1>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <AudioRecorderApp />
      </main>
      
      <footer className="bg-white mt-auto py-4 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            Audio Recorder & Transcriber App © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;