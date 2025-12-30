import { Detection, DetectionData, Frame } from '@/types';
import { TraceLogger } from './TraceLogger';

export class DetectorPrecomputed {
  private detectionData: DetectionData | null = null;
  private logger: TraceLogger;
  private frameIndex: Map<number, Frame> = new Map();
  private timeTolerance: number = 100; // ms tolerance for frame matching

  constructor(logger: TraceLogger) {
    this.logger = logger;
  }

  async loadDetections(url: string): Promise<void> {
    try {
      this.logger.info('DetectorPrecomputed', 'Loading detections', { url });
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load detections: ${response.statusText}`);
      }

      this.detectionData = await response.json();
      
      // Build frame index for faster lookup
      this.buildFrameIndex();
      
      this.logger.info('DetectorPrecomputed', 'Detections loaded', {
        videoId: this.detectionData?.videoId,
        frameCount: this.detectionData?.frames.length,
        fps: this.detectionData?.fps
      });
    } catch (error) {
      this.logger.error('DetectorPrecomputed', 'Failed to load detections', { error });
      throw error;
    }
  }

  private buildFrameIndex(): void {
    if (!this.detectionData) return;

    this.frameIndex.clear();
    this.detectionData.frames.forEach(frame => {
      // Index by time bucket (rounded to nearest 100ms)
      const bucket = Math.round(frame.timeMs / 100) * 100;
      this.frameIndex.set(bucket, frame);
    });

    this.logger.debug('DetectorPrecomputed', 'Frame index built', {
      buckets: this.frameIndex.size
    });
  }

  getDetections(timeMs: number): Detection[] {
    if (!this.detectionData) {
      this.logger.warn('DetectorPrecomputed', 'No detection data loaded');
      return [];
    }

    // Find nearest frame
    const frame = this.findNearestFrame(timeMs);
    
    if (!frame) {
      this.logger.debug('DetectorPrecomputed', 'No frame found', { timeMs });
      return [];
    }

    this.logger.debug('DetectorPrecomputed', 'Detections retrieved', {
      timeMs,
      frameTime: frame.timeMs,
      detectionCount: frame.detections.length
    });

    return frame.detections;
  }

  private findNearestFrame(timeMs: number): Frame | null {
    if (!this.detectionData) return null;

    // Try exact match first
    const exactFrame = this.detectionData.frames.find(f => f.timeMs === timeMs);
    if (exactFrame) return exactFrame;

    // Try bucket match
    const bucket = Math.round(timeMs / 100) * 100;
    const bucketFrame = this.frameIndex.get(bucket);
    if (bucketFrame && Math.abs(bucketFrame.timeMs - timeMs) <= this.timeTolerance) {
      return bucketFrame;
    }

    // Find nearest frame within tolerance
    let nearestFrame: Frame | null = null;
    let minDiff = Infinity;

    for (const frame of this.detectionData.frames) {
      const diff = Math.abs(frame.timeMs - timeMs);
      if (diff <= this.timeTolerance && diff < minDiff) {
        minDiff = diff;
        nearestFrame = frame;
      }
    }

    return nearestFrame;
  }

  getFrameAtTime(timeMs: number): Frame | null {
    return this.findNearestFrame(timeMs);
  }

  getPlateDetections(timeMs: number): Detection[] {
    const detections = this.getDetections(timeMs);
    return detections.filter(d => d.type === 'plate');
  }

  getVehicleDetections(timeMs: number): Detection[] {
    const detections = this.getDetections(timeMs);
    return detections.filter(d => d.type === 'vehicle');
  }

  getDetectionRange(startMs: number, endMs: number): Frame[] {
    if (!this.detectionData) return [];

    return this.detectionData.frames.filter(
      frame => frame.timeMs >= startMs && frame.timeMs <= endMs
    );
  }

  interpolateDetections(timeMs: number): Detection[] {
    if (!this.detectionData) return [];

    // Find frames before and after
    const frames = this.detectionData.frames;
    let frameBefore: Frame | null = null;
    let frameAfter: Frame | null = null;

    for (let i = 0; i < frames.length; i++) {
      if (frames[i].timeMs <= timeMs) {
        frameBefore = frames[i];
      }
      if (frames[i].timeMs >= timeMs && !frameAfter) {
        frameAfter = frames[i];
        break;
      }
    }

    // If we only have one frame or exact match, return as is
    if (!frameBefore || !frameAfter || frameBefore === frameAfter) {
      return this.getDetections(timeMs);
    }

    // Interpolate between frames
    const alpha = (timeMs - frameBefore.timeMs) / (frameAfter.timeMs - frameBefore.timeMs);
    const interpolated: Detection[] = [];

    // Match detections by trackId
    frameBefore.detections.forEach(detBefore => {
      const detAfter = frameAfter.detections.find(
        d => d.trackId === detBefore.trackId && d.type === detBefore.type
      );

      if (detAfter) {
        // Interpolate bbox
        const bbox: [number, number, number, number] = [
          Math.round(detBefore.bbox[0] + (detAfter.bbox[0] - detBefore.bbox[0]) * alpha),
          Math.round(detBefore.bbox[1] + (detAfter.bbox[1] - detBefore.bbox[1]) * alpha),
          Math.round(detBefore.bbox[2] + (detAfter.bbox[2] - detBefore.bbox[2]) * alpha),
          Math.round(detBefore.bbox[3] + (detAfter.bbox[3] - detBefore.bbox[3]) * alpha),
        ];

        // Interpolate confidence
        const conf = detBefore.conf + (detAfter.conf - detBefore.conf) * alpha;

        interpolated.push({
          type: detBefore.type,
          bbox,
          conf,
          trackId: detBefore.trackId
        });
      }
    });

    this.logger.debug('DetectorPrecomputed', 'Interpolated detections', {
      timeMs,
      frameBefore: frameBefore.timeMs,
      frameAfter: frameAfter.timeMs,
      alpha,
      interpolatedCount: interpolated.length
    });

    return interpolated;
  }

  getMetadata(): DetectionData['metadata'] | null {
    return this.detectionData?.metadata || null;
  }

  getResolution(): { width: number; height: number } | null {
    return this.detectionData?.resolution || null;
  }

  getFPS(): number {
    return this.detectionData?.fps || 30;
  }

  isLoaded(): boolean {
    return this.detectionData !== null;
  }

  clear(): void {
    this.detectionData = null;
    this.frameIndex.clear();
    this.logger.info('DetectorPrecomputed', 'Cleared detection data');
  }

  // Get statistics about detections
  getStatistics(): {
    totalFrames: number;
    totalDetections: number;
    plateDetections: number;
    vehicleDetections: number;
    timeRange: { start: number; end: number };
    avgDetectionsPerFrame: number;
  } | null {
    if (!this.detectionData) return null;

    let totalDetections = 0;
    let plateDetections = 0;
    let vehicleDetections = 0;

    this.detectionData.frames.forEach(frame => {
      totalDetections += frame.detections.length;
      plateDetections += frame.detections.filter(d => d.type === 'plate').length;
      vehicleDetections += frame.detections.filter(d => d.type === 'vehicle').length;
    });

    const frames = this.detectionData.frames;
    const timeRange = frames.length > 0 
      ? { start: frames[0].timeMs, end: frames[frames.length - 1].timeMs }
      : { start: 0, end: 0 };

    return {
      totalFrames: frames.length,
      totalDetections,
      plateDetections,
      vehicleDetections,
      timeRange,
      avgDetectionsPerFrame: frames.length > 0 ? totalDetections / frames.length : 0
    };
  }
}
