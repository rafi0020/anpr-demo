import React from 'react';
import { StoryData } from '@/types';

interface StoryTimelineProps {
  storyData: StoryData;
  currentTime: number; // in milliseconds
  onSeek: (timeMs: number) => void;
}

const StoryTimeline: React.FC<StoryTimelineProps> = ({
  storyData,
  currentTime,
  onSeek,
}) => {
  const totalDuration = storyData.metadata.duration;
  const currentSegment = storyData.segments.find(
    segment => currentTime >= segment.startMs && currentTime <= segment.endMs
  );

  const handleTimelineClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = clickX / rect.width;
    const timeMs = percentage * totalDuration;
    onSeek(timeMs);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        Story Timeline
      </h3>

      {/* Current Segment Info */}
      {currentSegment && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-blue-900 dark:text-blue-100">
              {currentSegment.title}
            </h4>
            <span className="text-sm text-blue-700 dark:text-blue-300">
              {Math.floor(currentSegment.startMs / 1000)}s - {Math.floor(currentSegment.endMs / 1000)}s
            </span>
          </div>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            {currentSegment.narration}
          </p>
          {currentSegment.expectedActions && (
            <div className="mt-2">
              <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                System Actions:
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {currentSegment.expectedActions.map((action, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded"
                  >
                    {action}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Timeline Visualization */}
      <div className="relative overflow-hidden">
        <div
          className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer relative overflow-hidden"
          onClick={handleTimelineClick}
        >
          {/* Progress bar */}
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-100"
            style={{ width: `${Math.min((currentTime / totalDuration) * 100, 100)}%` }}
          />

          {/* Segment markers */}
          {storyData.segments.map((segment, index) => {
            const position = (segment.startMs / totalDuration) * 100;
            const isCurrent = currentSegment?.startMs === segment.startMs;

            return (
              <div
                key={index}
                className={`absolute top-0 w-1 h-4 transform -translate-x-1/2 -translate-y-1/2 rounded ${
                  isCurrent ? 'bg-red-500' : 'bg-gray-400'
                } left-[${position}%]`}
                title={`${segment.title} (${Math.floor(segment.startMs / 1000)}s)`}
              />
            );
          })}
        </div>

        {/* Time labels */}
        <div className="flex justify-between mt-2 text-xs text-gray-600 dark:text-gray-400">
          <span>0s</span>
          <span>{Math.floor(totalDuration / 1000)}s</span>
        </div>
      </div>

      {/* Segment List */}
      <div className="mt-4 space-y-2">
        {storyData.segments.map((segment, index) => {
          const isCurrent = currentSegment?.startMs === segment.startMs;
          const isPast = currentTime > segment.endMs;

          return (
            <div
              key={index}
              className={`p-2 rounded cursor-pointer transition-colors ${
                isCurrent
                  ? 'bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-500'
                  : isPast
                  ? 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500'
                  : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
              onClick={() => onSeek(segment.startMs)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className={`w-3 h-3 rounded-full ${
                    isCurrent ? 'bg-blue-500' :
                    isPast ? 'bg-green-500' :
                    'bg-gray-400'
                  }`} />
                  <span className="font-medium text-sm">
                    {segment.title}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {Math.floor(segment.startMs / 1000)}s
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {segment.narration.substring(0, 60)}...
              </p>
              {(isCurrent || isPast) && segment.expectedActions && (
                <div className="mt-2">
                  <div className="flex flex-wrap gap-1">
                    {segment.expectedActions.map((action, actionIndex) => (
                      <span
                        key={actionIndex}
                        className={`px-2 py-1 text-xs rounded ${
                          isCurrent
                            ? 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                            : 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200'
                        }`}
                      >
                        {action}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Expected Plate */}
      {/* <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
        <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">
          Expected Plate Text
        </h4>
        <p className="text-lg font-mono text-yellow-800 dark:text-yellow-200 bengali-text">
          {storyData.expectedPlate}
        </p>
      </div> */}
    </div>
  );
};

export default StoryTimeline;
