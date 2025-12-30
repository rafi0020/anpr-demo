import { TraceLog } from '@/types';

export class TraceLogger {
  private logs: TraceLog[] = [];
  private maxLogs: number = 1000;
  private listeners: Set<(log: TraceLog) => void> = new Set();

  constructor(maxLogs: number = 1000) {
    this.maxLogs = maxLogs;
  }

  log(module: string, message: string, data: any = {}, level: TraceLog['level'] = 'info'): void {
    const log: TraceLog = {
      timestamp: Date.now(),
      module,
      message,
      data,
      level,
    };

    this.logs.push(log);

    // Keep logs under max limit
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(log));

    // Console output for debugging
    const consoleMethod = level === 'error' ? console.error : 
                         level === 'warn' ? console.warn : 
                         level === 'debug' ? console.debug : 
                         console.log;
    
    consoleMethod(`[${module}] ${message}`, data);
  }

  info(module: string, message: string, data: any = {}): void {
    this.log(module, message, data, 'info');
  }

  warn(module: string, message: string, data: any = {}): void {
    this.log(module, message, data, 'warn');
  }

  error(module: string, message: string, data: any = {}): void {
    this.log(module, message, data, 'error');
  }

  debug(module: string, message: string, data: any = {}): void {
    this.log(module, message, data, 'debug');
  }

  getLogs(filter?: { module?: string; level?: TraceLog['level'] }): TraceLog[] {
    if (!filter) return [...this.logs];

    return this.logs.filter(log => {
      if (filter.module && log.module !== filter.module) return false;
      if (filter.level && log.level !== filter.level) return false;
      return true;
    });
  }

  getRecentLogs(count: number = 50): TraceLog[] {
    return this.logs.slice(-count);
  }

  clearLogs(): void {
    this.logs = [];
  }

  subscribe(listener: (log: TraceLog) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  exportReport(): {
    summary: {
      totalLogs: number;
      byLevel: Record<TraceLog['level'], number>;
      byModule: Record<string, number>;
    };
    logs: TraceLog[];
    timeline: {
      startTime: number;
      endTime: number;
      duration: number;
    };
  } {
    const byLevel: Record<TraceLog['level'], number> = {
      info: 0,
      warn: 0,
      error: 0,
      debug: 0,
    };

    const byModule: Record<string, number> = {};

    this.logs.forEach(log => {
      byLevel[log.level]++;
      byModule[log.module] = (byModule[log.module] || 0) + 1;
    });

    const startTime = this.logs[0]?.timestamp || 0;
    const endTime = this.logs[this.logs.length - 1]?.timestamp || 0;

    return {
      summary: {
        totalLogs: this.logs.length,
        byLevel,
        byModule,
      },
      logs: [...this.logs],
      timeline: {
        startTime,
        endTime,
        duration: endTime - startTime,
      },
    };
  }

  // Format log for display
  formatLog(log: TraceLog): string {
    const date = new Date(log.timestamp);
    const time = date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit'
    });
    const ms = String(log.timestamp % 1000).padStart(3, '0');
    
    const levelEmoji = {
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      debug: '🔍',
    };

    return `${time}.${ms} ${levelEmoji[log.level]} [${log.module}] ${log.message}`;
  }

  // Get logs grouped by module
  getLogsByModule(): Map<string, TraceLog[]> {
    const grouped = new Map<string, TraceLog[]>();
    
    this.logs.forEach(log => {
      if (!grouped.has(log.module)) {
        grouped.set(log.module, []);
      }
      grouped.get(log.module)!.push(log);
    });

    return grouped;
  }

  // Get performance metrics
  getPerformanceMetrics(): {
    modules: Array<{
      name: string;
      count: number;
      duration: number;
      avgDuration: number;
    }>;
    totalDuration: number;
  } {
    const modules = new Map<string, { count: number; startTime: number; totalDuration: number }>();
    
    this.logs.forEach((log, index) => {
      if (!modules.has(log.module)) {
        modules.set(log.module, { count: 0, startTime: log.timestamp, totalDuration: 0 });
      }
      
      const moduleData = modules.get(log.module)!;
      moduleData.count++;
      
      // Calculate duration to next log
      if (index < this.logs.length - 1) {
        const nextLog = this.logs[index + 1];
        const duration = nextLog.timestamp - log.timestamp;
        moduleData.totalDuration += duration;
      }
    });

    const moduleMetrics = Array.from(modules.entries()).map(([name, data]) => ({
      name,
      count: data.count,
      duration: data.totalDuration,
      avgDuration: data.totalDuration / data.count,
    }));

    const totalDuration = this.logs.length > 0 
      ? this.logs[this.logs.length - 1].timestamp - this.logs[0].timestamp 
      : 0;

    return {
      modules: moduleMetrics,
      totalDuration,
    };
  }
}

// Singleton instance for global access
export const globalLogger = new TraceLogger();
