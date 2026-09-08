/**
 * Field mapping, against the shapes the live tenant actually returns.
 *
 * The record fixtures below are real ones, reduced to their keys — probed with
 * `npm run probe -- /crm/appointments start=… end=…`.
 */
import { describe, expect, it } from 'vitest';

import { toAppointment } from './appointment.mapper.js';

describe('toAppointment', () => {
  it('maps every field this tenant sends', () => {
    const appointment = toAppointment({
      id: 503,
      title: 'FERIAS DE 3/08 A 17/08',
      start: '2026-08-03 08:30:00',
      end: '2026-08-17 09:00:00',
      confirmed: false,
      completed: true,
      no_show: false,
      employee_id: 8,
      priority: 'N',
      location: '[1] Sede',
    });

    expect(appointment).toMatchObject({
      id: '503',
      title: 'FERIAS DE 3/08 A 17/08',
      status: 'completed',
      employeeId: '8',
      priority: 'N',
      location: '[1] Sede',
    });
  });

  it('drops a record with no usable identifier', () => {
    expect(toAppointment({ title: 'Sem id' })).toBeUndefined();
  });

  describe('the plate the workshop writes into the title', () => {
    it.each([
      ['30-99-IG / VER INTERVENÇOES', '3099IG'],
      ['11-OR-58 /', '11OR58'],
      ['00-VP-66 /  REVISÃO + CHAPA E PINTURA', '00VP66'],
      // Written without separators, which the workshop also does.
      ['33XA50 /', '33XA50'],
    ])('reads %s as %s', (title, expected) => {
      expect(toAppointment({ id: '1', title })?.plate).toBe(expected);
    });

    /**
     * The eight-in-a-hundred that are staff entries, not vehicles. Inventing a
     * plate for these would put a wrong car on the screen, which is worse than
     * putting none.
     */
    it.each([
      ['BRUNO PIMENTA / CONSULTA'],
      ['TIAGO FORMAÇÃO'],
      ['FERIAS DE 3/08 A 17/08'],
      ['TIAGO FÉRIAS DE 13/7 A 17/7'],
      // A plate, but not at the front — too risky to read as this booking's car.
      ['SONIA VIANA - CF-93-GZ'],
    ])('reads no plate from %s', (title) => {
      expect(toAppointment({ id: '1', title })?.plate).toBeUndefined();
    });

    it('prefers an upstream plate field over the title', () => {
      const appointment = toAppointment({
        id: '1',
        title: '30-99-IG / algo',
        matricula: 'aa-00-bb',
      });

      expect(appointment?.plate).toBe('AA00BB');
    });
  });
});
