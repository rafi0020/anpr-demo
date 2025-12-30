import { CropImage, Session, Track, Detection } from '@/types';
import { TraceLogger } from './TraceLogger';

export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private logger: TraceLogger;

  // Configuration
  private maxSessionFrames: number = 20;
  private disappearThreshold: number = 5000; // ms
  private minSessionFrames: number = 3;

  constructor(logger: TraceLogger, config?: {
    maxSessionFrames?: number;
    disappearThreshold?: number;
    minSessionFrames?: number;
  }) {
    this.logger = logger;
    this.maxSessionFrames = config?.maxSessionFrames ?? this.maxSessionFrames;
    this.disappearThreshold = config?.disappearThreshold ?? this.disappearThreshold;
    this.minSessionFrames = config?.minSessionFrames ?? this.minSessionFrames;
  }

  update(track: Track, detection: Detection, timeMs: number, cropImage?: CropImage): void {
    const trackId = track.id.toString();

    if (!this.sessions.has(trackId)) {
      // Create new session
      this.createSession(track, detection, timeMs, cropImage);
    } else {
      // Update existing session
      this.updateSession(trackId, track, detection, timeMs, cropImage);
    }
  }

  private createSession(track: Track, _detection: Detection, timeMs: number, cropImage?: CropImage): void {
    const trackId = track.id.toString();

    const session: Session = {
      trackId,
      startMs: timeMs,
      endMs: timeMs,
      crops: cropImage ? [cropImage] : [],
      status: 'active',
    };

    this.sessions.set(trackId, session);

    this.logger.info('SessionManager', 'Created new session', {
      trackId,
      timeMs,
      hasCrop: !!cropImage
    });
  }

  private updateSession(trackId: string, _track: Track, _detection: Detection, timeMs: number, cropImage?: CropImage): void {
    const session = this.sessions.get(trackId);
    if (!session) return;

    session.endMs = timeMs;

    if (cropImage) {
      session.crops.push(cropImage);

      // Check if we've reached max frames
      if (session.crops.length >= this.maxSessionFrames) {
        this.finalizeSession(trackId, 'max_frames_reached');
      }
    }

    this.logger.debug('SessionManager', 'Updated session', {
      trackId,
      cropCount: session.crops.length,
      duration: timeMs - session.startMs
    });
  }

  handleTrackLost(trackId: string, lastSeen: number): void {
    const session = this.sessions.get(trackId);
    if (!session || session.status !== 'active') return;

    // Check if track has been lost long enough to finalize
    const timeSinceLastSeen = Date.now() - lastSeen;

    if (timeSinceLastSeen >= this.disappearThreshold) {
      this.finalizeSession(trackId, 'track_lost');
    }
  }

  finalizeSession(trackId: string, reason: string): Session | null {
    const session = this.sessions.get(trackId);
    if (!session || session.status !== 'active') return null;

    // Check minimum frame requirement
    if (session.crops.length < this.minSessionFrames) {
      this.logger.warn('SessionManager', 'Session too short, discarding', {
        trackId,
        cropCount: session.crops.length,
        minRequired: this.minSessionFrames
      });
      this.sessions.delete(trackId);
      return null;
    }

    session.status = 'finalized';

    this.logger.info('SessionManager', 'Finalized session', {
      trackId,
      cropCount: session.crops.length,
      duration: session.endMs - session.startMs,
      reason
    });

    return session;
  }

  getActiveSessions(): Session[] {
    return Array.from(this.sessions.values()).filter(s => s.status === 'active');
  }

  getFinalizedSessions(): Session[] {
    return Array.from(this.sessions.values()).filter(s => s.status === 'finalized');
  }

  getSession(trackId: string): Session | null {
    return this.sessions.get(trackId) || null;
  }

  getAllSessions(): Session[] {
    return Array.from(this.sessions.values());
  }

  clearOldSessions(maxAge: number = 30000): void {
    const cutoff = Date.now() - maxAge;
    const toDelete: string[] = [];

    this.sessions.forEach((session, trackId) => {
      if (session.endMs < cutoff && session.status === 'finalized') {
        toDelete.push(trackId);
      }
    });

    toDelete.forEach(trackId => {
      this.sessions.delete(trackId);
    });

    if (toDelete.length > 0) {
      this.logger.info('SessionManager', 'Cleared old sessions', {
        count: toDelete.length
      });
    }
  }

  reset(): void {
    this.sessions.clear();
    this.logger.info('SessionManager', 'Reset all sessions');
  }

  getStatistics(): {
    totalSessions: number;
    activeSessions: number;
    finalizedSessions: number;
    totalCrops: number;
    avgSessionDuration: number;
    avgCropsPerSession: number;
  } {
    const sessions = Array.from(this.sessions.values());
    const activeSessions = sessions.filter(s => s.status === 'active');
    const finalizedSessions = sessions.filter(s => s.status === 'finalized');

    let totalDuration = 0;
    let totalCrops = 0;

    sessions.forEach(session => {
      totalDuration += session.endMs - session.startMs;
      totalCrops += session.crops.length;
    });

    return {
      totalSessions: sessions.length,
      activeSessions: activeSessions.length,
      finalizedSessions: finalizedSessions.length,
      totalCrops,
      avgSessionDuration: sessions.length > 0 ? totalDuration / sessions.length : 0,
      avgCropsPerSession: sessions.length > 0 ? totalCrops / sessions.length : 0
    };
  }
}
