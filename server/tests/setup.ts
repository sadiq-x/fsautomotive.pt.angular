/**
 * A complete, fake OfficeGest configuration for the whole suite.
 *
 * `config/env.ts` validates on import, so without this every test file would
 * fail at import time — or, worse, pass only on a machine whose `.env` happened
 * to be filled in. Pinning the environment here means the suite never reads a
 * real credential and never reaches the network.
 */
process.env['NODE_ENV'] = 'test';
process.env['LOG_LEVEL'] = 'silent';
process.env['OFFICEGEST_BASE_URL'] = 'https://tenant.example.test/api/v2';
process.env['OFFICEGEST_AUTH_MODE'] = 'bearer-login';
process.env['OFFICEGEST_USERNAME'] = 'api-user';
process.env['OFFICEGEST_API_KEY'] = 'not-a-real-key';
process.env['BACKEND_API_KEYS'] = '';
process.env['CORS_ALLOWED_ORIGINS'] = 'http://localhost:4200';
