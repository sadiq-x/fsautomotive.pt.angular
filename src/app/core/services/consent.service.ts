import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT, Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';

import type { ConsentDecision } from '../models';

/**
 * Where the decision is kept. Namespaced because GitHub Pages serves every
 * project of an account from one origin — an unprefixed key would be shared
 * with, and overwritten by, any other site published under the same user.
 */
export const CONSENT_STORAGE_KEY = 'fsautomotive:analytics-consent';

const DECISIONS: readonly ConsentDecision[] = ['unknown', 'accepted', 'declined'];

/**
 * Remembers whether the visitor has opted out of anonymous measurement.
 *
 * The site sets **no cookies**: GA4 runs with every Consent Mode storage
 * category denied, so measurement needs no prior consent and happens while the
 * notice is still showing. The notice informs, and the opt-out is a genuine
 * choice rather than a formality.
 *
 * Nothing is written until the visitor actually chooses. Someone who ignores
 * the notice leaves no trace on their device at all — which is the whole point
 * of running cookieless, and would be undone by eagerly storing a default.
 *
 * The one thing that *is* stored, once they choose, is the choice itself. That
 * is the storage every privacy regime exempts as strictly necessary: there is
 * no way to honour "do not measure me" on the next visit without remembering it.
 */
@Injectable({ providedIn: 'root' })
export class ConsentService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly decision = signal<ConsentDecision>(this.read());

  /** The stored decision. `unknown` until the visitor answers the notice. */
  readonly value = this.decision.asReadonly();

  /** `true` while the notice should be on screen. */
  readonly needsNotice = computed(() => this.decision() === 'unknown');

  /** `false` only after an explicit refusal — see the class comment. */
  readonly analyticsAllowed = computed(() => this.decision() !== 'declined');

  /** Accepts anonymous measurement and dismisses the notice. */
  accept(): void {
    this.write('accepted');
  }

  /**
   * Refuses measurement, for this visit and every later one.
   *
   * Analytics stops sending immediately. gtag.js may already have loaded, and
   * a script cannot be unloaded — but it has set nothing (all storage denied),
   * and every later event is dropped before it reaches gtag.
   */
  decline(): void {
    this.write('declined');
  }

  /**
   * Forgets the decision, so the notice is shown again on the next load.
   *
   * There is no UI for this yet; it exists so a "change your preference" link
   * can be added without reopening this service, and so tests can start clean.
   */
  reset(): void {
    this.decision.set('unknown');
    this.withStorage((storage) => storage.removeItem(CONSENT_STORAGE_KEY));
  }

  private write(decision: ConsentDecision): void {
    this.decision.set(decision);
    this.withStorage((storage) => storage.setItem(CONSENT_STORAGE_KEY, decision));
  }

  private read(): ConsentDecision {
    const stored = this.withStorage((storage) => storage.getItem(CONSENT_STORAGE_KEY));

    // Anything unrecognised — a truncated write, a value from an older
    // version, a key another tool set — means "not yet answered" rather than a
    // silent opt-out the visitor never made.
    return DECISIONS.find((decision) => decision === stored) ?? 'unknown';
  }

  /**
   * Runs a storage operation, or gives up quietly.
   *
   * Reading `localStorage` *throws* rather than returning null when a browser
   * is set to block site data, and again in Safari's private mode. A privacy
   * notice that crashes the page for the most privacy-conscious visitors would
   * be a poor joke, so every access is guarded.
   */
  private withStorage<T>(operation: (storage: Storage) => T): T | undefined {
    if (!this.isBrowser) {
      return undefined;
    }

    try {
      const storage = this.document.defaultView?.localStorage;
      return storage ? operation(storage) : undefined;
    } catch {
      return undefined;
    }
  }
}
