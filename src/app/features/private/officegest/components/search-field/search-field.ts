import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';

import { Icon } from '../../../../../shared/components/icon/icon';

/**
 * A debounced search box.
 *
 * WHY THE DEBOUNCE LIVES HERE
 * ---------------------------
 * This component owns the keystrokes, so it is the only place that can tell a
 * pause from a burst. Debouncing in the store instead would also delay page
 * clicks and filter changes, which must feel instant — and every consumer would
 * have to remember to do it.
 *
 * Clearing is not debounced: pressing Escape or the clear button is a decision,
 * not typing, and waiting 350ms to act on it feels broken.
 *
 * The backend requires 2–120 characters or no parameter at all, so a
 * single character is held back rather than sent and rejected with a 422.
 */
const DEBOUNCE_MS = 350;

/** Matches the backend's own minimum for the `search` parameter. */
const MIN_LENGTH = 2;

@Component({
  selector: 'app-search-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './search-field.html',
  host: { class: 'block' },
})
export class SearchField {
  readonly label = input.required<string>();
  readonly placeholder = input('Pesquisar…');
  /** The committed value, so the field survives a navigation back to the page. */
  readonly value = input<string>('');

  /** Emits the trimmed term, or `''` when the search is cleared. */
  readonly search = output<string>();

  protected readonly draft = signal('');
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // Keeps the box in step when the page resets filters programmatically.
    effect(() => this.draft.set(this.value()));
  }

  protected onInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    this.draft.set(raw);

    const term = raw.trim();

    // Below the backend's minimum, only "cleared" is a meaningful state — a
    // single character would be rejected with a 422.
    if (term.length > 0 && term.length < MIN_LENGTH) {
      return;
    }

    this.schedule(term);
  }

  /** Enter commits immediately: the user has finished typing and said so. */
  protected onEnter(): void {
    this.cancel();
    const term = this.draft().trim();

    if (term.length === 0 || term.length >= MIN_LENGTH) {
      this.search.emit(term);
    }
  }

  protected clear(): void {
    this.cancel();
    this.draft.set('');
    this.search.emit('');
  }

  private schedule(term: string): void {
    this.cancel();
    this.timer = setTimeout(() => this.search.emit(term), DEBOUNCE_MS);
  }

  private cancel(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
