import { TraceLogger } from './TraceLogger';

export interface FrameCallback {
  (timeMs: number, frameNumber: number): void;
}

export class FrameSource {
  private video: HTMLVideoElement | null = null;
  private callback: FrameCallback | null = null;
  private logger: TraceLogger;
  private isAttached: boolean = false;
  private frameNumber: number = 0;
  private lastTimeMs: number = 0;
  private animationFrameId: number | null = null;

  constructor(logger: TraceLogger) {
    this.logger = logger;
  }

  attachVideo(video: HTMLVideoElement): void {
    if (this.isAttached) {
      this.detachVideo();
    }

    this.video = video;
    this.isAttached = true;
    this.frameNumber = 0;
    this.lastTimeMs = 0;

    // Set up event listeners
    this.video.addEventListener('loadedmetadata', this.onMetadataLoaded.bind(this));
    this.video.addEventListener('play', this.onPlay.bind(this));
    this.video.addEventListener('pause', this.onPause.bind(this));
    this.video.addEventListener('ended', this.onEnded.bind(this));
    this.video.addEventListener('seeked', this.onSeeked.bind(this));

    this.logger.info('FrameSource', 'Video attached', {
      videoId: video.id || 'unknown',
      duration: video.duration || 0,
      readyState: video.readyState
    });
  }

  detachVideo(): void {
    if (!this.isAttached || !this.video) return;

    // Remove event listeners
    this.video.removeEventListener('loadedmetadata', this.onMetadataLoaded.bind(this));
    this.video.removeEventListener('play', this.onPlay.bind(this));
    this.video.removeEventListener('pause', this.onPause.bind(this));
    this.video.removeEventListener('ended', this.onEnded.bind(this));
    this.video.removeEventListener('seeked', this.onSeeked.bind(this));

    // Cancel any pending animation frame
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.logger.info('FrameSource', 'Video detached');
    this.video = null;
    this.isAttached = false;
    this.callback = null;
  }

  setCallback(callback: FrameCallback): void {
    this.callback = callback;
    this.logger.debug('FrameSource', 'Callback set');
  }

  private onMetadataLoaded(): void {
    if (!this.video) return;

    this.logger.info('FrameSource', 'Video metadata loaded', {
      duration: this.video.duration,
      videoWidth: this.video.videoWidth,
      videoHeight: this.video.videoHeight
    });
  }

  private onPlay(): void {
    this.logger.info('FrameSource', 'Video started playing');
    this.startFrameLoop();
  }

  private onPause(): void {
    this.logger.info('FrameSource', 'Video paused');
    this.stopFrameLoop();
  }

  private onEnded(): void {
    this.logger.info('FrameSource', 'Video ended');
    this.stopFrameLoop();
  }

  private onSeeked(): void {
    if (!this.video) return;

    // Reset frame number on seek
    this.frameNumber = Math.floor(this.video.currentTime * 30); // Assume 30fps
    this.lastTimeMs = this.video.currentTime * 1000;

    this.logger.debug('FrameSource', 'Video seeked', {
      currentTime: this.video.currentTime,
      frameNumber: this.frameNumber
    });
  }

  private startFrameLoop(): void {
    if (!this.video || !this.callback) return;

    const frameLoop = () => {
      if (!this.video || !this.callback || this.video.paused || this.video.ended) {
        return;
      }

      const currentTimeMs = this.video.currentTime * 1000;

      // Only emit if time has changed significantly (avoid duplicate frames)
      if (Math.abs(currentTimeMs - this.lastTimeMs) >= 33) { // ~30fps
        this.frameNumber++;
        this.lastTimeMs = currentTimeMs;

        try {
          this.callback(currentTimeMs, this.frameNumber);
        } catch (error) {
          this.logger.error('FrameSource', 'Callback error', {
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      this.animationFrameId = requestAnimationFrame(frameLoop);
    };

    this.animationFrameId = requestAnimationFrame(frameLoop);
    this.logger.debug('FrameSource', 'Frame loop started');
  }

  private stopFrameLoop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
      this.logger.debug('FrameSource', 'Frame loop stopped');
    }
  }

  getCurrentTimeMs(): number {
    return this.video ? this.video.currentTime * 1000 : 0;
  }

  getFrameNumber(): number {
    return this.frameNumber;
  }

  isPlaying(): boolean {
    return this.video ? !this.video.paused && !this.video.ended : false;
  }

  getVideoInfo(): {
    duration: number;
    currentTime: number;
    width: number;
    height: number;
    readyState: number;
  } | null {
    if (!this.video) return null;

    return {
      duration: this.video.duration,
      currentTime: this.video.currentTime,
      width: this.video.videoWidth,
      height: this.video.videoHeight,
      readyState: this.video.readyState
    };
  }

  // For demo purposes - simulate frame callbacks
  simulateFrames(startTimeMs: number, endTimeMs: number, fps: number = 30): void {
    if (!this.callback) return;

    const frameInterval = 1000 / fps;
    let currentTime = startTimeMs;
    let frameNum = 0;

    const simulate = () => {
      if (currentTime >= endTimeMs) {
        this.logger.info('FrameSource', 'Frame simulation completed', {
          startTimeMs,
          endTimeMs,
          totalFrames: frameNum
        });
        return;
      }

      this.callback!(currentTime, frameNum);
      currentTime += frameInterval;
      frameNum++;

      // Simulate real-time playback
      setTimeout(simulate, frameInterval);
    };

    this.logger.info('FrameSource', 'Starting frame simulation', {
      startTimeMs,
      endTimeMs,
      fps
    });

    simulate();
  }

  // Seek to specific time
  seekTo(timeMs: number): void {
    if (!this.video) return;

    this.video.currentTime = timeMs / 1000;
    this.logger.debug('FrameSource', 'Seeked to time', { timeMs });
  }

  // Get playback statistics
  getStatistics(): {
    totalFrames: number;
    currentTimeMs: number;
    isPlaying: boolean;
    videoAttached: boolean;
  } {
    return {
      totalFrames: this.frameNumber,
      currentTimeMs: this.getCurrentTimeMs(),
      isPlaying: this.isPlaying(),
      videoAttached: this.isAttached
    };
  }
}
