#!/usr/bin/env node
/**
 * Process entry point: configuration, listener, and a shutdown that finishes
 * what it started.
 *
 * WHY THE GRACEFUL SHUTDOWN IS NOT OPTIONAL
 * -----------------------------------------
 * Every deploy sends `SIGTERM`. Exiting immediately drops the requests already
 * in flight — including, on the write path, one that may have created an
 * appointment in OfficeGest whose confirmation the caller never receives.
 * Closing the listener first (no new connections) and then waiting for the open
 * ones turns a routine deploy into a non-event. The timeout exists because a
 * stuck connection must not block the deploy forever.
 *
 * WHY CONFIGURATION IS READ BEFORE ANYTHING ELSE
 * ----------------------------------------------
 * Importing `config` validates the environment. A missing `OFFICEGEST_API_KEY`
 * fails here, loudly, in one line — not on the first request that needed it.
 */
import type { Server } from 'node:http';

import { createApp } from './app.js';
import { config, EnvValidationError } from './config/index.js';
import { createContainer, type Container } from './container.js';
import { logger } from './shared/logger.js';

/** How long in-flight requests get once the listener is closed. */
const SHUTDOWN_TIMEOUT_MS = 10_000;

function start(): void {
  const container = createContainer();
  const app = createApp(container);

  const server = app.listen(config.port, () => {
    logger.info('server listening', {
      port: config.port,
      environment: config.env,
      officegestBaseUrl: config.officegest.baseUrl,
      officegestAuthMode: config.officegest.credentials.mode,
      // Named `authGuard`, not `apiKeyGuard`: the redactor blanks any field
      // whose name looks like a key, and this one is a status worth reading.
      authGuard: config.apiKeys.length > 0 ? 'enabled' : 'disabled',
      corsOrigins: config.cors.allowedOrigins.length,
    });
  });

  installShutdownHandlers(server, container);
  installCrashHandlers();
}

function installShutdownHandlers(server: Server, container: Container): void {
  let shuttingDown = false;

  const shutdown = (signal: string): void => {
    // A second Ctrl-C should not start a second shutdown.
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    logger.info('shutting down', { signal });

    const forceExit = setTimeout(() => {
      logger.error('shutdown timed out; exiting with connections still open', {
        timeoutMs: SHUTDOWN_TIMEOUT_MS,
      });
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);

    // Do not keep the process alive purely to wait for its own exit timer.
    forceExit.unref?.();

    server.close(() => {
      void container
        .shutdown()
        .catch((error: unknown) => {
          logger.warn('error while releasing the OfficeGest session', {
            error: error instanceof Error ? error.message : String(error),
          });
        })
        .finally(() => {
          clearTimeout(forceExit);
          logger.info('shutdown complete');
          process.exit(0);
        });
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

/**
 * After an uncaught exception the process state is unknown, so the only honest
 * response is to log it and let the supervisor restart cleanly. Continuing
 * would serve requests from a process that has already failed once.
 */
function installCrashHandlers(): void {
  process.on('uncaughtException', (error) => {
    logger.error('uncaught exception', { error });
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('unhandled promise rejection', {
      error: reason instanceof Error ? reason : String(reason),
    });
    process.exit(1);
  });
}

try {
  start();
} catch (error) {
  if (error instanceof EnvValidationError) {
    // Printed rather than logged: this happens before the logger's own
    // configuration is trustworthy, and a human is reading it.
    process.stderr.write(`\n${error.message}\n\n`);
    process.exit(1);
  }

  throw error;
}
