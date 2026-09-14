import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, interval, map, of, startWith, switchMap, tap } from 'rxjs';

import { PRIVATE_ROUTES } from '../../../../../core/config/private-routes.config';
import { DetailList, type DetailField } from '../../components/detail-list/detail-list';
import { DetailPage } from '../../components/detail-page/detail-page';
import { LastUpdated } from '../../components/last-updated/last-updated';
import type { MonitorBoard, ServiceOrder, ServiceOrderLine } from '../../models';
import { ElapsedTime } from '../monitor/elapsed-time';
import { elapsedSeconds, formatMinutes, formatSpan } from '../../utils/elapsed';
import { OfficeGestService } from '../../services/officegest.service';
import { createResourceDetail } from '../../services/resource-detail.store';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatPercent,
  formatPlate,
  orNull,
} from '../../utils/format';
import { formatMileageReading, formatServiceOrderStatus } from './service-order.labels';

/** The board's own cadence; see `Monitor` for why twenty seconds. */
const BOARD_POLL_MS = 20_000;

/**
 * One work order.
 *
 * WHY THE FIELD LIST IS BUILT RATHER THAN WRITTEN OUT
 * ---------------------------------------------------
 * The record carries far more than this page used to show — the customer's
 * name, the mechanic, the mileage, the promised delivery date, whether it is
 * waiting for parts — and it carries different subsets on different jobs. A
 * fixed list would either omit the useful fields (which it did) or print a
 * dash for each absent one, which reads as a broken page rather than an empty
 * value. So each field is added only when it has something to say.
 *
 * The billed lines get a table of their own: they are the answer to "what was
 * actually done", they have their own columns, and squeezing them into a
 * label/value list would lose the arithmetic.
 */
