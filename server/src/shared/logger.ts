/**
 * Structured logging with redaction built in.
 *
 * WHY NOT A LOGGING LIBRARY
 * -------------------------
 * The requirement that shapes this file is negative: the API key must never
 * reach a log line, an error report or a crash dump. That is easier to
 * guarantee in forty lines that redact on the way out than by configuring a
 * general-purpose logger correctly at every call site. One JSON object per
 * line is what log collectors want anyway.
 *
 * Every record carries a `requestId`, so an upstream timeout can be traced back
 * to the browser request that caused it.
 */
import { config } from '../config/index.js';

export const LOG_LEVELS = ['debug', 'info', 'warn', 'error', 'silent'] as const;

export type LogLevel = (typeof LOG_LEVELS)[number];

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 100,
};

/**
 * Keys whose values never appear in a log line.
 *
 * Matched case-insensitively against the whole key, so `apiKey`, `API_KEY` and
 * `officegestApiKey` are all covered by `apikey`.
 */
const REDACTED_KEY_PATTERN =
  /(authorization|api[-_]?key|password|passwd|secret|token|credential|cookie|set-cookie|session)/i;

export const REDACTED = '[REDACTED]';

/** Anything a log record can carry. */
export type LogFields = Record<string, unknown>;

/**
 * Replaces the value of every sensitive-looking key, at any depth.
 *
 * Redacting by key name rather than by value means a credential is hidden even
 * when nobody remembered it would be there — a whole `headers` object logged by
 * accident comes out safe.
 */
export function redact(value: unknown, depth = 0): unknown {
  if (depth > 6 || value === null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redact(entry, depth + 1));
  }

  if (value instanceof Error) {
    return { name: value.name, message: value.message };
  }

  const output: LogFields = {};

  for (const [key, entry] of Object.entries(value as LogFields)) {
    output[key] = REDACTED_KEY_PATTERN.test(key) ? REDACTED : redact(entry, depth + 1);
  }

  return output;
}

export interface Logger {
  debug(message: string, fields?: LogFields): void;
  info(message: string, fields?: LogFields): void;
  warn(message: string, fields?: LogFields): void;
  error(message: string, fields?: LogFields): void;
  /** Derives a logger that stamps `fields` onto every record — e.g. a requestId. */
  child(fields: LogFields): Logger;
}

function write(level: Exclude<LogLevel, 'silent'>, message: string, fields: LogFields): void {
  if (LEVEL_RANK[level] < LEVEL_RANK[config.logLevel]) {
    return;
  }

  const record = {
    level,
    time: new Date().toISOString(),
    message,
    ...(redact(fields) as LogFields),
  };

  const line = JSON.stringify(record);

  if (level === 'error' || level === 'warn') {
    process.stderr.write(`${line}\n`);
  } else {
    process.stdout.write(`${line}\n`);
  }
}

function createLogger(base: LogFields): Logger {
  return {
    debug: (message, fields) => write('debug', message, { ...base, ...fields }),
    info: (message, fields) => write('info', message, { ...base, ...fields }),
    warn: (message, fields) => write('warn', message, { ...base, ...fields }),
    error: (message, fields) => write('error', message, { ...base, ...fields }),
    child: (fields) => createLogger({ ...base, ...fields }),
  };
}

/** The process-wide logger. Prefer `request.log`, which is scoped to a request. */
export const logger: Logger = createLogger({});
