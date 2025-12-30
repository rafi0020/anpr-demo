import React from 'react';

const DocsPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          System Documentation
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Complete technical documentation for the ANPR demo system
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Architecture Overview</h3>
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The ANPR system consists of 12 modular pipeline components that process video frames
            through detection, tracking, OCR, and validation stages.
          </p>

          {/* System Architecture Diagram */}
          <div className="my-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h4 className="text-lg font-medium mb-4 text-center">System Flow Diagram</h4>
            <svg viewBox="0 0 800 300" className="w-full h-auto">
              {/* Video Input */}
              <rect x="20" y="20" width="120" height="60" fill="#3B82F6" rx="8" />
              <text x="80" y="55" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">Video Input</text>
              
              {/* Detection */}
              <rect x="180" y="20" width="120" height="60" fill="#10B981" rx="8" />
              <text x="240" y="50" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">Detection</text>
              <text x="240" y="65" textAnchor="middle" fill="white" fontSize="10">(Vehicles/Plates)</text>
              <path d="M140 50 L180 50" stroke="#374151" strokeWidth="2" markerEnd="url(#arrowhead)" />
              
              {/* Tracking */}
              <rect x="340" y="20" width="120" height="60" fill="#10B981" rx="8" />
              <text x="400" y="50" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">Tracking</text>
              <text x="400" y="65" textAnchor="middle" fill="white" fontSize="10">(IOU-based)</text>
              <path d="M300 50 L340 50" stroke="#374151" strokeWidth="2" markerEnd="url(#arrowhead)" />
              
              {/* ROI Filter */}
              <rect x="500" y="20" width="120" height="60" fill="#F59E0B" rx="8" />
              <text x="560" y="50" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">ROI Filter</text>
              <text x="560" y="65" textAnchor="middle" fill="white" fontSize="10">(Gate Area)</text>
              <path d="M460 50 L500 50" stroke="#374151" strokeWidth="2" markerEnd="url(#arrowhead)" />
              
              {/* Session Manager */}
              <rect x="660" y="20" width="120" height="60" fill="#F59E0B" rx="8" />
              <text x="720" y="50" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">Session</text>
              <text x="720" y="65" textAnchor="middle" fill="white" fontSize="10">(Crop Collection)</text>
              <path d="M620 50 L660 50" stroke="#374151" strokeWidth="2" markerEnd="url(#arrowhead)" />
              
              {/* Best Frame */}
              <rect x="660" y="120" width="120" height="60" fill="#8B5CF6" rx="8" />
              <text x="720" y="145" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">Best Frame</text>
              <text x="720" y="160" textAnchor="middle" fill="white" fontSize="10">(Quality Score)</text>
              <path d="M720 80 L720 120" stroke="#374151" strokeWidth="2" markerEnd="url(#arrowhead)" />
              
              {/* OCR Processing */}
              <rect x="500" y="120" width="120" height="60" fill="#8B5CF6" rx="8" />
              <text x="560" y="145" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">OCR</text>
              <text x="560" y="160" textAnchor="middle" fill="white" fontSize="10">(Bengali Text)</text>
              <path d="M660 150 L620 150" stroke="#374151" strokeWidth="2" markerEnd="url(#arrowhead)" />
              
              {/* Voting */}
              <rect x="340" y="120" width="120" height="60" fill="#EF4444" rx="8" />
              <text x="400" y="145" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">Voting</text>
              <text x="400" y="160" textAnchor="middle" fill="white" fontSize="10">(Consensus)</text>
              <path d="M500 150 L460 150" stroke="#374151" strokeWidth="2" markerEnd="url(#arrowhead)" />
              
              {/* Validation */}
              <rect x="180" y="120" width="120" height="60" fill="#EF4444" rx="8" />
              <text x="240" y="145" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">Validation</text>
              <text x="240" y="160" textAnchor="middle" fill="white" fontSize="10">(Format Rules)</text>
              <path d="M340 150 L300 150" stroke="#374151" strokeWidth="2" markerEnd="url(#arrowhead)" />
              
              {/* Deduplication */}
              <rect x="20" y="120" width="120" height="60" fill="#EF4444" rx="8" />
              <text x="80" y="145" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">De-duplicate</text>
              <text x="80" y="160" textAnchor="middle" fill="white" fontSize="10">(Time Window)</text>
              <path d="M180 150 L140 150" stroke="#374151" strokeWidth="2" markerEnd="url(#arrowhead)" />
              
              {/* Upload/Storage */}
              <rect x="20" y="220" width="120" height="60" fill="#06B6D4" rx="8" />
              <text x="80" y="245" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">Upload</text>
              <text x="80" y="260" textAnchor="middle" fill="white" fontSize="10">(Event Store)</text>
              <path d="M80 180 L80 220" stroke="#374151" strokeWidth="2" markerEnd="url(#arrowhead)" />
              
              {/* Dashboard */}
              <rect x="180" y="220" width="120" height="60" fill="#06B6D4" rx="8" />
              <text x="240" y="245" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">Dashboard</text>
              <text x="240" y="260" textAnchor="middle" fill="white" fontSize="10">(View/Search)</text>
              <path d="M140 250 L180 250" stroke="#374151" strokeWidth="2" markerEnd="url(#arrowhead)" />
              
              {/* Arrow marker definition */}
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                  <polygon points="0 0, 10 3, 0 6" fill="#374151" />
                </marker>
              </defs>
            </svg>
          </div>

          {/* Data Flow Diagram */}
          <div className="my-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h4 className="text-lg font-medium mb-4 text-center">Data Flow Example</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded border-l-4 border-blue-500">
                <div className="font-mono bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">t=2000ms</div>
                <div className="flex-1">
                  <div className="font-semibold">Detection</div>
                  <div className="text-gray-600 dark:text-gray-400">Vehicle bbox: [720, 350, 1340, 840] | Plate bbox: [880, 620, 1080, 680]</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded border-l-4 border-green-500">
                <div className="font-mono bg-green-100 dark:bg-green-900 px-2 py-1 rounded">t=2200ms</div>
                <div className="flex-1">
                  <div className="font-semibold">Tracking</div>
                  <div className="text-gray-600 dark:text-gray-400">Track #1 assigned | IOU: 0.89 | Status: Active</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded border-l-4 border-purple-500">
                <div className="font-mono bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded">t=3200ms</div>
                <div className="flex-1">
                  <div className="font-semibold">OCR Processing</div>
                  <div className="text-gray-600 dark:text-gray-400 bengali-text">Candidates: ["সখী-বয-যায়র"] (conf: 0.92), ["সখী-বয-যায়স"] (conf: 0.88)</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded border-l-4 border-red-500">
                <div className="font-mono bg-red-100 dark:bg-red-900 px-2 py-1 rounded">t=4000ms</div>
                <div className="flex-1">
                  <div className="font-semibold">Voting & Validation</div>
                  <div className="text-gray-600 dark:text-gray-400 bengali-text">Winner: "সখী-বয-যায়র" | Method: frequency | Valid: ✓</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded border-l-4 border-cyan-500">
                <div className="font-mono bg-cyan-100 dark:bg-cyan-900 px-2 py-1 rounded">t=4100ms</div>
                <div className="flex-1">
                  <div className="font-semibold">Event Created</div>
                  <div className="text-gray-600 dark:text-gray-400">Event ID: evt_1234567890_1 | Status: ENTRY | Gate: Demo Gate</div>
                </div>
              </div>
            </div>
          </div>

          <h4 className="text-lg font-medium mt-6 mb-2">Pipeline Stages:</h4>
          <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li><strong>Frame Source:</strong> Video frame extraction and timing</li>
            <li><strong>Detection:</strong> Vehicle and plate bounding boxes</li>
            <li><strong>Tracking:</strong> IOU-based multi-object tracking</li>
            <li><strong>ROI Gating:</strong> Region of interest filtering</li>
            <li><strong>Session Management:</strong> Crop collection during stops</li>
            <li><strong>Best Frame Selection:</strong> Quality-based frame selection</li>
            <li><strong>OCR Processing:</strong> Bengali text recognition</li>
            <li><strong>Validation:</strong> Format and rule checking</li>
            <li><strong>Voting:</strong> Consensus from multiple OCR results</li>
            <li><strong>De-duplication:</strong> Time-window duplicate detection</li>
            <li><strong>Upload:</strong> Event creation and storage</li>
            <li><strong>Dashboard:</strong> Event visualization and search</li>
          </ol>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Configuration</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Tracker Settings</h4>
            <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-sm overflow-x-auto">
{`{
  iouThreshold: 0.3,
  maxLostFrames: 10,
  minDetections: 3
}`}
            </pre>
          </div>
          <div>
            <h4 className="font-medium mb-2">OCR Settings</h4>
            <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-sm overflow-x-auto">
{`{
  language: 'bengali',
  minConfidence: 0.7,
  maxCandidates: 5
}`}
            </pre>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">API Reference</h3>
        <div className="space-y-4">
          <div className="border-l-4 border-primary-500 pl-4">
            <h4 className="font-mono text-sm mb-1">TrackerSimple.update(detections, timeMs)</h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Updates tracker with new detections and returns active tracks
            </p>
          </div>
          <div className="border-l-4 border-primary-500 pl-4">
            <h4 className="font-mono text-sm mb-1">ROI.isBBoxInside(bbox, threshold)</h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Checks if bounding box is inside the region of interest
            </p>
          </div>
          <div className="border-l-4 border-primary-500 pl-4">
            <h4 className="font-mono text-sm mb-1">TraceLogger.exportReport()</h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Exports complete trace log report with performance metrics
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Production Mapping</h3>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                Demo Component
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                Production Equivalent
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            <tr>
              <td className="px-4 py-2 text-sm">Precomputed JSON</td>
              <td className="px-4 py-2 text-sm">Real-time YOLO inference</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-sm">Browser storage</td>
              <td className="px-4 py-2 text-sm">PostgreSQL database</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-sm">Static video</td>
              <td className="px-4 py-2 text-sm">RTSP camera streams</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DocsPage;
