import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import localforage from 'localforage';
import {
  ANPREvent,
  TraceLog,
  PipelineState,
  StorySegment,
  Detection,
  OCRCandidate,
  CropImage
} from '@/types';

interface ANPRStore {
  // Pipeline state
  pipeline: PipelineState;

  // Current video state
  currentTimeMs: number;
  isPlaying: boolean;
  videoDuration: number;

  // Story mode
  storySegments: StorySegment[];
  currentSegment: StorySegment | null;

  // Detection and tracking
  currentDetections: Detection[];
  currentTrackId: number | null;

  // OCR and validation
  currentCandidates: OCRCandidate[];
  currentValidation: any;

  // Session data
  currentSession: {
    crops: CropImage[];
    trackId: number;
    startTimeMs: number;
    endTimeMs: number;
  } | null;

  // Events
  events: ANPREvent[];
  selectedEvent: ANPREvent | null;

  // UI state
  activeTab: 'demo' | 'inspector' | 'dashboard' | 'docs';
  showLogs: boolean;
  guidedTour: boolean;

  // Trace logs
  traceLogs: TraceLog[];

  // Actions
  setPipelineState: (state: Partial<PipelineState>) => void;
  setVideoState: (timeMs: number, isPlaying: boolean, duration?: number) => void;
  setStorySegments: (segments: StorySegment[]) => void;
  setCurrentSegment: (segment: StorySegment | null) => void;
  setDetections: (detections: Detection[]) => void;
  setTrackId: (trackId: number | null) => void;
  setCandidates: (candidates: OCRCandidate[]) => void;
  setValidation: (validation: any) => void;
  setSession: (session: ANPRStore['currentSession']) => void;
  addEvent: (event: ANPREvent) => void;
  setSelectedEvent: (event: ANPREvent | null) => void;
  setActiveTab: (tab: ANPRStore['activeTab']) => void;
  setShowLogs: (show: boolean) => void;
  setGuidedTour: (enabled: boolean) => void;
  addTraceLog: (log: TraceLog) => void;
  clearTraceLogs: () => void;

  // Persistence
  loadFromStorage: () => void;
  saveToStorage: () => void;
}

export const useANPRStore = create<ANPRStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    pipeline: {
      videoId: '',
      currentTime: 0,
      isPlaying: false,
      detections: [],
      tracks: [],
      activeSessions: [],
      events: [],
      roi: null,
      logs: []
    },

    currentTimeMs: 0,
    isPlaying: false,
    videoDuration: 0,

    storySegments: [],
    currentSegment: null,

    currentDetections: [],
    currentTrackId: null,

    currentCandidates: [],
    currentValidation: null,

    currentSession: null,

    events: [],
    selectedEvent: null,

    activeTab: 'demo',
    showLogs: true,
    guidedTour: false,

    traceLogs: [],

    // Actions
    setPipelineState: (state) => set((prev) => ({
      pipeline: { ...prev.pipeline, ...state }
    })),

    setVideoState: (timeMs, isPlaying, duration) => set({
      currentTimeMs: timeMs,
      isPlaying,
      videoDuration: duration ?? get().videoDuration
    }),

    setStorySegments: (segments) => set({ storySegments: segments }),

    setCurrentSegment: (segment) => set({ currentSegment: segment }),

    setDetections: (detections) => set({ currentDetections: detections }),

    setTrackId: (trackId) => set({ currentTrackId: trackId }),

    setCandidates: (candidates) => set({ currentCandidates: candidates }),

    setValidation: (validation) => set({ currentValidation: validation }),

    setSession: (session) => set({ currentSession: session }),

    addEvent: (event) => set((prev) => ({
      events: [...prev.events, event]
    })),

    setSelectedEvent: (event) => set({ selectedEvent: event }),

    setActiveTab: (tab) => set({ activeTab: tab }),

    setShowLogs: (show) => set({ showLogs: show }),

    setGuidedTour: (enabled) => set({ guidedTour: enabled }),

    addTraceLog: (log) => set((prev) => ({
      traceLogs: [...prev.traceLogs.slice(-999), log] // Keep last 1000 logs
    })),

    clearTraceLogs: () => set({ traceLogs: [] }),

    // Persistence
    loadFromStorage: async () => {
      try {
        const events = await localforage.getItem<ANPREvent[]>('anpr-events');
        const logs = await localforage.getItem<TraceLog[]>('anpr-logs');

        if (events) set({ events });
        if (logs) set({ traceLogs: logs });
      } catch (error) {
        console.warn('Failed to load from storage:', error);
      }
    },

    saveToStorage: async () => {
      try {
        const { events, traceLogs } = get();
        await localforage.setItem('anpr-events', events);
        await localforage.setItem('anpr-logs', traceLogs);
      } catch (error) {
        console.warn('Failed to save to storage:', error);
      }
    }
  }))
);

// Auto-save to storage when events or logs change
useANPRStore.subscribe(
  (state) => ({ events: state.events, traceLogs: state.traceLogs }),
  ({ events, traceLogs }) => {
    localforage.setItem('anpr-events', events);
    localforage.setItem('anpr-logs', traceLogs);
  },
  { equalityFn: (a, b) => a.events.length === b.events.length && a.traceLogs.length === b.traceLogs.length }
);

// Load from storage on app start
if (typeof window !== 'undefined') {
  useANPRStore.getState().loadFromStorage();
}
