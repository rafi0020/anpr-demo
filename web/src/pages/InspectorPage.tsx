import React from 'react';
import { useANPRStore } from '@/store';

const InspectorPage: React.FC = () => {
  const pipeline = useANPRStore((state) => state.pipeline);
  const currentSession = useANPRStore((state) => state.currentSession);
  const currentCandidates = useANPRStore((state) => state.currentCandidates);
  const traceLogs = useANPRStore((state) => state.traceLogs);

  const activeTracks = pipeline.tracks || [];
  const recentLogs = traceLogs.slice(-20).reverse();

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Pipeline Inspector
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Deep dive into track sessions, OCR results, and validation decisions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Track Sessions</h3>
          {activeTracks.length > 0 ? (
            <div className="space-y-2">
              {activeTracks.map((track) => (
                <div key={track.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 dark:text-white">Track #{track.id}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {track.detections.length} frames
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Position: [{track.bbox[0].toFixed(0)}, {track.bbox[1].toFixed(0)}, {track.bbox[2].toFixed(0)}, {track.bbox[3].toFixed(0)}]
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 dark:text-gray-400 text-center py-8">
              No active tracks. Play the demo video to see tracks.
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">OCR Analysis</h3>
          {currentCandidates.length > 0 ? (
            <div className="space-y-2">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Current OCR Candidates:
              </div>
              {currentCandidates.map((candidate, idx) => (
                <div key={idx} className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-gray-900 dark:text-white bengali-text">
                      {candidate.text}
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {(candidate.conf * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : currentSession ? (
            <div className="text-blue-600 dark:text-blue-400 text-center py-8">
              Processing session for Track #{currentSession.trackId}...
            </div>
          ) : (
            <div className="text-gray-500 dark:text-gray-400 text-center py-8">
              OCR results will appear here when plates are detected
            </div>
          )}
        </div>
      </div>

      {/* Recent Pipeline Logs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Recent Pipeline Logs</h3>
        {recentLogs.length > 0 ? (
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {recentLogs.map((log, idx) => (
              <div key={idx} className={`text-xs font-mono p-2 rounded ${
                log.level === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300' :
                log.level === 'warn' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300' :
                log.level === 'info' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300' :
                'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}>
                <span className="font-semibold">[{log.module}]</span> {log.message}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 dark:text-gray-400 text-center py-8">
            No logs yet. Pipeline logs will appear here.
          </div>
        )}
      </div>
    </div>
  );
};

export default InspectorPage;