@Component({
  selector: 'app-service-order-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DetailList, DetailPage, ElapsedTime, LastUpdated, RouterLink],
  template: `
    <app-detail-page
      [status]="store.status()"
      [title]="title()"
      [subtitle]="subtitle()"
      [backLink]="routes.serviceOrders"
      backLabel="Folhas de obra"
      [errorMessage]="store.error()?.message ?? null"
      missingMessage="Esta folha de obra não existe no OfficeGest ou foi removida."
    >
      <section class="rounded-xl bg-white p-6 shadow-card ring-1 ring-ink-950/6">
        <div class="flex flex-wrap items-baseline justify-between gap-3">
          <h2 class="text-h3 text-ink-900">Dados da intervenção</h2>
          <app-last-updated [since]="lastUpdated()" />
        </div>

        @if (flags().length > 0) {
          <!--
            The two facts that change what someone does next, so they sit above
            the field list rather than eleventh in it.
          -->
          <ul class="mt-4 flex flex-wrap gap-2">
            @for (flag of flags(); track flag.label) {
              <li
                class="rounded-full px-3 py-1 text-meta font-semibold ring-1 ring-inset"
                [class]="flag.class"
              >
                {{ flag.label }}
              </li>
            }
          </ul>
        }

        <app-detail-list class="mt-5" [fields]="fields()" />

        @if (plateLink(); as plate) {
          <p class="mt-6 border-t border-ink-950/6 pt-5">
            <a
              class="rounded-sm font-semibold text-brand-700 underline decoration-brand-700/30 underline-offset-4 transition-colors hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              [routerLink]="routes.vehicle(plate)"
            >
              Ver a viatura {{ formatPlate(plate) }}
            </a>
          </p>
        }
      </section>

      <!--
        Everything this API can say about time, in one place, including the two
        things it cannot: there is no completion timestamp, so a finished job
        has no measurable duration, and a job nobody has picado has no worked
        time. Both are stated rather than left as blanks to be puzzled over.
      -->
      <section class="mt-6 rounded-xl bg-white p-6 shadow-card ring-1 ring-ink-950/6">
        <h2 class="text-h3 text-ink-900">Tempos</h2>

        <dl class="mt-5 grid gap-6 sm:grid-cols-2">
          @if (openFor(); as age) {
            <div>
              <dt class="text-meta font-semibold tracking-wide text-ink-500 uppercase">
                Aberta há
              </dt>
              <dd class="mt-1 text-h3 text-ink-950 tabular-nums">{{ age }}</dd>
              @if (averageOpenAge(); as average) {
                <p class="mt-1 text-meta text-ink-500">
                  Média das folhas em curso: {{ average }}
                  @if (againstAverage(); as position) {
                    <span class="font-semibold">· {{ position }}</span>
                  }
                </p>
              }
            </div>
          }

          <div>
            <dt class="text-meta font-semibold tracking-wide text-ink-500 uppercase">
              Tempo trabalhado
            </dt>
            @if (workedLabel(); as worked) {
              <dd class="mt-1 text-h3 text-emerald-700 tabular-nums">{{ worked }}</dd>
              <p class="mt-1 text-meta text-ink-500">
                Soma das picagens abertas nesta folha de obra.
              </p>
            } @else {
              <dd class="mt-1 text-h3 text-ink-300" title="Nenhuma picagem aberta">—</dd>
              <p class="mt-1 text-meta text-ink-500">
                Sem picagem aberta, por isso não há tempo de trabalho registado.
              </p>
            }
          </div>

          <div>
            <dt class="text-meta font-semibold tracking-wide text-ink-500 uppercase">
              Tempo estimado
            </dt>
            @if (estimatedLabel(); as estimate) {
              <dd class="mt-1 text-h3 text-ink-950 tabular-nums">{{ estimate }}</dd>
              @if (estimateUsed(); as used) {
                <p
                  class="mt-1 text-meta"
                  [class]="overEstimate() ? 'font-semibold text-amber-700' : 'text-ink-500'"
                >
                  {{ used }}% do estimado consumido
                </p>
              }
            } @else {
              <dd class="mt-1 text-h3 text-ink-300" title="Sem tempo padrão no catálogo">—</dd>
              <p class="mt-1 text-meta text-ink-500">
                As intervenções desta folha não têm tempo padrão definido no OfficeGest.
              </p>
            }
          </div>

          @if (liveEstimatedCompletion(); as eta) {
            <div>
              <dt class="text-meta font-semibold tracking-wide text-ink-500 uppercase">
                Conclusão estimada
              </dt>
              <dd class="mt-1 text-h3 text-ink-950">{{ eta }}</dd>
              <p class="mt-1 text-meta text-ink-500">
                Calculada pelo OfficeGest sobre o horário da oficina.
              </p>
            </div>
          }

          @if (overdueBy(); as late) {
            <div>
              <dt class="text-meta font-semibold tracking-wide text-ink-500 uppercase">Atraso</dt>
              <dd class="mt-1 text-h3 font-semibold text-amber-700 tabular-nums">{{ late }}</dd>
              <p class="mt-1 text-meta text-ink-500">Para lá da entrega prevista.</p>
            </div>
          }
        </dl>
      </section>

      @if (live(); as current) {
        <!--
          Only rendered while the job is actually open: the clock-on, the
          progress and the intervention names exist on the live board and
          nowhere else. A finished repair has no section here, and that is the
          honest answer rather than a row of dashes.
        -->
        <section class="mt-6 rounded-xl bg-white p-6 shadow-card ring-1 ring-ink-950/6">
          <div class="flex flex-wrap items-baseline justify-between gap-3">
            <h2 class="text-h3 text-ink-900">Trabalho em curso</h2>
            @if (estimatedLabel(); as estimate) {
              <p class="text-meta text-ink-500">Tempo estimado: {{ estimate }}</p>
            }
          </div>

          @if (current.mechanics.length > 0) {
            <ul class="mt-4 flex flex-col gap-2">
              @for (mechanic of current.mechanics; track mechanic.employeeCode) {
                <li class="flex items-center justify-between gap-3">
                  <a
                    class="rounded-sm font-semibold text-brand-700 underline decoration-brand-700/30 underline-offset-4 transition-colors hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                    [routerLink]="routes.mechanic(mechanic.employeeCode)"
                    >{{ mechanic.name ?? mechanic.employeeCode }}</a
                  >

                  @if (mechanic.startedAt) {
                    <app-elapsed-time
                      class="shrink-0 text-h3 font-semibold text-emerald-700"
                      [startedAt]="mechanic.startedAt"
                      [observedAt]="observedAt()"
                      [receivedAt]="boardReceivedAt()"
                    />
                  } @else {
                    <span class="shrink-0 text-meta text-ink-400">sem picagem</span>
                  }
                </li>
              }
            </ul>
          } @else {
            <p class="mt-4 text-body text-ink-500">
              Nenhum mecânico com picagem aberta nesta folha de obra.
            </p>
          }

          @if (liveProgress(); as percent) {
            <div class="mt-5">
              <div class="flex items-baseline justify-between text-meta text-ink-500">
                <span>Progresso</span>
                <span class="tabular-nums">{{ percent }}%</span>
              </div>
              <div
                class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-100"
                role="progressbar"
                [attr.aria-valuenow]="percent"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-label="Progresso desta folha de obra"
              >
                <div class="h-full rounded-full bg-brand-600" [style.width.%]="percent"></div>
              </div>
            </div>
          }

          @if (current.interventions.length > 0) {
            <ul class="mt-5 flex flex-col gap-1.5">
              @for (intervention of current.interventions; track $index) {
                <li class="flex items-start justify-between gap-3 text-body">
                  <span class="flex min-w-0 items-start gap-2.5">
                    <span
                      class="mt-0.5 shrink-0 text-meta font-semibold"
                      [class]="intervention.completed ? 'text-emerald-600' : 'text-ink-300'"
                      aria-hidden="true"
                      >{{ intervention.completed ? '✓' : '○' }}</span
                    >
                    <span
                      [class]="
                        intervention.completed ? 'text-ink-400 line-through' : 'text-ink-800'
                      "
                    >
                      {{ intervention.name ?? 'Intervenção sem descrição' }}
                      <span class="sr-only">
                        — {{ intervention.completed ? 'concluída' : 'por concluir' }}
                      </span>
                    </span>
                  </span>

                  @if (interventionEstimate(intervention.estimatedMinutes); as estimate) {
                    <span class="shrink-0 text-meta text-ink-500 tabular-nums">{{ estimate }}</span>
                  }
                </li>
              }
            </ul>
          }

          <!--
            Said once, here, because it is the question this page most obviously
            invites and the answer is not discoverable from the screen.
          -->
          <p class="mt-5 border-t border-ink-950/6 pt-4 text-meta text-ink-400">
            O OfficeGest regista o início da picagem, mas não a hora de fecho de uma reparação — por
            isso o tempo total só é conhecido enquanto o trabalho está aberto.
          </p>
        </section>
      }

      @if (lines().length > 0) {
        <section class="mt-6 rounded-xl bg-white p-6 shadow-card ring-1 ring-ink-950/6">
          <h2 class="text-h3 text-ink-900">Peças e mão de obra</h2>
          <p class="mt-1 text-meta text-ink-500">Valores por linha. "Total" inclui IVA.</p>

          <div class="mt-5 overflow-x-auto">
            <table class="w-full min-w-xl border-collapse text-body">
              <caption class="sr-only">
                Linhas faturadas nesta folha de obra
              </caption>
              <thead>
                <tr class="border-b border-ink-950/8 text-meta text-ink-500">
                  <th scope="col" class="py-2 text-left font-semibold">Descrição</th>
                  <th scope="col" class="py-2 text-right font-semibold">Qt.</th>
                  <th scope="col" class="py-2 text-right font-semibold">Preço</th>
                  <th scope="col" class="py-2 text-right font-semibold">Desc.</th>
                  <th scope="col" class="py-2 text-right font-semibold">IVA</th>
                  <th scope="col" class="py-2 text-right font-semibold">S/ IVA</th>
                  <th scope="col" class="py-2 text-right font-semibold">Valor IVA</th>
                  <th scope="col" class="py-2 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                @for (line of lines(); track line.key) {
                  <tr class="border-b border-ink-950/6 last:border-0">
                    <td class="py-2 pr-4 text-ink-900">{{ line.description }}</td>
                    <td class="py-2 text-right text-ink-700 tabular-nums">{{ line.quantity }}</td>
                    <td class="py-2 text-right text-ink-700 tabular-nums">{{ line.unitPrice }}</td>
                    <td class="py-2 text-right text-ink-500 tabular-nums">
                      {{ line.discount ?? '—' }}
                    </td>
                    <td class="py-2 text-right text-ink-500 tabular-nums">
                      {{ line.vatRate ?? '—' }}
                    </td>
                    <td class="py-2 text-right text-ink-700 tabular-nums">{{ line.net }}</td>
                    <td class="py-2 text-right text-ink-700 tabular-nums">{{ line.vat }}</td>
                    <td class="py-2 text-right font-semibold text-ink-900 tabular-nums">
                      {{ line.total }}
                    </td>
                  </tr>
                }
              </tbody>
              @if (lineTotals(); as totals) {
                <tfoot>
                  <tr class="border-t-2 border-ink-950/10 text-ink-900">
                    <th scope="row" colspan="5" class="py-2 text-right font-semibold">Totais</th>
                    <td class="py-2 text-right font-semibold tabular-nums">{{ totals.net }}</td>
                    <td class="py-2 text-right font-semibold tabular-nums">{{ totals.vat }}</td>
                    <td class="py-2 text-right font-semibold tabular-nums">{{ totals.total }}</td>
                  </tr>
                </tfoot>
              }
            </table>
          </div>
        </section>
      }
    </app-detail-page>
  `,
})
export class ServiceOrderDetail {
  /** Bound from the `:serviceOrderId` route parameter. */
  readonly serviceOrderId = input.required<string>();

