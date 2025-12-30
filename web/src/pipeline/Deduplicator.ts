import { DeduplicationResult, ANPREvent } from '@/types';
import { TraceLogger } from './TraceLogger';

export class Deduplicator {
  private logger: TraceLogger;
  private recentEvents: ANPREvent[] = [];
  private maxHistorySize: number = 100;
  private sameDirectionWindow: number = 5 * 60 * 1000; // 5 minutes
  private oppositeDirectionWindow: number = 3 * 60 * 1000; // 3 minutes

  constructor(logger: TraceLogger, config?: {
    maxHistorySize?: number;
    sameDirectionWindow?: number;
    oppositeDirectionWindow?: number;
  }) {
    this.logger = logger;
    this.maxHistorySize = config?.maxHistorySize ?? this.maxHistorySize;
    this.sameDirectionWindow = config?.sameDirectionWindow ?? this.sameDirectionWindow;
    this.oppositeDirectionWindow = config?.oppositeDirectionWindow ?? this.oppositeDirectionWindow;
  }

  checkDuplicate(newEvent: ANPREvent): DeduplicationResult {
    const now = new Date(newEvent.timestamp).getTime();
    const newEventTime = newEvent.timeMs;

    // Filter recent events within relevant time windows
    const relevantEvents = this.recentEvents.filter(event => {
      const eventTime = new Date(event.timestamp).getTime();
      const timeDiff = Math.abs(now - eventTime);

      // Check if within time window based on direction
      if (event.status === newEvent.status) {
        // Same direction (ENTRY-ENTRY or EXIT-EXIT)
        return timeDiff <= this.sameDirectionWindow;
      } else {
        // Opposite direction (ENTRY-EXIT or EXIT-ENTRY)
        return timeDiff <= this.oppositeDirectionWindow;
      }
    });

    // Check for exact plate matches
    const duplicateEvent = relevantEvents.find(event =>
      event.plate === newEvent.plate
    );

    if (duplicateEvent) {
      const timeDiff = Math.abs(newEventTime - duplicateEvent.timeMs);
      const result: DeduplicationResult = {
        isDuplicate: true,
        reason: `Duplicate plate detected within ${Math.round(timeDiff / 1000)}s`,
        previousEvent: duplicateEvent,
        timeDiff
      };

      this.logger.warn('Deduplicator', 'Duplicate event detected', {
        newEventId: newEvent.id,
        duplicateEventId: duplicateEvent.id,
        plate: newEvent.plate,
        timeDiff: timeDiff / 1000,
        direction: newEvent.status
      });

      return result;
    }

    // No duplicate found, add to history
    this.addToHistory(newEvent);

    const result: DeduplicationResult = {
      isDuplicate: false,
      reason: 'No duplicate detected'
    };

    this.logger.debug('Deduplicator', 'No duplicate found', {
      eventId: newEvent.id,
      plate: newEvent.plate,
      direction: newEvent.status,
      checkedEvents: relevantEvents.length
    });

    return result;
  }

  private addToHistory(event: ANPREvent): void {
    this.recentEvents.push(event);

    // Maintain max history size
    if (this.recentEvents.length > this.maxHistorySize) {
      this.recentEvents.shift(); // Remove oldest
    }

    this.logger.debug('Deduplicator', 'Added event to history', {
      eventId: event.id,
      historySize: this.recentEvents.length
    });
  }

  getRecentEvents(limit: number = 10): ANPREvent[] {
    return this.recentEvents.slice(-limit);
  }

  getEventsByPlate(plate: string): ANPREvent[] {
    return this.recentEvents.filter(event => event.plate === plate);
  }

  getEventsByDirection(status: 'ENTRY' | 'EXIT'): ANPREvent[] {
    return this.recentEvents.filter(event => event.status === status);
  }

  getStatistics(): {
    totalEvents: number;
    entryEvents: number;
    exitEvents: number;
    uniquePlates: number;
    avgTimeBetweenDuplicates: number;
    recentDuplicates: number;
  } {
    const entryEvents = this.recentEvents.filter(e => e.status === 'ENTRY').length;
    const exitEvents = this.recentEvents.filter(e => e.status === 'EXIT').length;
    const uniquePlates = new Set(this.recentEvents.map(e => e.plate)).size;

    // Calculate average time between duplicates (simplified)
    const duplicateTimes: number[] = [];
    const plateGroups = new Map<string, ANPREvent[]>();

    this.recentEvents.forEach(event => {
      if (!plateGroups.has(event.plate)) {
        plateGroups.set(event.plate, []);
      }
      plateGroups.get(event.plate)!.push(event);
    });

    plateGroups.forEach(events => {
      if (events.length > 1) {
        events.sort((a, b) => a.timeMs - b.timeMs);
        for (let i = 1; i < events.length; i++) {
          duplicateTimes.push(events[i].timeMs - events[i-1].timeMs);
        }
      }
    });

    const avgTimeBetweenDuplicates = duplicateTimes.length > 0
      ? duplicateTimes.reduce((sum, diff) => sum + diff, 0) / duplicateTimes.length
      : 0;

    // Count recent duplicates (within last hour)
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const recentDuplicates = this.recentEvents.filter(event => {
      const eventTime = new Date(event.timestamp).getTime();
      return eventTime > oneHourAgo && event.deduplication.isDuplicate;
    }).length;

    return {
      totalEvents: this.recentEvents.length,
      entryEvents,
      exitEvents,
      uniquePlates,
      avgTimeBetweenDuplicates,
      recentDuplicates
    };
  }

  clearHistory(): void {
    this.recentEvents = [];
    this.logger.info('Deduplicator', 'History cleared');
  }

  // For demo purposes - simulate deduplication check
  simulateCheck(plate: string, _status: 'ENTRY' | 'EXIT'): DeduplicationResult {
    // For demo, always return no duplicate for the expected plate
    if (plate === 'সখী-বয-যায়র') {
      return {
        isDuplicate: false,
        reason: 'No duplicate detected'
      };
    }

    // For other plates, occasionally simulate duplicates
    const shouldDuplicate = Math.random() < 0.1; // 10% chance
    if (shouldDuplicate) {
      return {
        isDuplicate: true,
        reason: 'Simulated duplicate for demo',
        timeDiff: Math.floor(Math.random() * 300) + 60 // 1-5 minutes ago
      };
    }

    return {
      isDuplicate: false,
      reason: 'No duplicate detected'
    };
  }
}
