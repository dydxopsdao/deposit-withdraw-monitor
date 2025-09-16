export type LogLevel =
  | "debug"
  | "info"
  | "step"
  | "success"
  | "warning"
  | "error";

export type LogMetadata = Record<string, unknown>;

export interface SerializedError {
  name?: string;
  message: string;
  stack?: string;
  cause?: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  metadata?: LogMetadata;
  error?: SerializedError;
}

export interface Logger {
  debug(message: string, metadata?: LogMetadata): void;
  info(message: string, metadata?: LogMetadata): void;
  step(message: string, metadata?: LogMetadata): void;
  success(message: string, metadata?: LogMetadata): void;
  warning(message: string, metadata?: LogMetadata): void;
  warn(message: string, metadata?: LogMetadata): void;

  // Overload-friendly: error or metadata in second position
  error(message: string, error?: Error | LogMetadata, metadata?: LogMetadata): void;
}

// ---------- Implementation (simple console JSON logger) ----------

const serializeError = (e: Error): SerializedError => ({
  name: e.name,
  message: e.message,
  stack: e.stack,
  // If you're using Error.cause in Node 16+, this preserves it as-is (not expanded)
  // cause: (e as any).cause,
});

export class ConsoleLogger implements Logger {
  debug(msg: string, metadata?: LogMetadata) { this.emit("debug", msg, undefined, metadata); }
  info(msg: string, metadata?: LogMetadata) { this.emit("info", msg, undefined, metadata); }
  step(msg: string, metadata?: LogMetadata) { this.emit("step", msg, undefined, metadata); }
  success(msg: string, metadata?: LogMetadata) { this.emit("success", msg, undefined, metadata); }
  warning(msg: string, metadata?: LogMetadata) { this.emit("warning", msg, undefined, metadata); }
  warn(msg: string, metadata?: LogMetadata) { this.warning(msg, metadata); }

  error(message: string, errorOrMeta?: Error | LogMetadata, metadata?: LogMetadata) {
    if (errorOrMeta instanceof Error) {
      this.emit("error", message, errorOrMeta, metadata);
    } else {
      // treating second arg as metadata
      this.emit("error", message, undefined, errorOrMeta);
    }
  }

  private emit(level: LogLevel, message: string, err?: Error, metadata?: LogMetadata) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata,
      error: err ? serializeError(err) : undefined,
    };

    const line = JSON.stringify(entry);
    if (level === "error" || level === "warning") {
      // Keep warnings/errors on stderr
      console.error(line);
    } else {
      console.log(line);
    }
  }
}
