import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { ActionLink, IconName } from '../../../core/models';
import { Icon } from '../icon/icon';

export type ButtonVariant = 'primary' | 'secondary' | 'dark' | 'ghost' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

const BASE =
  'group/btn relative inline-flex w-full items-center justify-center rounded-full font-semibold ' +
  'tracking-tight whitespace-nowrap select-none ' +
  // Transition the properties that actually change — animating `all` would
  // also animate the focus outline, which should appear instantly.
  'transition-[background-color,box-shadow,transform,color] duration-200 ease-out ' +
  'focus-visible:outline-2 focus-visible:outline-offset-3 ' +
  'disabled:pointer-events-none disabled:opacity-45 disabled:shadow-none';

/**
 * Each variant defines four states. Hover both brightens and lifts (the raised
 * shadow is what makes a 2px translate legible); active presses back down, so
 * a click feels physical rather than instantaneous.
 */
const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-600 text-white shadow-brand ' +
    'hover:-translate-y-0.5 hover:bg-brand-500 hover:shadow-brand-lg ' +
    'active:translate-y-0 active:bg-brand-700 active:shadow-brand ' +
    'focus-visible:outline-brand-600',
  secondary:
    // A tinted alpha edge rather than flat grey: it keeps the white pill
    // defined against the warm bone background without looking drawn-on.
    'bg-white text-ink-900 shadow-btn ring-1 ring-ink-950/8 ring-inset ' +
    'hover:-translate-y-0.5 hover:shadow-btn-lg hover:ring-ink-950/16 ' +
    'active:translate-y-0 active:bg-bone-50 active:shadow-btn ' +
    'focus-visible:outline-ink-900',
  dark:
    'bg-ink-900 text-white shadow-btn ' +
    'hover:-translate-y-0.5 hover:bg-ink-800 hover:shadow-btn-lg ' +
    'active:translate-y-0 active:bg-ink-950 active:shadow-btn ' +
    'focus-visible:outline-ink-900',
  ghost:
    // Sits on dark photography, so it leans on a frosted edge rather than fill.
    'bg-white/8 text-white ring-1 ring-white/20 ring-inset backdrop-blur-md ' +
    'hover:-translate-y-0.5 hover:bg-white/16 hover:ring-white/40 ' +
    'active:translate-y-0 active:bg-white/10 ' +
    'focus-visible:outline-white',
  link:
    'text-brand-700 underline decoration-brand-700/30 underline-offset-4 ' +
    'hover:text-brand-800 hover:decoration-brand-700/70 ' +
    'focus-visible:outline-brand-700',
};

/** Padding, type size and icon gap, which all scale together. */
const SIZES: Record<ButtonSize, string> = {
  sm: 'gap-2 px-4 py-2 text-sm',
  md: 'gap-2.5 px-5 py-2.5 text-body',
  lg: 'gap-3 px-7 py-3.5 text-lead',
};

/** `link` renders as inline text, so it takes the type scale but no chrome. */
const LINK_SIZES: Record<ButtonSize, string> = {
  sm: 'gap-1.5 text-sm',
  md: 'gap-2 text-body',
  lg: 'gap-2 text-lead',
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
  host: {
    // The default display lives in the base layer (see styles.css) rather than
    // in a host class: an element selector loses to any utility, so a consumer
    // writing `class="hidden lg:inline-flex"` still wins. A static host class
    // would have the same specificity as `hidden` and be decided by source
    // order — which is how the header CTA leaked onto mobile.
    '[class.w-full]': 'block()',
  },
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

  protected readonly classes = computed(() => {
    const variant = this.variant();
    // `link` renders as inline text, so it takes the type scale but none of
    // the pill chrome. Selecting the map here is what removes the need for
    // `px-0!`/`py-0!` overrides fighting SIZES.
    const sizing = variant === 'link' ? LINK_SIZES : SIZES;

    return [BASE, VARIANTS[variant], sizing[this.size()]].join(' ');
  });
}
