/**
 * Liveness endpoint.
 *
 * Deliberately does *not* call OfficeGest. A health check is polled every few
 * seconds by a platform that will restart the process when it fails — wiring it
 * to a third party means an OfficeGest incident becomes a restart loop here, and
 * it would spend upstream quota around the clock. This answers one question:
 * is this process able to serve? To verify the upstream credential, use
 * `npm run probe`.
 */
import { Router } from 'express';

import { config } from '../config/index.js';
import { success } from '../shared/http/api-response.js';

export function createHealthRouter(): Router {
  const router = Router();
  const startedAt = Date.now();

  router.get('/', (_req, res) => {
    res.status(200).json(
      success({
        status: 'ok',
        environment: config.env,
        uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
        // The base URL is configuration, not a secret, and knowing which tenant
        // an instance points at is the first question during an incident.
        officegest: {
          baseUrl: config.officegest.baseUrl,
          authMode: config.officegest.credentials.mode,
        },
      }),
    );
  });

  return router;
}
