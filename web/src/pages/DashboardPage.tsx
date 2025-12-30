import React, { useState } from 'react';
import { useANPRStore } from '@/store';
import { ANPREvent } from '@/types';

const DashboardPage: React.FC = () => {
  const events = useANPRStore((state) => state.events);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ENTRY' | 'EXIT'>('ALL');
  const [selectedEvent, setSelectedEvent] = useState<ANPREvent | null>(null);

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.plate.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || event.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Event Dashboard
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Search and filter ANPR events with full evidence trail
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search by plate number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            aria-label="Filter by status"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="ALL">All Status</option>
            <option value="ENTRY">Entry Only</option>
            <option value="EXIT">Exit Only</option>
          </select>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Plate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Gate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Confidence
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event) => (
                <tr key={event.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {new Date(event.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 bengali-text">
                      {event.plate}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      event.status === 'ENTRY' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {event.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {event.gate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {(event.confidence * 100).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => setSelectedEvent(event)}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No events found. Run the demo to generate events.
                </td>
              </tr>
            )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Event Details
                </h3>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  aria-label="Close"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Event ID and Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Event ID</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white font-mono">{selectedEvent.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Timestamp</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {new Date(selectedEvent.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Plate and Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Plate Number</label>
                    <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white bengali-text">
                      {selectedEvent.plate}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                    <p className="mt-1">
                      <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${
                        selectedEvent.status === 'ENTRY' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedEvent.status}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Gate and Confidence */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Gate</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedEvent.gate}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Confidence</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {(selectedEvent.confidence * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Track ID and Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Track ID</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white font-mono">#{selectedEvent.trackId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Video Time</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {(selectedEvent.timeMs / 1000).toFixed(2)}s
                    </p>
                  </div>
                </div>

                {/* Validation Results */}
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Validation</label>
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-2">
                      {selectedEvent.validation.valid ? (
                        <>
                          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-sm text-green-600 dark:text-green-400 font-medium">Valid</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span className="text-sm text-red-600 dark:text-red-400 font-medium">Invalid</span>
                        </>
                      )}
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        ({selectedEvent.validation.mode} mode)
                      </span>
                    </div>
                    {selectedEvent.validation.reasons.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {selectedEvent.validation.reasons.map((reason, idx) => (
                          <li key={idx} className="text-xs text-gray-600 dark:text-gray-400">• {reason}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Voting Results */}
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Voting Results</label>
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-sm text-gray-900 dark:text-white">
                      <span className="font-medium">Method:</span> {selectedEvent.voting.method}
                    </div>
                    <div className="text-sm text-gray-900 dark:text-white">
                      <span className="font-medium">Winner:</span> <span className="bengali-text">{selectedEvent.voting.winner}</span>
                    </div>
                    <div className="text-sm text-gray-900 dark:text-white">
                      <span className="font-medium">Confidence:</span> {(selectedEvent.voting.confidence * 100).toFixed(1)}%
                    </div>
                    {selectedEvent.voting.candidates.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Candidates:</div>
                        <div className="space-y-1">
                          {selectedEvent.voting.candidates.slice(0, 5).map((candidate, idx) => (
                            <div key={idx} className="text-xs text-gray-600 dark:text-gray-400 flex justify-between">
                              <span className="bengali-text">{candidate.text}</span>
                              <span>votes: {candidate.count}, conf: {(candidate.avgConfidence * 100).toFixed(1)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Deduplication */}
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Deduplication</label>
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-2">
                      {selectedEvent.deduplication.isDuplicate ? (
                        <>
                          <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <span className="text-sm text-yellow-600 dark:text-yellow-400">Duplicate Detected</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-sm text-green-600 dark:text-green-400">Unique Event</span>
                        </>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{selectedEvent.deduplication.reason}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DashboardPage;
