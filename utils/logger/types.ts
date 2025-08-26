export type LogLevel =
  | "debug"
  | "info"
  | "step"
  | "success"
  | "warning"
  | "error";

export interface LogMetadata {
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  metadata?: LogMetadata;
  error?: Error;
}

export interface Logger {
  debug(message: string, metadata?: LogMetadata): void;
  info(message: string, metadata?: LogMetadata): void;
  step(message: string, metadata?: LogMetadata): void;
  success(message: string, metadata?: LogMetadata): void;
  warning(message: string, metadata?: LogMetadata): void;
  warn(message: string, metadata?: LogMetadata): void;
  error(message: string, error?: Error, metadata?: LogMetadata): void;
}
