import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { ActionLink, IconName } from '../../../core/models';
import { Icon } from '../icon/icon';

export type ButtonVariant = 'primary' | 'secondary' | 'dark' | 'ghost' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

const BASE =
  'group/btn relative inline-flex items-center justify-center gap-2 rounded-full font-semibold ' +
  'tracking-tight whitespace-nowrap transition-all duration-200 ease-out ' +
  'focus-visible:outline-2 focus-visible:outline-offset-3 disabled:pointer-events-none disabled:opacity-50';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-600 text-white shadow-brand hover:bg-brand-700 hover:-translate-y-0.5 ' +
    'active:translate-y-0 focus-visible:outline-brand-700',
  secondary:
    'bg-white text-ink-900 ring-1 ring-ink-200 ring-inset hover:ring-ink-900 ' +
    'hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-ink-900',
  dark: 'bg-ink-900 text-white hover:bg-ink-800 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-ink-900',
  ghost:
    'bg-white/10 text-white ring-1 ring-white/25 ring-inset backdrop-blur-sm hover:bg-white/20 ' +
    'hover:ring-white/50 focus-visible:outline-white',
  link: 'text-brand-700 underline-offset-4 hover:text-brand-800 hover:underline px-0! py-0!',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-5 py-2.5 text-body',
  lg: 'px-7 py-3.5 text-lead',
};

const ICON_SIZES: Record<ButtonSize, number> = { sm: 16, md: 18, lg: 20 };

/**
 * The one button in the design system. Renders as an internal router link, an
 * external/protocol anchor or a real `<button>` depending on what it is given —
 * so a CTA looks identical wherever it appears.
 *
 * @example
 * <app-button variant="primary" routerLink="/servicos" icon="arrow-right">Ver serviços</app-button>
 * <app-button [action]="callAction" />
 * <app-button variant="ghost" (click)="next()">Seguinte</app-button>
 */
@Component({
  selector: 'app-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, RouterLink, Icon],
  templateUrl: './ui-button.html',
  host: { class: 'contents' },
})
export class UiButton {
  /** Convenience input: fills label, icon and destination from a data object. */
  readonly action = input<ActionLink | null>(null);

  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly icon = input<IconName | null>(null);
  readonly iconPosition = input<'left' | 'right'>('right');
  readonly routerLink = input<string | null>(null);
  readonly href = input<string | null>(null);
  readonly external = input(false);
  readonly fragment = input<string | undefined>(undefined);
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input(false);
  readonly block = input(false);
  readonly ariaLabel = input<string | null>(null);

  protected readonly resolvedLabel = computed(() => this.action()?.label ?? '');
  protected readonly resolvedIcon = computed(() => this.icon() ?? this.action()?.icon ?? null);
  protected readonly resolvedRouterLink = computed(
    () => this.routerLink() ?? this.action()?.routerLink ?? null,
  );
  protected readonly resolvedHref = computed(() => this.href() ?? this.action()?.href ?? null);
  protected readonly resolvedExternal = computed(
    () => this.external() || !!this.action()?.external,
  );
  protected readonly resolvedAriaLabel = computed(
    () => this.ariaLabel() ?? this.action()?.ariaLabel ?? null,
  );
  protected readonly iconSize = computed(() => ICON_SIZES[this.size()]);

  protected readonly classes = computed(() =>
    [BASE, VARIANTS[this.variant()], SIZES[this.size()], this.block() ? 'w-full' : '']
      .filter(Boolean)
      .join(' '),
  );
}
