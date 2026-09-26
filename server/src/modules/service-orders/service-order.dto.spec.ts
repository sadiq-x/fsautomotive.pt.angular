/**
 * The service-order id a caller may put in a URL.
 *
 * Pins one path-confusion case: `encodeURIComponent` does not escape dots, so
 * a bare `..` would reach OfficeGest as a dot-segment and walk one level up.
 */
import { describe, expect, it } from 'vitest';

import { serviceOrderIdParamsSchema } from './service-order.dto.js';

describe('serviceOrderIdParamsSchema', () => {
  it.each(['202600642', 'OSV-BF2026.642'])('accepts %s', (serviceOrderId) => {
    expect(serviceOrderIdParamsSchema.safeParse({ serviceOrderId }).success).toBe(true);
  });

  it.each(['.', '..', '...'])('rejects the dot-segment %s', (serviceOrderId) => {
    expect(serviceOrderIdParamsSchema.safeParse({ serviceOrderId }).success).toBe(false);
  });
});
