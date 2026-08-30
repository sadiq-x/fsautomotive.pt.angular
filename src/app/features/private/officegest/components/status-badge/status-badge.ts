import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * A small status pill.
 *
 * The tone is derived from the text rather than passed in, because the statuses
 * come from OfficeGest and are not a closed set this application controls. An
 * unrecognised status still renders — neutrally — instead of disappearing or
 * throwing, which is the behaviour that matters when the upstream adds a state
 * nobody told us about.
 */
export type BadgeTone = 'neutral' | 'positive' | 'warning' | 'critical' | 'info';

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-ink-100 text-ink-700 ring-ink-950/8',
  positive: 'bg-emerald-50 text-emerald-800 ring-emerald-700/15',
  warning: 'bg-amber-50 text-amber-900 ring-amber-700/20',
  critical: 'bg-brand-50 text-brand-800 ring-brand-700/15',
  info: 'bg-sky-50 text-sky-800 ring-sky-700/15',
};

/** Matched case-insensitively, against Portuguese and English wordings alike. */
const TONE_PATTERNS: readonly (readonly [BadgeTone, RegExp])[] = [
  ['positive', /(conclu|fechad|closed|final|entregue|pago|paid|ativ|activ|complete)/i],
  ['warning', /(pendente|pending|aguard|waiting|espera|aberto|open|em curso|progress)/i],
  ['critical', /(cancel|anulad|erro|error|rejeit|reject|inativ|inactiv)/i],
  ['info', /(agendad|scheduled|marcad|novo|new|orcament|budget)/i],
];

@Component({
  selector: 'app-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span [class]="classes()">{{ label() }}</span>`,
  host: { class: 'inline-flex' },
})
export class StatusBadge {
  readonly label = input.required<string>();
  /** Overrides the inferred tone when a page knows better. */
  readonly tone = input<BadgeTone | null>(null);

  protected readonly resolvedTone = computed<BadgeTone>(() => {
    const explicit = this.tone();

    if (explicit) {
      return explicit;
    }

    const label = this.label();
    return TONE_PATTERNS.find(([, pattern]) => pattern.test(label))?.[0] ?? 'neutral';
  });

  protected readonly classes = computed(() =>
    [
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-meta font-semibold',
      'ring-1 ring-inset whitespace-nowrap',
      TONES[this.resolvedTone()],
    ].join(' '),
  );
}