  private readonly officegest = inject(OfficeGestService);

  protected readonly routes = PRIVATE_ROUTES;
  protected readonly formatPlate = formatPlate;

  /** Set from the response, so it is the moment the data actually arrived. */
  private readonly fetchedAt = signal<Date | null>(null);

  protected readonly store = createResourceDetail({
    id: this.serviceOrderId,
    fetch: (id) =>
      this.officegest.getServiceOrder(id).pipe(tap(() => this.fetchedAt.set(new Date()))),
  });

  /** Empty when the roster is not readable; the field is then simply omitted. */
  private readonly employeeNames = toSignal(this.officegest.employeeNames(), {
    initialValue: new Map<string, string>() as ReadonlyMap<string, string>,
  });

  protected readonly lastUpdated = this.fetchedAt.asReadonly();

  /**
   * The live board, polled, so this page can show work happening right now.
   *
   * WHY THE BOARD AND NOT THIS ORDER'S OWN RECORD
   * ---------------------------------------------
   * Because the record does not carry it. `/workshop/service-orders/{n}` has no
   * mechanic clock-on, no progress and no intervention names — its nested
   * `interventions` are three fields, of which the id is a document reference
   * and the estimated time is zero on every line. All of that lives only on the
   * monitor, and only while the job is open.
   *
   * The board is already cached by the backend for every screen watching it, so
   * reading it here costs nothing extra, and the two views cannot disagree.
   *
   * A failure resolves to `null`: this section is an extra on a page that works
   * without it, and a closed job legitimately has nothing here.
   */
  private readonly board = toSignal(
    interval(BOARD_POLL_MS).pipe(
      startWith(0),
      switchMap(() => this.officegest.getWorkshopBoard().pipe(catchError(() => of(null)))),
      map((board) => ({ board, receivedAt: Date.now() })),
    ),
    { initialValue: { board: null as MonitorBoard | null, receivedAt: Date.now() } },
  );

