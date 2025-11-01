/**
 * LogService - Singleton for non-blocking error and info logging
 *
 * Stores logs in memory and allows components to subscribe to updates.
 * Severity levels: info, warn, error
 * Errors trigger toasts automatically
 */

export type LogSeverity = 'info' | 'warn' | 'error';

export interface LogEntry {
  id: string;
  timestamp: number;
  severity: LogSeverity;
  message: string;
  details?: string;
  stack?: string;
  metadata?: Record<string, any>;
}

type LogListener = (logs: LogEntry[]) => void;

class LogService {
  private logs: LogEntry[] = [];
  private listeners: Set<LogListener> = new Set();
  private maxLogs = 100;

  /**
   * Subscribe to log updates
   */
  subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    // Immediately notify with current logs
    listener(this.logs);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Add a log entry
   */
  log(severity: LogSeverity, message: string, details?: string, metadata?: Record<string, any>): void {
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      severity,
      message,
      details,
      metadata,
    };

    // Add to logs array (keep last maxLogs entries)
    this.logs = [...this.logs, entry].slice(-this.maxLogs);

    // Notify all listeners
    this.notifyListeners();

    // Console log for development
    const consoleMethod = severity === 'error' ? 'error' : severity === 'warn' ? 'warn' : 'info';
    console[consoleMethod](`[AlgorithmLens] ${message}`, details || '', metadata || '');
  }

  /**
   * Convenience methods
   */
  info(message: string, details?: string, metadata?: Record<string, any>): void {
    this.log('info', message, details, metadata);
  }

  warn(message: string, details?: string, metadata?: Record<string, any>): void {
    this.log('warn', message, details, metadata);
  }

  error(message: string, details?: string, metadata?: Record<string, any>): void {
    this.log('error', message, details, metadata);
  }

  /**
   * Get current logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Clear all logs
   */
  clear(): void {
    this.logs = [];
    this.notifyListeners();
  }

  /**
   * Get error count (for badge)
   */
  getErrorCount(): number {
    return this.logs.filter(log => log.severity === 'error').length;
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.logs));
  }
}

// Export singleton instance
export const logService = new LogService();
