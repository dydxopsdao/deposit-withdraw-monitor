import { LogEntry } from "./types";

export const serializeError = (err: unknown) => {
  if (!err) return undefined;
  if (err instanceof Error) {
    const out: Record<string, unknown> = {
      name: err.name,
      message: err.message,
      stack: err.stack,
    };
    const anyErr = err as any;
    if (anyErr.code) out.code = anyErr.code;
    if (anyErr.cause) out.cause = serializeError(anyErr.cause);
    return out;
  }
  if (typeof err === "string") return { message: err };
  if (typeof err === "object") return { ...(err as Record<string, unknown>) };
  return { message: String(err) };
};

const DEFAULT_REDACT = new Set([
  "password","passphrase","secret","seed","mnemonic","privateKey",
  "token","authorization","apiKey","api_key","accessToken","refreshToken","wallet_seed","dydx_seed",
]);

export const safeStringify = (value: unknown, redactions = DEFAULT_REDACT, space?: number): string => {
  const seen = new WeakSet<object>();
  const redactKeys = new Set([...redactions].map(k => k.toLowerCase()));
  const shouldRedact = (key: string) => {
    const k = key.toLowerCase();
    if (redactKeys.has(k)) return true;
    // fuzzy: redact if any token appears in the key name
    for (const token of redactKeys) if (k.includes(token)) return true;
    return false;
  };

  const replacer = (key: string, val: any) => {
    if (shouldRedact(key)) return "[REDACTED]";
    if (typeof val === "bigint") return val.toString();
    if (val instanceof ArrayBuffer) {
      return Array.from(new Uint8Array(val)).map(b => b.toString(16).padStart(2, "0")).join("");
    }
    if (ArrayBuffer.isView(val)) return Array.from(new Uint8Array(val.buffer));
    if (val instanceof Set) return Array.from(val);
    if (val instanceof Map) return Object.fromEntries(val.entries());
    if (val instanceof Error) return serializeError(val);
    if (val && typeof val === "object") {
      if (seen.has(val)) return "[Circular]";
      seen.add(val);
    }
    return val;
  };
  return JSON.stringify(value, replacer, space);
};

export const formatters = {
  timestamp(): string {
    return new Date().toISOString();
  },

  pretty(entry: LogEntry): string {
    const base = `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}`;
    const ser = entry.error ? serializeError(entry.error) : undefined;
    const err = ser
      ? `\nError: ${("message" in ser && ser.message) || ""}\nStack: ${("stack" in ser && ser.stack) || ""}`
      : "";
  
    const meta = entry.metadata && Object.keys(entry.metadata).length
      ? `\nMetadata: ${safeStringify(entry.metadata, DEFAULT_REDACT, 2)}`
      : "";
  
    return `${base}${err}${meta}`;
  },

  json(entry: LogEntry): string {
    return safeStringify({ ...entry, error: serializeError(entry.error) });
  },
};