  /** This order's row on the live board, when it is currently open. */
  protected readonly live = computed(() => {
    const { board } = this.board();

    return board?.serviceOrders.find((row) => row.id === this.serviceOrderId()) ?? null;
  });

  protected readonly isLive = computed(() => this.live() !== null);

  protected readonly observedAt = computed(() => this.board().board?.observedAt ?? '');
  protected readonly boardReceivedAt = computed(() => this.board().receivedAt);

  /** Progress as a whole-number percentage, or `null` when upstream sent none. */
  protected readonly liveProgress = computed(() => {
    const fraction = this.live()?.completionPercentage;

    return fraction === undefined ? null : Math.round(fraction * 100);
  });

  /**
   * The total standard time booked on this job, in minutes.
   *
   * Summed from the price list, and absent unless at least one intervention
   * has an estimate — which on this tenant is rare: the workshop has filled in
   * a standard time for 38 of 218 job types. A zero here would read as "this
   * job should take no time", which is not what the absence means.
   */
  protected readonly estimatedMinutes = computed(() => {
    const values = (this.live()?.interventions ?? [])
      .map((intervention) => intervention.estimatedMinutes)
      .filter((value): value is number => value !== undefined);

    return values.length > 0 ? values.reduce((a, b) => a + b, 0) : null;
  });

