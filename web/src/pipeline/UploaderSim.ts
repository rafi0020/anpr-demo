import { UploadPayload, ANPREvent } from '@/types';
import { TraceLogger } from './TraceLogger';

export class UploaderSim {
  private logger: TraceLogger;
  private uploadedEvents: ANPREvent[] = [];
  private baseDate: Date;

  constructor(logger: TraceLogger, baseDate?: Date) {
    this.logger = logger;
    this.baseDate = baseDate || new Date('2024-01-15T08:00:00Z'); // Demo base date
  }

  async uploadEvent(event: ANPREvent): Promise<boolean> {
    try {
      // Create upload payload
      const payload = this.createUploadPayload(event);

      // Simulate network delay
      await this.simulateNetworkDelay(500 + Math.random() * 1000);

      // Simulate occasional upload failures (5% chance)
      if (Math.random() < 0.05) {
        throw new Error('Simulated upload failure');
      }

      // Store event locally (simulating database)
      this.uploadedEvents.push(event);

      this.logger.info('UploaderSim', 'Event uploaded successfully', {
        eventId: event.id,
        plate: event.plate,
        status: event.status,
        confidence: event.confidence,
        payloadSize: JSON.stringify(payload).length
      });

      return true;
    } catch (error) {
      this.logger.error('UploaderSim', 'Upload failed', {
        eventId: event.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return false;
    }
  }

  private createUploadPayload(event: ANPREvent): UploadPayload {
    // Convert video timestamp to ISO string with base date
    const eventDate = new Date(this.baseDate.getTime() + event.timeMs);

    return {
      project_code: 'ANPR_DEMO',
      reg_number: event.plate,
      status: event.status,
      time: eventDate.toISOString(),
      category: 'Demo',
      gateAddress: event.gate,
      evidence: {
        frameTimeMs: event.evidence.frameTimeMs,
        trackId: event.trackId
      },
      confidence: event.confidence
    };
  }

  private async simulateNetworkDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getUploadedEvents(): ANPREvent[] {
    return [...this.uploadedEvents];
  }

  getEventsByPlate(plate: string): ANPREvent[] {
    return this.uploadedEvents.filter(event => event.plate === plate);
  }

  getEventsByStatus(status: 'ENTRY' | 'EXIT'): ANPREvent[] {
    return this.uploadedEvents.filter(event => event.status === status);
  }

  getEventsByGate(gate: string): ANPREvent[] {
    return this.uploadedEvents.filter(event => event.gate === gate);
  }

  getUploadStatistics(): {
    totalUploads: number;
    successfulUploads: number;
    failedUploads: number;
    avgConfidence: number;
    uniquePlates: number;
    eventsByStatus: Record<string, number>;
    eventsByGate: Record<string, number>;
  } {
    const successfulUploads = this.uploadedEvents.length;
    const failedUploads = 0; // In simulation, we don't track failures

    const confidences = this.uploadedEvents.map(e => e.confidence);
    const avgConfidence = confidences.length > 0
      ? confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length
      : 0;

    const uniquePlates = new Set(this.uploadedEvents.map(e => e.plate)).size;

    const eventsByStatus: Record<string, number> = {};
    const eventsByGate: Record<string, number> = {};

    this.uploadedEvents.forEach(event => {
      eventsByStatus[event.status] = (eventsByStatus[event.status] || 0) + 1;
      eventsByGate[event.gate] = (eventsByGate[event.gate] || 0) + 1;
    });

    return {
      totalUploads: successfulUploads + failedUploads,
      successfulUploads,
      failedUploads,
      avgConfidence,
      uniquePlates,
      eventsByStatus,
      eventsByGate
    };
  }

  // Simulate batch upload for multiple events
  async uploadBatch(events: ANPREvent[]): Promise<{
    successful: ANPREvent[];
    failed: ANPREvent[];
  }> {
    const results = {
      successful: [] as ANPREvent[],
      failed: [] as ANPREvent[]
    };

    this.logger.info('UploaderSim', 'Starting batch upload', {
      batchSize: events.length
    });

    // Upload events sequentially to simulate real-world constraints
    for (const event of events) {
      const success = await this.uploadEvent(event);
      if (success) {
        results.successful.push(event);
      } else {
        results.failed.push(event);
      }
    }

    this.logger.info('UploaderSim', 'Batch upload completed', {
      successful: results.successful.length,
      failed: results.failed.length,
      total: events.length
    });

    return results;
  }

  // Export upload history as JSON (for debugging/analysis)
  exportUploadHistory(): {
    events: ANPREvent[];
    statistics: ReturnType<UploaderSim['getUploadStatistics']>;
    exportTime: string;
  } {
    return {
      events: this.uploadedEvents,
      statistics: this.getUploadStatistics(),
      exportTime: new Date().toISOString()
    };
  }

  // Clear upload history
  clearHistory(): void {
    this.uploadedEvents = [];
    this.logger.info('UploaderSim', 'Upload history cleared');
  }

  // For demo purposes - simulate upload with custom payload
  async simulateUpload(plate: string, status: 'ENTRY' | 'EXIT', gate: string): Promise<UploadPayload> {
    const event: Partial<ANPREvent> = {
      id: `demo-${Date.now()}`,
      plate,
      status,
      gate,
      confidence: 0.87,
      timeMs: Date.now() % 10000, // Mock time
      evidence: {
        frameTimeMs: 3000,
        cropId: 'demo-crop',
        imageData: undefined
      }
    };

    const payload = this.createUploadPayload(event as ANPREvent);

    // Simulate upload
    await this.simulateNetworkDelay(300);
    this.uploadedEvents.push(event as ANPREvent);

    this.logger.info('UploaderSim', 'Demo upload simulated', {
      plate,
      status,
      gate,
      payload: JSON.stringify(payload).substring(0, 100) + '...'
    });

    return payload;
  }
}
