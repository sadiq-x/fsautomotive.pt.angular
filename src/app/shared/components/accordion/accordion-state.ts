import { Injectable, computed, signal } from '@angular/core';

/**
 * Open/closed bookkeeping shared between an `Accordion` and its items.
 * Provided by the `Accordion` component, so each accordion gets its own
 * instance and nested accordions do not interfere with each other.
 */
@Injectable()
export class AccordionState {
  private readonly openIds = signal<ReadonlySet<string>>(new Set<string>());

  readonly multiple = signal(false);
  readonly openCount = computed(() => this.openIds().size);

  isOpen(id: string): boolean {
    return this.openIds().has(id);
  }

  toggle(id: string): void {
    const current = this.openIds();

    if (current.has(id)) {
      const next = new Set(current);
      next.delete(id);
      this.openIds.set(next);
      return;
    }

    this.openIds.set(this.multiple() ? new Set(current).add(id) : new Set([id]));
  }

  closeAll(): void {
    this.openIds.set(new Set());
  }
}