  protected readonly estimatedLabel = computed(() => {
    const minutes = this.estimatedMinutes();

    return minutes === null ? null : formatMinutes(minutes);
  });

  /** Upstream's own completion estimate, computed against the shop calendar. */
  protected readonly liveEstimatedCompletion = computed(() =>
    formatDateTime(this.live()?.estimatedCompletionAt),
  );

  protected interventionEstimate(minutes: number | undefined): string | null {
    return minutes === undefined ? null : formatMinutes(minutes);
  }

  /* ------------------------------------------------------------------ */
  /* Times                                                               */
  /* ------------------------------------------------------------------ */

  /** Re-read every second so the counters advance without a refetch. */
  private readonly now = toSignal(interval(1000).pipe(map(() => Date.now())), {
    initialValue: Date.now(),
  });

  /**
   * How long this job has been open.
   *
   * Shown **only while the job is on the live board**, and that restriction is
   * the whole point. OfficeGest records no completion time, so for a job that
   * has left the board "opened 150 days ago" is a true sentence that reads as a
   * false one — it suggests the car is still here. An open job has no such
   * ambiguity: it is open, and this is how long it has been.
   */
  protected readonly openFor = computed<string | null>(() => {
    const openedAt = this.store.data()?.openedAt;

    if (!openedAt || !this.isLive()) {
      return null;
    }

    const opened = Date.parse(openedAt);

    return Number.isNaN(opened) ? null : formatSpan(Math.max(0, (this.now() - opened) / 1000));
  });

  /**
   * Time actually worked on this job, summed across everyone clocked on.
   *
   * Man-hours, not wall-clock: two mechanics on a car for an hour is two hours
   * of work, and that is what a labour figure means. `null` when nobody has a
   * picagem open, which on this tenant is almost always.
   */
  protected readonly workedSeconds = computed<number | null>(() => {
    const mechanics = this.live()?.mechanics ?? [];
    const observedAt = this.observedAt();
    const receivedAt = this.boardReceivedAt();
    const now = this.now();

    const totals = mechanics
      .map((mechanic) => elapsedSeconds(mechanic.startedAt, observedAt, receivedAt, now))
      .filter((value): value is number => value !== null);

    return totals.length > 0 ? totals.reduce((a, b) => a + b, 0) : null;
  });

  protected readonly workedLabel = computed<string | null>(() => {
    const seconds = this.workedSeconds();

    return seconds === null ? null : formatSpan(seconds);
  });

