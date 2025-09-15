import { LogLevel, LogMetadata, Logger } from './types';
import { formatters } from './formatters';

class ConsoleLogger implements Logger {
  // TODO: Make log level configurable via env (e.g. LOG_LEVEL)
  private createLogEntry(level: LogLevel, message: string, metadata?: LogMetadata, error?: Error) {
    return {
      timestamp: formatters.timestamp(),
      level,
      message,
      metadata,
      error,
    };
  }

  private log(level: LogLevel, message: string, metadata?: LogMetadata, error?: Error) {
    // TODO: Integrate with Playwright attachments (e.g. attach screenshots on error)
    // and include test info context (route_id, wallet, etc.) if available.
    const entry = this.createLogEntry(level, message, metadata, error);
    const formattedMessage = formatters.pretty(entry);

    switch (level) {
      case 'error':
        console.error(formattedMessage);
        break;
      case 'warning':
        console.warn(formattedMessage);
        break;
      default:
        console.log(formattedMessage);
    }
  }

  debug(message: string, metadata?: LogMetadata): void {
    this.log('debug', message, metadata);
  }

  info(message: string, metadata?: LogMetadata): void {
    this.log('info', message, metadata);
  }

  step(message: string, metadata?: LogMetadata): void {
    this.log('step', message, metadata);
  }

  success(message: string, metadata?: LogMetadata): void {
    this.log('success', message, metadata);
  }

  warning(message: string, metadata?: LogMetadata): void {
    this.log('warning', message, metadata);
  }

  error(message: string, error?: Error, metadata?: LogMetadata): void {
    this.log('error', message, metadata, error);
  }

  warn(message: string, metadata?: LogMetadata): void {
    this.warning(message, metadata);
  }
}

// Create a singleton instance
export const logger = new ConsoleLogger();
