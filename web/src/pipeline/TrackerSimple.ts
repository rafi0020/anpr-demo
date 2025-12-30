import { Detection, Track, BBoxArray } from '@/types';
import { TraceLogger } from './TraceLogger';

export class TrackerSimple {
  private tracks: Map<string, Track> = new Map();
  private nextTrackId: number = 1;
  private logger: TraceLogger;
  
  // Tracking parameters
  private iouThreshold: number = 0.3;
  private maxLostFrames: number = 10;
  private minDetections: number = 3;
  private frameCount: number = 0;

  constructor(logger: TraceLogger, config?: {
    iouThreshold?: number;
    maxLostFrames?: number;
    minDetections?: number;
  }) {
    this.logger = logger;
    this.iouThreshold = config?.iouThreshold ?? this.iouThreshold;
    this.maxLostFrames = config?.maxLostFrames ?? this.maxLostFrames;
    this.minDetections = config?.minDetections ?? this.minDetections;
  }

  update(detections: Detection[], timeMs: number): Track[] {
    this.frameCount++;
    
    this.logger.debug('TrackerSimple', 'Update cycle', {
      frameCount: this.frameCount,
      timeMs,
      detectionCount: detections.length,
      activeTrackCount: this.getActiveTracks().length
    });

    // Update existing tracks to 'lost' if not matched
    this.tracks.forEach(track => {
      if (track.status === 'active') {
        track.status = 'lost';
      }
    });

    // Match detections to existing tracks
    const unmatchedDetections: Detection[] = [];
    
    for (const detection of detections) {
      if (detection.type !== 'plate') continue;
      
      let bestMatch: Track | null = null;
      let bestIOU = 0;

      // Find best matching track
      this.tracks.forEach(track => {
        if (track.status === 'finished') return;
        
        const iou = this.calculateIOU(detection.bbox, track.bbox);
        if (iou > this.iouThreshold && iou > bestIOU) {
          bestIOU = iou;
          bestMatch = track;
        }
      });

      if (bestMatch !== null) {
        // Update existing track
        this.updateTrack(bestMatch, detection, timeMs);
        
        // Assign trackId to detection
        detection.trackId = (bestMatch as Track).id;
        
        this.logger.debug('TrackerSimple', 'Matched detection to track', {
          trackId: (bestMatch as Track).id,
          iou: bestIOU,
          confidence: detection.conf
        });
      } else {
        unmatchedDetections.push(detection);
      }
    }

    // Create new tracks for unmatched detections
    for (const detection of unmatchedDetections) {
      const newTrack = this.createTrack(detection, timeMs);
      detection.trackId = newTrack.id;
      
      this.logger.info('TrackerSimple', 'Created new track', {
        trackId: newTrack.id,
        bbox: detection.bbox,
        confidence: detection.conf
      });
    }

    // Handle lost tracks
    this.handleLostTracks(timeMs);

    // Return active tracks
    return this.getActiveTracks();
  }

  private createTrack(detection: Detection, timeMs: number): Track {
    const track: Track = {
      id: String(this.nextTrackId++),
      status: 'active',
      startTime: timeMs,
      lastSeen: timeMs,
      detections: [detection],
      bbox: [...detection.bbox] as BBoxArray,
      confidence: detection.conf
    };

    this.tracks.set(String(track.id), track);
    return track;
  }

  private updateTrack(track: Track, detection: Detection, timeMs: number): void {
    track.status = 'active';
    track.lastSeen = timeMs;
    track.detections.push(detection);
    track.bbox = [...detection.bbox] as BBoxArray;
    track.confidence = (track.confidence * 0.7 + detection.conf * 0.3); // Weighted average
  }

  private handleLostTracks(timeMs: number): void {
    const tracksToFinish: string[] = [];

    this.tracks.forEach((track, trackId) => {
      if (track.status === 'lost') {
        const framesLost = Math.round((timeMs - track.lastSeen) / 33); // Assuming ~30fps
        
        if (framesLost > this.maxLostFrames) {
          // Mark track as finished if lost for too long
          track.status = 'finished';
          tracksToFinish.push(trackId);
          
          this.logger.info('TrackerSimple', 'Track finished', {
            trackId: track.id,
            duration: timeMs - track.startTime,
            detectionCount: track.detections.length
          });
        }
      }
    });

    // Clean up old finished tracks (keep last 10 for reference)
    const finishedTracks = Array.from(this.tracks.values())
      .filter(t => t.status === 'finished')
      .sort((a, b) => b.lastSeen - a.lastSeen);
    
    if (finishedTracks.length > 10) {
      finishedTracks.slice(10).forEach(track => {
        this.tracks.delete(String(track.id));
        this.logger.debug('TrackerSimple', 'Removed old track', { trackId: track.id });
      });
    }
  }