  /**
   * How much of the estimate has been used, as a percentage.
   *
   * Only when both halves are real. An estimate of zero would divide to
   * infinity, and worked-without-an-estimate would print a percentage of
   * nothing — both are absent rather than guessed.
   */
  protected readonly estimateUsed = computed<number | null>(() => {
    const worked = this.workedSeconds();
    const estimate = this.estimatedMinutes();

    if (worked === null || estimate === null || estimate <= 0) {
      return null;
    }

    return Math.round((worked / (estimate * 60)) * 100);
  });

  /** `true` once the work has run past its estimate — worth colouring. */
  protected readonly overEstimate = computed(() => (this.estimateUsed() ?? 0) > 100);

  /** How late the job is against its promised delivery, while still open. */
  protected readonly overdueBy = computed<string | null>(() => {
    const order = this.store.data();

    if (!order?.expectedDeliveryAt || !this.isLive()) {
      return null;
    }

    const due = Date.parse(order.expectedDeliveryAt);
    const late = this.now() - due;

    return Number.isNaN(due) || late <= 0 ? null : formatSpan(late / 1000);
  });

  /**
   * The average age of the work orders currently open, for context.
   *
   * A number on its own says little — "open 150 days" could be normal here or
   * alarming. The board carries every open job, so the comparison costs one
   * pass over data already on the page. Jobs with no opening date are excluded
   * rather than counted as zero, which would drag the mean down and flatter
   * every job measured against it.
   */
  protected readonly averageOpenAge = computed<string | null>(() => {
    const rows = this.board().board?.serviceOrders ?? [];
    const now = this.now();

    const ages = rows
      .map((row) => (row.openedAt ? now - Date.parse(row.openedAt) : Number.NaN))
      .filter((age) => !Number.isNaN(age) && age >= 0);

    if (ages.length === 0) {
      return null;
    }

    return formatSpan(ages.reduce((a, b) => a + b, 0) / ages.length / 1000);
  });

  /** Where this job sits against that average, in words. */
  protected readonly againstAverage = computed<string | null>(() => {
    const order = this.store.data();
    const rows = this.board().board?.serviceOrders ?? [];

    if (!order?.openedAt || !this.isLive() || rows.length === 0) {
      return null;
    }

    const ages = rows
      .map((row) => (row.openedAt ? this.now() - Date.parse(row.openedAt) : Number.NaN))
      .filter((age) => !Number.isNaN(age) && age >= 0);

    if (ages.length === 0) {
      return null;
    }

    const mean = ages.reduce((a, b) => a + b, 0) / ages.length;
    const mine = this.now() - Date.parse(order.openedAt);

    // Within a tenth of the mean is "about average" — reporting a job three
    // hours above a hundred-day mean as "above average" is technically true
    // and useless.
    if (Math.abs(mine - mean) <= mean * 0.1) {
      return 'em linha com a média';
    }

    return mine > mean ? 'acima da média' : 'abaixo da média';
  });

  protected readonly title = computed(() => {
    const order = this.store.data();
    return order ? `Folha de obra ${order.number ?? order.id}` : '';
  });

  protected readonly subtitle = computed(() => {
    const order = this.store.data();

    if (!order) {
      return null;
    }

    // The two things that identify the job at a glance, when both are known.
    return [order.customerName, formatPlate(order.plate)].filter(Boolean).join(' · ') || null;
  });

  protected readonly plateLink = computed(() => this.store.data()?.plate ?? null);

  /** Conditions that change what someone does with the car. */
  protected readonly flags = computed<readonly { label: string; class: string }[]>(() => {
    const order = this.store.data();

    if (!order) {
      return [];
    }

    const flags: { label: string; class: string }[] = [];

    if (order.cancelled) {
      flags.push({ label: 'Anulada', class: 'bg-red-50 text-red-700 ring-red-600/20' });
    }

    if (order.awaitingParts) {
      flags.push({
        label: 'A aguardar peças',
        class: 'bg-amber-50 text-amber-800 ring-amber-600/20',
      });
    }

    return flags;
  });

