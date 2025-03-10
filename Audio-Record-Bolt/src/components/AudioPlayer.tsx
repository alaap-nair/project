import React, { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Volume1, VolumeX } from 'lucide-react';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { formatTime } from '../services/transcriptionService';

interface AudioPlayerProps {
  audioUrl: string;
  duration: number;
  currentSegmentId?: number;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  audioUrl, 
  duration,
  currentSegmentId
}) => {
  const {
    isPlaying,
    currentTime,
    volume,
    playbackRate,
    togglePlay,
    seek,
    skipForward,
    skipBackward,
    changeVolume,
    changePlaybackRate
  } = useAudioPlayer(audioUrl, duration);
  
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    seek(time);
  };
  
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    changeVolume(newVolume);
  };
  
  const getVolumeIcon = () => {
    if (volume === 0) return <VolumeX className="h-5 w-5" />;
    if (volume < 0.5) return <Volume1 className="h-5 w-5" />;
    return <Volume2 className="h-5 w-5" />;
  };
  
  return (
    <div className="bg-gray-100 p-4 rounded-lg">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">{formatTime(currentTime)}</span>
          <span className="text-sm text-gray-600">{formatTime(duration)}</span>
        </div>
        
        <input
          type="range"
          min="0"
          max={duration}
          step="0.01"
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
        />
        
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={skipBackward}
              className="p-2 rounded-full hover:bg-gray-200 focus:outline-none"
              aria-label="Skip backward 10 seconds"
            >
              <SkipBack className="h-5 w-5" />
            </button>
            
            <button
              onClick={togglePlay}
              className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
            
            <button
              onClick={skipForward}
              className="p-2 rounded-full hover:bg-gray-200 focus:outline-none"
              aria-label="Skip forward 10 seconds"
            >
              <SkipForward className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex items-center space-x-2 relative">
            <button
              onClick={() => setShowVolumeControl(!showVolumeControl)}
              className="p-2 rounded-full hover:bg-gray-200 focus:outline-none"
              aria-label="Volume control"
            >
              {getVolumeIcon()}
            </button>
            
            {showVolumeControl && (
              <div className="absolute bottom-10 right-0 bg-white p-2 rounded-md shadow-md">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-24 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}
            
            <select
              value={playbackRate}
              onChange={(e) => changePlaybackRate(parseFloat(e.target.value))}
              className="bg-gray-200 text-sm rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="0.5">0.5x</option>
              <option value="1">1x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2x</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};