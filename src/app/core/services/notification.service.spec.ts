/**
 * The queue's two non-obvious properties: identical messages collapse, and a
 * dropped notification does not leave a timer behind that fires against an id
 * no longer in the queue.
 */
import { TestBed } from '@angular/core/testing';

import { NotificationService } from './notification.service';

function service(): NotificationService {
  TestBed.configureTestingModule({});
  return TestBed.inject(NotificationService);
}

describe('NotificationService', () => {
  it('queues distinct messages', () => {
    const notifications = service();

    notifications.error('Primeiro');
    notifications.error('Segundo');

    expect(notifications.notifications()).toHaveLength(2);
  });

  /**
   * The dashboard fires four requests on load — three metrics and the calendar.
   * A backend that is down fails all four with the same network error, which
   * used to fill the whole queue with one sentence repeated.
   */
  it('collapses an identical message instead of stacking it', () => {
    const notifications = service();
    const message = 'Não foi possível contactar o servidor.';

    for (let i = 0; i < 4; i++) {
      notifications.error(message);
    }

    expect(notifications.notifications()).toHaveLength(1);
    expect(notifications.notifications()[0]!.message).toBe(message);
  });

  it('treats a different detail as a different message', () => {
    const notifications = service();

    notifications.error('Falhou', 'Referência: a1');
    notifications.error('Falhou', 'Referência: b2');

    expect(notifications.notifications()).toHaveLength(2);
  });

  it('keeps tones apart', () => {
    const notifications = service();

    notifications.error('Mesma frase');
    notifications.warning('Mesma frase');

    expect(notifications.notifications()).toHaveLength(2);
  });

  it('does not move a collapsed message down the stack', () => {
    const notifications = service();

    notifications.error('Primeiro');
    notifications.error('Segundo');
    notifications.error('Primeiro');

    expect(notifications.notifications().map((item) => item.message)).toEqual([
      'Primeiro',
      'Segundo',
    ]);
  });

  it('caps the visible stack', () => {
    const notifications = service();

    for (let i = 0; i < 8; i++) {
      notifications.error(`Erro ${i}`);
    }

    expect(notifications.notifications()).toHaveLength(4);
    expect(notifications.notifications()[0]!.message).toBe('Erro 4');
  });

  it('dismisses by id', () => {
    const notifications = service();

    notifications.error('Some');
    const [item] = notifications.notifications();
    notifications.dismiss(item!.id);

    expect(notifications.notifications()).toHaveLength(0);
  });

  it('auto-dismisses a non-error message', async () => {
    vi.useFakeTimers();

    try {
      const notifications = service();
      notifications.success('Guardado');

      expect(notifications.notifications()).toHaveLength(1);

      vi.advanceTimersByTime(5_000);

      expect(notifications.notifications()).toHaveLength(0);
    } finally {
      vi.useRealTimers();
    }
  });

  // Without restarting the timer, a repeat would vanish early because it is
  // still riding the first occurrence's countdown.
  it('gives a repeated dismissable message its full time again', () => {
    vi.useFakeTimers();

    try {
      const notifications = service();
      notifications.success('Guardado');

      vi.advanceTimersByTime(4_000);
      notifications.success('Guardado');
      vi.advanceTimersByTime(4_000);

      expect(notifications.notifications()).toHaveLength(1);

      vi.advanceTimersByTime(1_500);

      expect(notifications.notifications()).toHaveLength(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not auto-dismiss an error', () => {
    vi.useFakeTimers();

    try {
      const notifications = service();
      notifications.error('Persistente');

      vi.advanceTimersByTime(60_000);

      expect(notifications.notifications()).toHaveLength(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