  protected readonly fields = computed<readonly DetailField[]>(() => {
    const order = this.store.data();

    if (!order) {
      return [];
    }

    // Declared in reading order, then filtered — so the order is obvious here
    // and "omit what is absent" is applied once, at the end.
    const candidates: readonly (DetailField & { readonly value: string | null })[] = [
      { label: 'Número', value: orNull(order.number ?? order.id) },
      {
        label: 'Estado',
        value: formatServiceOrderStatus(order.status, order.statusName),
        badge: true,
      },
      { label: 'Cliente', value: orNull(order.customerName) },
      { label: 'Matrícula', value: formatPlate(order.plate) },
      { label: 'Quilómetros', value: formatMileageReading(order.mileage) },
      { label: 'Mecânico', value: this.mechanicName(order) },
      { label: 'Abertura', value: formatDate(order.openedAt) },
      { label: 'Entrada no sistema', value: formatDateTime(order.registeredAt) },
      { label: 'Entrega prevista', value: formatDate(order.expectedDeliveryAt) },
      // There is deliberately no "Fecho" row. OfficeGest publishes no
      // completion timestamp on a work order — the field this used to read
      // was `undefined` on every job ever mapped — so the row never rendered
      // and the model no longer carries it. See `service-order.mapper.ts`.
      { label: 'Total', value: formatCurrency(order.total) },
      { label: 'Descrição', value: orNull(order.description), wide: true },
      { label: 'Notas do mecânico', value: orNull(order.mechanicNotes), wide: true },
    ];

    return candidates.filter((field) => field.value !== null);
  });

  /** The billed lines, pre-formatted so the template does no arithmetic. */
  protected readonly lines = computed(() =>
    (this.store.data()?.lines ?? []).map((line, index) => ({
      // The upstream id is not guaranteed unique across `lines` and
      // `extra_lines`, which the backend concatenates — so the index is what
      // makes the `track` expression safe.
      key: `${line.id ?? 'line'}-${index}`,
      description: orNull(line.description) ?? '—',
      quantity: line.quantity?.toLocaleString('pt-PT') ?? '—',
      unitPrice: formatCurrency(line.unitPrice) ?? '—',
      discount: formatPercent(line.discountPercentage),
      vatRate: formatPercent(line.vatPercentage),
      net: formatCurrency(line.totalWithoutVat) ?? '—',
      vat: formatCurrency(line.vatValue) ?? '—',
      total: formatCurrency(line.total) ?? '—',
    })),
  );

  /**
   * The column totals.
   *
   * Summed from the lines rather than read from `order.total`: the two answer
   * different questions — the order's own total is what OfficeGest billed for
   * the job, while this is what the lines on screen add up to. Showing the
   * first under a table of the second invites the reader to check the
   * arithmetic and find it wrong.
   */
  protected readonly lineTotals = computed(() => {
    const lines = this.store.data()?.lines ?? [];

    if (lines.length === 0) {
      return null;
    }

    const sum = (pick: (line: ServiceOrderLine) => number | undefined): number | undefined => {
      const values = lines.map(pick).filter((value): value is number => value !== undefined);

      // Absent, not zero: a column upstream never filled in must not add up to
      // a confident nothing.
      return values.length > 0 ? values.reduce((a, b) => a + b, 0) : undefined;
    };

    return {
      net: formatCurrency(sum((line) => line.totalWithoutVat)) ?? '—',
      vat: formatCurrency(sum((line) => line.vatValue)) ?? '—',
      total: formatCurrency(sum((line) => line.total)) ?? '—',
    };
  });

  private mechanicName(order: ServiceOrder): string | null {
    const id = order.mechanicId;

    if (!id) {
      return null;
    }

    // The id is a poor label, but dropping the fact that the job is assigned
    // would be worse than showing it when the roster could not be read.
    return this.employeeNames().get(id) ?? `#${id}`;
  }
}
