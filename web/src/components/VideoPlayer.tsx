import React, { useRef, useEffect, useState } from 'react';

interface VideoPlayerProps {
  videoUrl: string;
  onTimeUpdate: (time: number) => void;
  isPlaying: boolean;
  onPlayPause: () => void;
  children?: React.ReactNode; // Allow overlay as children
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  onTimeUpdate,
  isPlaying,
  onPlayPause,
  children,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch((err) => {
          console.error('Play error:', err);
          setError('Failed to play video');
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      onTimeUpdate(videoRef.current.currentTime);
    }
  };

  const handleLoadedData = () => {
    setIsLoaded(true);
    setError(null);
    console.log('Video loaded successfully');
  };

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.currentTarget;
    const errorCode = video.error?.code;
    const errorMessage = video.error?.message || 'Unknown error';
    console.error('Video error:', errorCode, errorMessage);
    setError(`Video error: ${errorMessage}`);
    setIsLoaded(false);
  };

  const handleClick = () => {
    onPlayPause();
  };

  return (
    <div className="relative w-full h-full bg-black">
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedData={handleLoadedData}
        onError={handleError}
        onCanPlay={() => console.log('Video can play')}
        onClick={handleClick}
        controls={false}
        playsInline
        muted={false}
      />
      {/* Render overlay children (DetectionOverlay) */}
      {children}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80">
          <div className="text-center p-4">
            <p className="text-red-500 mb-2">{error}</p>
            <p className="text-gray-400 text-sm">URL: {videoUrl}</p>
          </div>
        </div>
      )}
      {!isLoaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-white">Loading video...</div>
        </div>
      )}
      {isLoaded && !isPlaying && !error && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 bg-white bg-opacity-80 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-800 ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
