/**
 * Booking rules, at a fixed instant.
 *
 * The clock is injected precisely so these assertions do not depend on when the
 * suite runs — the usual way a "must be in the future" rule becomes flaky.
 */
import { describe, expect, it, vi } from 'vitest';

import type { AppointmentsResource } from '../../integrations/officegest/index.js';
import type { Logger } from '../../shared/logger.js';
import { AppointmentsService } from './appointments.service.js';
import type { CreateAppointmentBody } from './appointment.dto.js';

const NOW = new Date('2026-08-28T09:00:00.000Z');

const silentLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  child: vi.fn(),
} as unknown as Logger;

const context = { logger: silentLogger };

function makeResource(overrides: Partial<AppointmentsResource> = {}): AppointmentsResource {
  return {
    list: vi.fn().mockResolvedValue({ items: [], meta: undefined }),
    getById: vi.fn(),
    create: vi.fn().mockResolvedValue({ id: '100', title: 'Revisão' }),
    ...overrides,
  } as unknown as AppointmentsResource;
}

function makeService(resource = makeResource()): AppointmentsService {
  return new AppointmentsService(resource, () => NOW);
}

const validBody: CreateAppointmentBody = {
  title: 'Revisão dos 60.000 km',
  startsAt: '2026-08-29T09:00:00.000Z',
  endsAt: '2026-08-29T11:00:00.000Z',
  plate: 'AA00BB',
};

describe('AppointmentsService', () => {
  describe('create', () => {
    it('books a valid appointment and returns the mapped record', async () => {
      const resource = makeResource();

      await expect(makeService(resource).create(validBody, context)).resolves.toMatchObject({
        id: '100',
      });
      expect(resource.create).toHaveBeenCalledTimes(1);
    });

    it('sends only the fields the caller supplied', async () => {
      const create = vi.fn().mockResolvedValue({ id: '100' });

      await makeService(makeResource({ create })).create(
        { title: 'Diagnóstico', startsAt: '2026-08-29T09:00:00.000Z' },
        context,
      );

      expect(create.mock.calls[0]?.[0]).toEqual({
        title: 'Diagnóstico',
        start_date: '2026-08-29T09:00:00.000Z',
      });
    });

    it('refuses a slot in the past before spending an upstream call', async () => {
      const resource = makeResource();

      await expect(
        makeService(resource).create(
          { ...validBody, startsAt: '2026-08-27T09:00:00.000Z', endsAt: undefined },
          context,
        ),
      ).rejects.toMatchObject({ httpStatus: 400 });
      expect(resource.create).not.toHaveBeenCalled();
    });

    it('tolerates a start time a few seconds in the past, for clock skew', async () => {
      const resource = makeResource();

      await expect(
        makeService(resource).create(
          { title: 'Entrega', startsAt: '2026-08-28T08:59:30.000Z' },
          context,
        ),
      ).resolves.toBeDefined();
    });

    it('refuses an implausibly long booking', async () => {
      const resource = makeResource();

      await expect(
        makeService(resource).create(
          {
            ...validBody,
            startsAt: '2026-08-29T09:00:00.000Z',
            endsAt: '2026-08-30T09:00:00.000Z',
          },
          context,
        ),
      ).rejects.toMatchObject({ httpStatus: 400 });
      expect(resource.create).not.toHaveBeenCalled();
    });

    it('does not log the free-text fields that may carry personal data', async () => {
      const logger = { ...silentLogger, info: vi.fn() } as unknown as Logger;

      await makeService().create(
        { ...validBody, notes: 'Cliente João, 912345678' },
        {
          logger,
        },
      );

      expect(JSON.stringify(vi.mocked(logger.info).mock.calls)).not.toContain('912345678');
    });
  });

  describe('list', () => {
    it('rejects a reversed date range without calling the upstream', async () => {
      const resource = makeResource();

      await expect(
        makeService(resource).list(
          {
            page: 1,
            perPage: 25,
            from: '2026-09-01T00:00:00.000Z',
            to: '2026-08-01T00:00:00.000Z',
          },
          context,
        ),
      ).rejects.toMatchObject({ httpStatus: 400 });
      expect(resource.list).not.toHaveBeenCalled();
    });

    it('translates our filters into the upstream parameter names', async () => {
      const list = vi.fn().mockResolvedValue({ items: [], meta: undefined });

      await makeService(makeResource({ list })).list(
        { page: 1, perPage: 25, from: '2026-08-01T00:00:00.000Z', customerId: '42' },
        context,
      );

      expect(list.mock.calls[0]?.[0]).toMatchObject({
        filters: { start_date: '2026-08-01T00:00:00.000Z', end_date: undefined, customer_id: '42' },
      });
    });
  });
});
