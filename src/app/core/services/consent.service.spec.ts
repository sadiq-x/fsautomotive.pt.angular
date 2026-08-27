import { TestBed } from '@angular/core/testing';

import { CONSENT_STORAGE_KEY, ConsentService } from './consent.service';

function setup(): ConsentService {
  TestBed.configureTestingModule({});
  return TestBed.inject(ConsentService);
}

describe('ConsentService', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('starts undecided, with the notice showing and analytics allowed', () => {
    const consent = setup();

    expect(consent.value()).toBe('unknown');
    expect(consent.needsNotice()).toBe(true);
    // Cookieless measurement needs no prior consent, so it runs while the
    // notice is on screen. Only an explicit refusal stops it.
    expect(consent.analyticsAllowed()).toBe(true);
  });

  it('stores nothing until the visitor actually chooses', () => {
    setup();

    expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBeNull();
    expect(localStorage.length).toBe(0);
  });

  it('remembers an acceptance and hides the notice', () => {
    const consent = setup();
    consent.accept();

    expect(consent.value()).toBe('accepted');
    expect(consent.needsNotice()).toBe(false);
    expect(consent.analyticsAllowed()).toBe(true);
    expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBe('accepted');
  });

  it('remembers a refusal and blocks analytics', () => {
    const consent = setup();
    consent.decline();

    expect(consent.value()).toBe('declined');
    expect(consent.needsNotice()).toBe(false);
    expect(consent.analyticsAllowed()).toBe(false);
    expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBe('declined');
  });

  it('restores a decision made on an earlier visit', () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, 'declined');

    expect(setup().analyticsAllowed()).toBe(false);
  });

  it('namespaces the key, because GitHub Pages shares one origin per account', () => {
    setup().accept();

    expect(CONSENT_STORAGE_KEY.startsWith('fsautomotive:')).toBe(true);
  });

  // A stray value must not read as a refusal the visitor never made — nor as
  // an acceptance they never gave.
  it('treats an unrecognised stored value as undecided', () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, 'sim');

    const consent = setup();
    expect(consent.value()).toBe('unknown');
    expect(consent.needsNotice()).toBe(true);
  });

  it('forgets the decision on reset', () => {
    const consent = setup();
    consent.decline();
    consent.reset();

    expect(consent.value()).toBe('unknown');
    expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBeNull();
  });

  describe('when the browser blocks site data', () => {
    // Safari's private mode and "block all cookies" throw on access rather
    // than returning null. The most privacy-conscious visitors are exactly the
    // ones who must not get a broken page from the privacy notice.
    it('survives a throwing localStorage and stays usable', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new DOMException('denied');
      });
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('denied');
      });

      const consent = setup();
      expect(consent.value()).toBe('unknown');

      expect(() => consent.decline()).not.toThrow();
      // The choice still holds for this visit; it just cannot outlive it.
      expect(consent.analyticsAllowed()).toBe(false);
    });
  });
});
