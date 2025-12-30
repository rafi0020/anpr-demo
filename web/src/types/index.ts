// Core Types for ANPR Demo System

export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export type BBoxArray = [number, number, number, number]; // [x1, y1, x2, y2]

export interface Detection {
  type: 'vehicle' | 'plate';
  bbox: BBoxArray;
  conf: number;
  trackId?: number | string | null;
}

export interface Frame {
  timeMs: number;
  frameNumber: number;
  detections: Detection[];
}

export interface DetectionData {
  videoId: string;
  fps: number;
  resolution: {
    width: number;
    height: number;
  };
  frames: Frame[];
  metadata: {
    generatedAt: string;
    model: string;
    preprocessed: boolean;
    interpolated: boolean;
  };
}

export interface OCRCandidate {
  text: string;
  conf: number;
  script?: string;
}

export interface CropData {
  cropId: string;
  timeMs: number;
  frameNumber: number;
  bbox: BBoxArray;
  quality: {
    sharpness: number;
    contrast: number;
    area: number;
  };
  candidates: OCRCandidate[];
}

export interface TrackOCRData {
  trackId: string;
  startMs: number;
  endMs: number;
  crops: CropData[];
  sessionMetadata: {
    totalCrops: number;
    bestCropId: string;
    averageConfidence: number;
    plateType: string;
  };
}

export interface OCRData {
  videoId: string;
  tracks: Record<string, TrackOCRData>;
  metadata: {
    generatedAt: string;
    ocrModel: string;
    preprocessed: boolean;
    language: string;
  };
}

export interface StorySegment {
  startMs: number;
  endMs: number;
  title: string;
  narration: string;
  systemStatus: 'DETECTING' | 'TRACKING' | 'CAPTURING' | 'PROCESSING' | 'FINALIZING' | 'UPLOADING' | 'COMPLETE';
  expectedActions: string[];
  plateVisible?: boolean;
}

export interface StoryData {
  videoId: string;
  gate: string;
  segments: StorySegment[];
  expectedPlate: string;
  metadata: {
    location: string;
    direction: 'ENTRY' | 'EXIT';
    recordedAt: string;
    fps: number;
    resolution: string;
    duration: number;
  };
}

export interface Track {
  id: string | number;
  status: 'active' | 'lost' | 'finished';
  startTime: number;
  lastSeen: number;
  detections: Detection[];
  bbox: BBoxArray;
  confidence: number;
}

export interface Session {
  trackId: string | number;
  startMs: number;
  endMs: number;
  crops: CropImage[];
  status: 'active' | 'finalized';
  finalPlate?: string;
  confidence?: number;
}

export interface CropImage {
  cropId: string;
  timeMs: number;
  imageData: string; // base64
  bbox: BBoxArray;
  quality?: {
    sharpness: number;
    contrast: number;
    area: number;
  };
}

export interface ValidationResult {
  valid: boolean;
  mode: 'strict' | 'fallback';
  plate: string;
  reasons: string[];
  warnings?: string[];
  metadata?: {
    region?: string;
    series?: string;
    vehicleType?: string;
    format?: string;
  };
}

export interface VoteResult {
  winner: string;
  confidence: number;
  votes: Record<string, number>;
  method: 'frequency' | 'confidence' | 'tiebreak';
  candidates: Array<{
    text: string;
    count: number;
    avgConfidence: number;
    maxConfidence: number;
  }>;
}

export interface DeduplicationResult {
  isDuplicate: boolean;
  reason: string;
  previousEvent?: ANPREvent;
  timeDiff?: number;
}

export interface ANPREvent {
  id: string;
  timestamp: string;
  timeMs: number;
  plate: string;
  status: 'ENTRY' | 'EXIT';
  gate: string;
  confidence: number;
  trackId: string | number;
  evidence: {
    frameTimeMs: number;
    cropId: string;
    imageData?: string;
  };
  validation: ValidationResult;
  voting: VoteResult;
  deduplication: DeduplicationResult;
  metadata?: Record<string, any>;
}

export interface UploadPayload {
  project_code: string;
  reg_number: string;
  status: 'ENTRY' | 'EXIT';
  time: string;
  category: string;
  gateAddress: string;
  evidence: {
    frameTimeMs: number;
    trackId: string | number;
  };
  confidence: number;
  validation?: ValidationResult;
}

export interface TraceLog {
  timestamp: number;
  module: string;
  message: string;
  data?: any;
  level: 'info' | 'warn' | 'error' | 'debug';
  // Legacy fields for backward compatibility
  stage?: string;
  action?: string;
}

export interface ROIPolygon {
  points: Array<{ x: number; y: number }>;
  active: boolean;
  name?: string;
}

export interface PipelineState {
  videoId: string;
  currentTime: number;
  isPlaying: boolean;
  detections: Detection[];
  tracks: Track[];
  activeSessions: Session[];
  events: ANPREvent[];
  roi: ROIPolygon | null;
  logs: TraceLog[];
  selectedTrack?: string | number;
  inspectorData?: {
    track: Track;
    session: Session;
    crops: CropImage[];
    ocrResults: OCRCandidate[][];
    validation: ValidationResult;
    voting: VoteResult;
  };
}

export interface DashboardFilters {
  searchText: string;
  status?: 'ENTRY' | 'EXIT';
  gate?: string;
  dateFrom?: Date;
  dateTo?: Date;
  confidenceMin?: number;
}

export interface AnnotationKeyframe {
  timeMs: number;
  bbox: BBoxArray;
  type: 'vehicle' | 'plate';
}

export interface AnnotationData {
  videoId: string;
  keyframes: AnnotationKeyframe[];
  interpolated: boolean;
}

// Type alias for TraceLogger - used by pipeline modules
export type TraceLogger = {
  info: (module: string, message: string, data?: any) => void;
  warn: (module: string, message: string, data?: any) => void;
  error: (module: string, message: string, data?: any) => void;
  debug: (module: string, message: string, data?: any) => void;
  getRecentLogs: (count: number) => TraceLog[];
};

// ROI type alias for backward compatibility
export type ROI = ROIPolygon;
