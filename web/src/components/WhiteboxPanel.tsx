import React from 'react';
import { PipelineState, TraceLog, OCRCandidate } from '@/types';

interface PipelinePanelProps {
  pipelineState: Partial<PipelineState>;
  logs: TraceLog[];
  processingStage?: string;
  ocrCandidates?: OCRCandidate[];
  detectedPlate?: string | null;
  plateConfidence?: number;
}

const PipelinePanel: React.FC<PipelinePanelProps> = ({ 
  pipelineState, 
  logs,
  processingStage = 'idle',
  ocrCandidates = [],
  detectedPlate = null,
  plateConfidence = 0
}) => {
  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'warn': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'info': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'debug': return 'text-gray-500 bg-gray-50 dark:bg-gray-700/50';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow h-full">
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          🔍 Pipeline Inspector
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Real-time pipeline transparency
        </p>
      </div>

      {/* Pipeline Status */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Pipeline Status
        </h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-gray-50 dark:bg-gray-700 rounded p-2">
            <span className="text-gray-500 dark:text-gray-400">Video ID</span>
            <p className="font-mono text-gray-900 dark:text-white">
              {pipelineState.videoId || 'N/A'}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded p-2">
            <span className="text-gray-500 dark:text-gray-400">Time</span>
            <p className="font-mono text-gray-900 dark:text-white">
              {((pipelineState.currentTime || 0) / 1000).toFixed(2)}s
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded p-2">
            <span className="text-gray-500 dark:text-gray-400">Detections</span>
            <p className="font-mono text-gray-900 dark:text-white">
              {pipelineState.detections?.length || 0}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded p-2">
            <span className="text-gray-500 dark:text-gray-400">Tracks</span>
            <p className="font-mono text-gray-900 dark:text-white">
              {pipelineState.tracks?.length || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Active Tracks */}
      {pipelineState.tracks && pipelineState.tracks.length > 0 && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Active Tracks
          </h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {pipelineState.tracks.map((track) => (
              <div
                key={track.id}
                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm"
              >
                <span className="font-mono text-primary-600">
                  Track #{track.id}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs ${
                  track.status === 'active' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                }`}>
                  {track.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processing Stage */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Processing Stage
        </h4>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded p-2 text-sm">
          <span className="text-yellow-700 dark:text-yellow-400 font-medium">
            {processingStage}
          </span>
        </div>
      </div>

      {/* OCR Candidates */}
      {ocrCandidates.length > 0 && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            🔤 OCR Candidates
          </h4>
          <div className="space-y-1">
            {ocrCandidates.map((candidate, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-2 rounded text-sm ${
                  index === 0 
                    ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800'
                    : 'bg-gray-50 dark:bg-gray-700'
                }`}
              >
                <span className="font-mono text-lg">
                  {candidate.text}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  candidate.conf >= 0.9 
                    ? 'bg-green-100 text-green-800'
                    : candidate.conf >= 0.7
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {(candidate.conf * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detected Plate Result */}
      {detectedPlate && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/20">
          <h4 className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">
            ✅ Detected Plate
          </h4>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-800 dark:text-green-300 font-mono">
              {detectedPlate}
            </p>
            <p className="text-sm text-green-600 dark:text-green-500 mt-1">
              Confidence: {(plateConfidence * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      )}

      {/* ROI Status */}
      {pipelineState.roi && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Region of Interest
          </h4>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-2 text-sm">
            <span className="text-blue-600 dark:text-blue-400">
              {pipelineState.roi.points.length} points defined
            </span>
            {pipelineState.roi.active && (
              <span className="ml-2 text-green-600 dark:text-green-400">● Active</span>
            )}
          </div>
        </div>
      )}

      {/* Trace Logs */}
      <div className="p-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-between">
          <span>Trace Logs</span>
          <span className="text-xs text-gray-500">
            {logs.length} entries
          </span>
        </h4>
        <div className="space-y-1 max-h-64 overflow-y-auto font-mono text-xs">
          {logs.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No logs yet. Play video to see pipeline activity.
            </p>
          ) : (
            logs.slice(-20).reverse().map((log, index) => (
              <div
                key={index}
                className={`p-2 rounded ${getLogLevelColor(log.level)}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{log.stage}</span>
                  <span className="text-gray-400">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="mt-1 opacity-80">{log.action}</p>
                {log.data && Object.keys(log.data).length > 0 && (
                  <pre className="mt-1 text-xs opacity-60 overflow-hidden text-ellipsis">
                    {JSON.stringify(log.data, null, 0).substring(0, 100)}
                  </pre>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PipelinePanel;
