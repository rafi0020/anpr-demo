import React, { useState, useRef, useEffect, useCallback } from 'react';
import VideoPlayer from '../components/VideoPlayer';
import StoryTimeline from '../components/StoryTimeline';
import DetectionOverlay from '../components/DetectionOverlay';
import PipelinePanel from '../components/PipelinePanel';
import { StoryData, PipelineState, OCRCandidate, ANPREvent } from '@/types';
import { TraceLogger } from '@/pipeline/TraceLogger';
import { DetectorPrecomputed } from '@/pipeline/DetectorPrecomputed';
import { TrackerSimple } from '@/pipeline/TrackerSimple';
import { OCRPrecomputed } from '@/pipeline/OCRPrecomputed';
import { Voter } from '@/pipeline/Voter';
import { ROI } from '@/pipeline/ROI';
import { useANPRStore } from '@/store';

const DemoPage: React.FC = () => {
  const addEvent = useANPRStore((state) => state.addEvent);
  const setSession = useANPRStore((state) => state.setSession);
  const setCandidates = useANPRStore((state) => state.setCandidates);
  const setPipelineStateStore = useANPRStore((state) => state.setPipelineState);
  const addTraceLog = useANPRStore((state) => state.addTraceLog);
  
  const [isLoading, setIsLoading] = useState(true);
  const [storyData, setStoryData] = useState<StoryData | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ocrCandidates, setOcrCandidates] = useState<OCRCandidate[]>([]);
  const [detectedPlate, setDetectedPlate] = useState<string | null>(null);
  const [plateConfidence, setPlateConfidence] = useState<number>(0);
  const [processingStage, setProcessingStage] = useState<string>('idle');
  const [hasCreatedEvent, setHasCreatedEvent] = useState(false);
  const [pipelineState, setPipelineState] = useState<Partial<PipelineState>>({
    videoId: 'gateA_entry',
    currentTime: 0,
    isPlaying: false,
    detections: [],
    tracks: [],
    activeSessions: [],
    events: [],
    roi: null,
    logs: []
  });

  // Pipeline modules
  const loggerRef = useRef(new TraceLogger());
  const detectorRef = useRef(new DetectorPrecomputed(loggerRef.current));
  const trackerRef = useRef(new TrackerSimple(loggerRef.current));
  const ocrRef = useRef(new OCRPrecomputed(loggerRef.current));
  const voterRef = useRef(new Voter(loggerRef.current));
  const roiRef = useRef(new ROI(loggerRef.current));
  
  // Wrap logger to send logs to store
  useEffect(() => {
    const originalInfo = loggerRef.current.info.bind(loggerRef.current);
    const originalWarn = loggerRef.current.warn.bind(loggerRef.current);
    const originalError = loggerRef.current.error.bind(loggerRef.current);
    
    loggerRef.current.info = (module, message, data?) => {
      originalInfo(module, message, data);
      addTraceLog({ level: 'info', module, message, data, timestamp: Date.now() });
    };
    
    loggerRef.current.warn = (module, message, data?) => {
      originalWarn(module, message, data);
      addTraceLog({ level: 'warn', module, message, data, timestamp: Date.now() });
    };
    
    loggerRef.current.error = (module, message, data?) => {
      originalError(module, message, data);
      addTraceLog({ level: 'error', module, message, data, timestamp: Date.now() });
    };
  }, [addTraceLog]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const baseUrl = import.meta.env.BASE_URL;
        
        // Load story data
        const storyResponse = await fetch(`${baseUrl}assets/story/gateA_entry.story.json`);
        const story = await storyResponse.json();
        setStoryData(story);

        // Load detection data
        await detectorRef.current.loadDetections(`${baseUrl}assets/detections/gateA_entry.dets.json`);

        // Load OCR data
        await ocrRef.current.loadOCRData('gateA_entry', baseUrl);

        setIsLoading(false);
        loggerRef.current.info('DemoPage', 'Initial data loaded');
      } catch (error) {
        console.error('Failed to load data:', error);
        loggerRef.current.error('DemoPage', 'Failed to load initial data', { error });
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Process frame
  const processFrame = useCallback((timeMs: number) => {
    // Get detections for current time
    const detections = detectorRef.current.getDetections(timeMs);
    
    console.log('DemoPage processFrame:', timeMs, 'detections:', detections.length);
    
    // Update tracker
    const tracks = trackerRef.current.update(detections, timeMs);

    // Check for plate detections and run OCR
    const plateDetections = detections.filter(d => d.type === 'plate');
    let currentStage = 'idle';
    
    if (detections.length > 0 && plateDetections.length === 0) {
      currentStage = 'detecting';
      setProcessingStage('Detecting vehicle...');
      loggerRef.current.info('Pipeline', 'Vehicle detected, searching for plate');
    }
    
    if (plateDetections.length > 0) {
      currentStage = 'ocr';
      setProcessingStage('Reading plate...');
      
      // Get OCR candidates for active tracks
      const activeTrack = tracks.find(t => t.status === 'active');
      if (activeTrack) {
        // Update store session
        setSession({
          trackId: typeof activeTrack.id === 'number' ? activeTrack.id : parseInt(String(activeTrack.id)),
          crops: [],
          startTimeMs: timeMs,
          endTimeMs: timeMs
        });
        
        const candidates = ocrRef.current.getCandidatesForTrack(String(activeTrack.id));
        
        if (candidates.length > 0) {
          // Flatten and set current candidates
          const flatCandidates = candidates.flat();
          setOcrCandidates(flatCandidates.slice(0, 5));
          setCandidates(flatCandidates.slice(0, 5));
          
          // Run voting on candidates
          const voteResult = voterRef.current.vote(candidates);
          
          if (voteResult.winner) {
            setDetectedPlate(voteResult.winner);
            setPlateConfidence(voteResult.confidence);
            setProcessingStage('Plate recognized!');
            currentStage = 'recognized';
            
            loggerRef.current.info('Pipeline', 'Plate recognized', {
              plate: voteResult.winner,
              confidence: (voteResult.confidence * 100).toFixed(1) + '%',
              method: voteResult.method
            });
            
            // Create event only once per detection
            if (!hasCreatedEvent && voteResult.confidence > 0.7) {
              const event: ANPREvent = {
                id: `evt_${Date.now()}_${activeTrack.id}`,
                timestamp: new Date().toISOString(),
                timeMs: timeMs,
                trackId: activeTrack.id,
                plate: voteResult.winner,
                confidence: voteResult.confidence,
                gate: 'Demo Gate',
                status: 'ENTRY',
                evidence: {
                  frameTimeMs: timeMs,
                  cropId: `crop_${activeTrack.id}`,
                },
                validation: {
                  valid: true,
                  mode: 'fallback',
                  plate: voteResult.winner,
                  reasons: [],
                  warnings: []
                },
                voting: voteResult,
                deduplication: {
                  isDuplicate: false,
                  reason: 'New detection'
                }
              };
              
              addEvent(event);
              setHasCreatedEvent(true);
              
              loggerRef.current.info('Pipeline', 'Event created', {
                eventId: event.id,
                plate: event.plate
              });
            }
          }
        }
      }
    } else if (timeMs < 2000) {
      // Reset if no plate detected yet
      setOcrCandidates([]);
      setCandidates([]);
      setDetectedPlate(null);
      setPlateConfidence(0);
      setProcessingStage('Waiting for vehicle...');
      setHasCreatedEvent(false);
    }
    
    // Update pipeline state
    setPipelineState(prev => ({
      ...prev,
      currentTime: timeMs,
      detections,
      tracks,
      logs: loggerRef.current.getRecentLogs(20)
    }));
    
    // Update store pipeline state
    setPipelineStateStore({
      currentTime: timeMs,
      detections,
      tracks
    });

    loggerRef.current.debug('DemoPage', 'Frame processed', { 
      timeMs, 
      detectionCount: detections.length,
      trackCount: tracks.length,
      stage: currentStage
    });
  }, [hasCreatedEvent, addEvent, setSession, setCandidates, setPipelineStateStore, addTraceLog]);

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
    processFrame(Math.floor(time * 1000)); // Convert to milliseconds
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    setPipelineState(prev => ({ ...prev, isPlaying: !isPlaying }));
  };

  const handleROIUpdate = (roi: any) => {
    roiRef.current.setPolygon(roi);
    setPipelineState(prev => ({ ...prev, roi }));
    loggerRef.current.info('DemoPage', 'ROI updated');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ANPR Demo System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          ANPR Pipeline Demo
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Real-time vehicle detection, tracking, and plate recognition with pipeline transparency
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Section */}
        <div className="lg:col-span-2 space-y-4">
          {/* Video Player with Overlay */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <VideoPlayer
                videoUrl={`${import.meta.env.BASE_URL}assets/videos/gateA_entry.mp4`}
                onTimeUpdate={handleTimeUpdate}
                isPlaying={isPlaying}
                onPlayPause={handlePlayPause}
              >
                <DetectionOverlay
                  detections={pipelineState.detections || []}
                  tracks={pipelineState.tracks || []}
                  roi={pipelineState.roi || null}
                  onROIUpdate={handleROIUpdate}
                  videoWidth={1920}
                  videoHeight={1080}
                />
              </VideoPlayer>
            </div>
            
            {/* Video Controls */}
            <div className="mt-4 flex items-center space-x-4">
              <button
                onClick={handlePlayPause}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              <div className="flex-1">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Time: {currentTime.toFixed(2)}s / 7.50s
                </div>
              </div>
            </div>
          </div>

          {/* Story Timeline */}
          {storyData && (
            <StoryTimeline
              storyData={storyData}
              currentTime={currentTime * 1000}
              onSeek={(timeMs) => handleTimeUpdate(timeMs / 1000)}
            />
          )}
        </div>

        {/* Pipeline Panel */}
        <div className="lg:col-span-1">
          <PipelinePanel
            pipelineState={pipelineState}
            logs={pipelineState.logs || []}
            processingStage={processingStage}
            ocrCandidates={ocrCandidates}
            detectedPlate={detectedPlate}
            plateConfidence={plateConfidence}
          />
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-6">
            <span className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              Pipeline Active
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              Tracks: {pipelineState.tracks?.length || 0}
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              Detections: {pipelineState.detections?.length || 0}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-primary-600 hover:text-primary-700">
              Export Logs
            </button>
            <button className="text-primary-600 hover:text-primary-700">
              Reset Pipeline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoPage;
