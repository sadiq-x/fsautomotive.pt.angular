/**
 * The request log line.
 *
 * Both properties pinned here were wrong in production logs and made them
 * misleading rather than merely sparse: an abandoned request was recorded as
 * `status: 200` on `path: "/"`, so it read as a success against the wrong route.
 */
import { EventEmitter } from 'node:events';
import type { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';

import { requestLogger } from './request-logger.middleware.js';

function run(options: {
  originalUrl: string;
  /** Express rewrites `req.path` as the routers nest; the logger must not use it. */
  pathWhenCallbackFires: string;
  headersSent: boolean;
  statusCode: number;
  writableEnded: boolean;
  event: 'finish' | 'close';
}) {
  const info = vi.fn();
  const res = new EventEmitter() as unknown as Response & EventEmitter;
  Object.assign(res, {
    headersSent: options.headersSent,
    statusCode: options.statusCode,
    writableEnded: options.writableEnded,
  });

  const req = {
    method: 'GET',
    originalUrl: options.originalUrl,
    path: '/',
    query: { page: '1', search: 'Maria Silva' },
    log: { info },
  } as unknown as Request;

  requestLogger()(req, res, vi.fn());

  // Whatever the router left behind by the time the socket event fires.
  (req as { path: string }).path = options.pathWhenCallbackFires;
  res.emit(options.event);

  return info.mock.calls[0]?.[1] as Record<string, unknown>;
}

describe('requestLogger', () => {
  it('logs the full path even when the router has rewritten req.path', () => {
    const fields = run({
      originalUrl: '/api/officegest/customers?page=1&perPage=25',
      pathWhenCallbackFires: '/',
      headersSent: false,
      statusCode: 200,
      writableEnded: false,
      event: 'close',
    });

    expect(fields['path']).toBe('/api/officegest/customers');
  });

  /**
   * Nothing was written, so `res.statusCode` is still Node's default 200.
   * Logging it made every abandoned request look like a served one — including
   * to anything counting successes.
   */
  it('does not report an abandoned request as a 200', () => {
    const fields = run({
      originalUrl: '/api/officegest/customers?page=1',
      pathWhenCallbackFires: '/',
      headersSent: false,
      statusCode: 200,
      writableEnded: false,
      event: 'close',
    });

    expect(fields['status']).toBe(499);
    expect(fields['outcome']).toBe('aborted');
  });

  it('reports the real status once a response was sent', () => {
    const fields = run({
      originalUrl: '/api/officegest/customers',
      pathWhenCallbackFires: '/api/officegest/customers',
      headersSent: true,
      statusCode: 502,
      writableEnded: true,
      event: 'finish',
    });

    expect(fields['status']).toBe(502);
    expect(fields['outcome']).toBe('finished');
  });

  // A search term can be a customer's name or plate.
  it('logs query parameter names but never their values', () => {
    const fields = run({
      originalUrl: '/api/officegest/customers?page=1&search=Maria%20Silva',
      pathWhenCallbackFires: '/',
      headersSent: true,
      statusCode: 200,
      writableEnded: true,
      event: 'finish',
    });

    expect(fields['queryKeys']).toEqual(['page', 'search']);
    expect(JSON.stringify(fields)).not.toContain('Maria');
  });
});