  private calculateIOU(bbox1: BBoxArray, bbox2: BBoxArray): number {
    const [x1_1, y1_1, x2_1, y2_1] = bbox1;
    const [x1_2, y1_2, x2_2, y2_2] = bbox2;

    // Calculate intersection
    const xLeft = Math.max(x1_1, x1_2);
    const yTop = Math.max(y1_1, y1_2);
    const xRight = Math.min(x2_1, x2_2);
    const yBottom = Math.min(y2_1, y2_2);

    if (xRight < xLeft || yBottom < yTop) {
      return 0; // No intersection
    }

    const intersectionArea = (xRight - xLeft) * (yBottom - yTop);

    // Calculate union
    const area1 = (x2_1 - x1_1) * (y2_1 - y1_1);
    const area2 = (x2_2 - x1_2) * (y2_2 - y1_2);
    const unionArea = area1 + area2 - intersectionArea;

    return intersectionArea / unionArea;
  }

  getTrack(trackId: string | number): Track | null {
    return this.tracks.get(String(trackId)) || null;
  }

  getActiveTracks(): Track[] {
    return Array.from(this.tracks.values()).filter(t => t.status === 'active');
  }

  getLostTracks(): Track[] {
    return Array.from(this.tracks.values()).filter(t => t.status === 'lost');
  }

  getFinishedTracks(): Track[] {
    return Array.from(this.tracks.values()).filter(t => t.status === 'finished');
  }

  getAllTracks(): Track[] {
    return Array.from(this.tracks.values());
  }

  reset(): void {
    this.tracks.clear();
    this.nextTrackId = 1;
    this.frameCount = 0;
    this.logger.info('TrackerSimple', 'Tracker reset');
  }

  // Get track statistics
  getStatistics(): {
    totalTracks: number;
    activeTracks: number;
    lostTracks: number;
    finishedTracks: number;
    avgTrackDuration: number;
    avgDetectionsPerTrack: number;
  } {
    const tracks = Array.from(this.tracks.values());
    const activeTracks = tracks.filter(t => t.status === 'active');
    const lostTracks = tracks.filter(t => t.status === 'lost');
    const finishedTracks = tracks.filter(t => t.status === 'finished');

    let totalDuration = 0;
    let totalDetections = 0;

    tracks.forEach(track => {
      totalDuration += track.lastSeen - track.startTime;
      totalDetections += track.detections.length;
    });

    return {
      totalTracks: tracks.length,
      activeTracks: activeTracks.length,
      lostTracks: lostTracks.length,
      finishedTracks: finishedTracks.length,
      avgTrackDuration: tracks.length > 0 ? totalDuration / tracks.length : 0,
      avgDetectionsPerTrack: tracks.length > 0 ? totalDetections / tracks.length : 0
    };
  }

  // Check if a point is inside a track's bounding box
  isPointInTrack(x: number, y: number, trackId: string | number): boolean {
    const track = this.getTrack(trackId);
    if (!track) return false;

    const [x1, y1, x2, y2] = track.bbox;
    return x >= x1 && x <= x2 && y >= y1 && y <= y2;
  }

  // Get track history for visualization
  getTrackHistory(trackId: string | number, maxPoints: number = 50): Array<{
    timeMs: number;
    bbox: BBoxArray;
    confidence: number;
  }> {
    const track = this.getTrack(trackId);
    if (!track) return [];

    const history = track.detections.slice(-maxPoints).map(det => ({
      timeMs: track.startTime, // Note: we don't store individual detection times
      bbox: det.bbox,
      confidence: det.conf
    }));

    return history;
  }

  // Predict next position (simple linear extrapolation)
  predictNextPosition(trackId: string | number): BBoxArray | null {
    const track = this.getTrack(trackId);
    if (!track || track.detections.length < 2) return null;

    const recent = track.detections.slice(-2);
    const [prev, curr] = recent;

    // Calculate velocity
    const vx1 = curr.bbox[0] - prev.bbox[0];
    const vy1 = curr.bbox[1] - prev.bbox[1];
    const vx2 = curr.bbox[2] - prev.bbox[2];
    const vy2 = curr.bbox[3] - prev.bbox[3];

    // Predict next position
    const predicted: BBoxArray = [
      curr.bbox[0] + vx1,
      curr.bbox[1] + vy1,
      curr.bbox[2] + vx2,
      curr.bbox[3] + vy2
    ];

    return predicted;
  }
}
