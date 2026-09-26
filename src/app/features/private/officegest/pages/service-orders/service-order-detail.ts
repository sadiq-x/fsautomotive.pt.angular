import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, interval, map, of, scan, startWith, switchMap, tap } from 'rxjs';

import { PRIVATE_ROUTES } from '../../../../../core/config/private-routes.config';
import { DetailList, type DetailField } from '../../components/detail-list/detail-list';
import { DetailPage } from '../../components/detail-page/detail-page';
import { LastUpdated } from '../../components/last-updated/last-updated';
import type {
  MonitorBoard,
  MonitorServiceOrder,
  ServiceOrder,
  ServiceOrderLine,
  ServiceOrderTimeEntry,
} from '../../models';
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
import {
  computeBilledTotal,
  formatMileageReading,
  formatServiceOrderStatus,
} from './service-order.labels';

/** The board's own cadence; see `Monitor` for why twenty seconds. */
const BOARD_POLL_MS = 20_000;

/** One board, and the local instant it arrived — `ElapsedTime`'s clock bridge. */
interface BoardReading {
  readonly board: MonitorBoard | null;
  readonly receivedAt: number;
}

/** Before the first poll lands. `receivedAt` is unread while `board` is null. */
const NO_BOARD: BoardReading = { board: null, receivedAt: 0 };

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
          <div>
            <dt class="text-meta font-semibold tracking-wide text-ink-500 uppercase">
              Aberta há
            </dt>
            @if (openFor(); as age) {
              <dd class="mt-1 text-h3 text-ink-950 tabular-nums">{{ age }}</dd>
              @if (averageOpenAge(); as average) {
                <p class="mt-1 text-meta text-ink-500">
                  Média das folhas em curso: {{ average }}
                  @if (againstAverage(); as position) {
                    <span class="font-semibold">· {{ position }}</span>
                  }
                </p>
              }
            } @else {
              <!--
                Not a blank OfficeGest failed to fill in: once a job leaves the
                active board there is no way to tell whether it closed a day
                ago or a year ago, so "aberta há 150 dias" would read as "the
                car is still here" on a job that left long since. Silence would
                look like a missing field rather than a deliberate one, so the
                reason is stated instead.
              -->
              <dd class="mt-1 text-h3 text-ink-300" title="Só disponível enquanto a folha está em curso">
                —
              </dd>
              <p class="mt-1 text-meta text-ink-500">
                Só é calculada enquanto a folha está em curso no quadro da oficina.
              </p>
            }
          </div>

          <div>
            <dt class="text-meta font-semibold tracking-wide text-ink-500 uppercase">
              Tempo trabalhado
            </dt>
            @if (workedLabel(); as worked) {
              <dd class="mt-1 text-h3 text-emerald-700 tabular-nums">{{ worked }}</dd>
              <p class="mt-1 text-meta text-ink-500">
                @if (hasTimeEntries()) {
                  Soma do registo de horas desta folha de obra.
                } @else {
                  Soma das picagens abertas nesta folha de obra.
                }
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
              @if (estimateSource() === 'catalogue') {
                <p class="mt-1 text-meta text-ink-500">
                  Tempo padrão do catálogo — esta folha não tem tempos próprios.
                </p>
              }
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

          @if (overdueBy(); as late) {
            <div>
              <dt class="text-meta font-semibold tracking-wide text-ink-500 uppercase">Atraso</dt>
              <dd class="mt-1 text-h3 font-semibold text-amber-700 tabular-nums">{{ late }}</dd>
              <p class="mt-1 text-meta text-ink-500">Para lá da entrega prevista.</p>
            </div>
          }
        </dl>
      </section>

      @if (workSession(); as current) {
        <!--
          Rendered whenever there is a monitor record for this order at all —
          the live board while the job is active, or its full-history record
          once it has closed. The clock-on, the progress and the intervention
          names exist only on the monitor, never on the base order, so a job
          this has nothing for genuinely has no section here.
        -->
        <section class="mt-6 rounded-xl bg-white p-6 shadow-card ring-1 ring-ink-950/6">
          <div class="flex flex-wrap items-baseline justify-between gap-3">
            <h2 class="text-h3 text-ink-900">
              {{ isLive() ? 'Trabalho em curso' : 'Registo de picagens' }}
            </h2>
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
                    @if (isLive()) {
                      <!--
                        Only ticks while the order is genuinely still open: a
                        stopwatch counting up on a closed job would claim work
                        is still happening when it is not.
                      -->
                      <span class="flex shrink-0 flex-col items-end gap-0.5">
                        <app-elapsed-time
                          class="text-h3 font-semibold text-emerald-700"
                          [startedAt]="mechanic.startedAt"
                          [observedAt]="observedAt()"
                          [receivedAt]="boardReceivedAt()"
                        />
                        <span class="text-meta text-ink-400"
                          >desde {{ formatDateTime(mechanic.startedAt) }}</span
                        >
                      </span>
                    } @else {
                      <!--
                        No live board for a closed job, so no server "now" to
                        measure a duration against — only the clock-on itself
                        is a fact worth showing.
                      -->
                      <span class="shrink-0 text-body font-semibold text-ink-700">
                        Início: {{ formatDateTime(mechanic.startedAt) }}
                      </span>
                    }
                  } @else {
                    <span class="shrink-0 text-meta text-ink-400">sem picagem</span>
                  }
                </li>
              }
            </ul>
          } @else {
            <!--
              "Aberta", never "registada": the monitor only knows who is
              clocked on at this moment. Sessions already worked and closed
              live in the /times log instead, and on 202600642 that log held
              seven — so "nenhuma picagem registada" was flatly contradicted by
              the section below it.
            -->
            <p class="mt-4 text-body text-ink-500">
              Nenhum mecânico com picagem aberta neste momento.
              @if (hasTimeEntries()) {
                As picagens já registadas estão no registo de horas abaixo.
              }
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

                  @if (interventionEstimate($index); as estimate) {
                    <span class="shrink-0 text-meta text-ink-500 tabular-nums">{{ estimate }}</span>
                  }
                </li>
              }
            </ul>
          }

          <!--
            Said once, here, because it is the question this page most obviously
            invites. This board is the live picagem only, and it never carries a
            close time — the actual start and end of each session, when logged,
            are in "Registo de horas" below instead.
          -->
          <p class="mt-5 border-t border-ink-950/6 pt-4 text-meta text-ink-400">
            Este quadro mostra apenas o início da picagem no monitor, sem hora de fecho. A duração
            real de cada sessão, quando registada, está no registo de horas abaixo.
          </p>
        </section>
      }

      @if (hasTimeEntries()) {
        <!--
          The one section on this page with a genuine end time. Unlike the
          board above, the times sub-resource is a real clock-in/clock-out
          log: it exists for a closed job exactly as it does for an open one,
          and it names the mechanic on the entry itself.
        -->
        <section class="mt-6 rounded-xl bg-white p-6 shadow-card ring-1 ring-ink-950/6">
          <h2 class="text-h3 text-ink-900">Registo de horas</h2>
          <p class="mt-1 text-meta text-ink-500">
            Cada picagem efetivamente registada nesta folha de obra, com início e fim reais.
          </p>

          <div class="mt-4 overflow-x-auto">
            <table class="w-full min-w-lg border-collapse text-body">
              <caption class="sr-only">
                Registo de horas desta folha de obra
              </caption>
              <thead>
                <tr class="border-b border-ink-950/8 text-meta text-ink-500">
                  <th scope="col" class="py-2 text-left font-semibold">Mecânico</th>
                  <th scope="col" class="py-2 text-left font-semibold">Início</th>
                  <th scope="col" class="py-2 text-left font-semibold">Fim</th>
                  <th scope="col" class="py-2 text-right font-semibold">Duração</th>
                </tr>
              </thead>
              <tbody>
                @for (entry of orderedTimeEntries(); track entry.id) {
                  <tr class="border-b border-ink-950/6 last:border-0">
                    <td class="py-2 pr-4 text-ink-900">
                      {{ entry.employeeName ?? entry.employeeId ?? '—' }}
                    </td>
                    <td class="py-2 pr-4 text-ink-700 tabular-nums">
                      {{ formatDateTime(entry.startedAt) ?? '—' }}
                    </td>
                    <td class="py-2 pr-4 tabular-nums" [class]="entry.endedAt ? 'text-ink-700' : 'text-amber-700 font-semibold'">
                      {{ entry.endedAt ? formatDateTime(entry.endedAt) : 'Em curso' }}
                    </td>
                    <td class="py-2 text-right font-semibold text-ink-900 tabular-nums">
                      {{ timeEntryDuration(entry) ?? '—' }}
                    </td>
                  </tr>
                }
              </tbody>
              @if (loggedLabel(); as total) {
                <tfoot>
                  <tr class="border-t-2 border-ink-950/10 text-ink-900">
                    <th scope="row" colspan="3" class="py-2 text-right font-semibold">Total</th>
                    <td class="py-2 text-right font-semibold tabular-nums">{{ total }}</td>
                  </tr>
                </tfoot>
              }
            </table>
          </div>
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
  protected readonly formatDateTime = formatDateTime;

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
   * The order's own record has no mechanic clock-on, no progress percentage
   * and no intervention *names* — its nested `interventions` carry only
   * `line_number`, `id` and `estimated_time`, and the id is a document
   * reference rather than a catalogue key. That last field is real, though:
   * CORRECTED 2026-09-26, it is not zero, and `estimatedMinutes` below reads
   * it from the order directly rather than through this board. What genuinely
   * lives only on the monitor, and only while the job is open, is who is
   * clocked on, the live progress bar, and each intervention's name.
   *
   * The board is already cached by the backend for every screen watching it, so
   * reading it here costs nothing extra, and the two views cannot disagree.
   *
   * A failed poll keeps the last board that arrived, the same rule `Monitor`
   * and `MechanicDetail` follow. It used to resolve to `null`, which made one
   * network blip look like the job had closed: "Trabalho em curso" became
   * "Registo de picagens", "Aberta há" gave the closed-job reason, and the
   * running timer vanished — for twenty seconds, until the next poll. A board
   * is kept together with its own `receivedAt`, because the timers measure
   * from that pair and would drift if either were replaced alone.
   */
  private readonly board = toSignal(
    interval(BOARD_POLL_MS).pipe(
      startWith(0),
      switchMap(() =>
        this.officegest.getWorkshopBoard().pipe(
          map((board): BoardReading => ({ board, receivedAt: Date.now() })),
          catchError(() => of(null)),
        ),
      ),
      scan((previous: BoardReading, next: BoardReading | null) => next ?? previous, NO_BOARD),
    ),
    { initialValue: NO_BOARD },
  );

  /** This order's row on the live board, when it is currently open. */
  protected readonly live = computed(() => {
    const { board } = this.board();

    return board?.serviceOrders.find((row) => row.id === this.serviceOrderId()) ?? null;
  });

  protected readonly isLive = computed(() => this.live() !== null);

  protected readonly observedAt = computed(() => this.board().board?.observedAt ?? '');
  protected readonly boardReceivedAt = computed(() => this.board().receivedAt);

  /**
   * This order's full-history monitor record, read once per order rather than
   * polled: unlike the board, a closed order's clock-on does not change while
   * this page stays open.
   *
   * WHY THIS EXISTS SEPARATELY FROM `board`
   * ----------------------------------------
   * `board` only ever covers the active states (ESP/EXE/MAR). The moment this
   * order closes it drops off that list for good, and with it the only place
   * the mechanic who worked it was ever recorded — unless it is read here, by
   * number, from the unfiltered monitor instead. See
   * `WorkshopMonitorService.orderSnapshot` on the backend.
   *
   * A failure resolves to `null`, the same tolerance `board` has: this is an
   * extra on a page that works without it.
   */
  private readonly historicalSnapshot = toSignal(
    toObservable(this.serviceOrderId).pipe(
      switchMap((id) => this.officegest.getWorkshopMonitorOrder(id).pipe(catchError(() => of(null)))),
    ),
    { initialValue: null as MonitorServiceOrder | null },
  );

  /**
   * Whatever this page can say about who worked this order — live if it is
   * still on the board, its closed history otherwise.
   *
   * Kept distinct from `live`: `isLive`, `openFor`, `overdueBy` and the
   * average-age comparison all mean "this job is currently active", and
   * folding historical data into `live` would make a closed job look open.
   * This is only ever read for the parts that are true either way — who
   * clocked on, and when, and which interventions were booked.
   */
  protected readonly workSession = computed(() => this.live() ?? this.historicalSnapshot());

  /**
   * The real clock-in/clock-out log for this order — read once, not polled,
   * because a logged entry does not change while this page stays open.
   *
   * WHY THIS IS A SEPARATE SOURCE FROM EVERYTHING ABOVE
   * ----------------------------------------------------
   * `live` and `historicalSnapshot` both come from the monitor, whose
   * `mechanics[]` carries a clock-*on* and nothing else — OfficeGest never
   * publishes when that session ended. `/times` is a different endpoint
   * entirely: a genuine timesheet, with a real `end_time` and the actual
   * minutes worked, per mechanic, per session. It is what answers "when did
   * this job actually get worked, and for how long" — the monitor cannot.
   *
   * A failure resolves to an empty list: this section is an extra on a page
   * that works without it.
   */
  private readonly timeEntries = toSignal(
    toObservable(this.serviceOrderId).pipe(
      switchMap((id) =>
        this.officegest.getServiceOrderTimes(id).pipe(catchError(() => of([] as readonly ServiceOrderTimeEntry[]))),
      ),
    ),
    { initialValue: [] as readonly ServiceOrderTimeEntry[] },
  );

  protected readonly hasTimeEntries = computed(() => this.timeEntries().length > 0);

  /**
   * Every entry, oldest first — the order someone reading a log expects, and
   * the reverse of upstream's own (unspecified) ordering.
   */
  protected readonly orderedTimeEntries = computed(() =>
    [...this.timeEntries()].sort((a, b) => {
      const left = a.startedAt ? Date.parse(a.startedAt) : Number.POSITIVE_INFINITY;
      const right = b.startedAt ? Date.parse(b.startedAt) : Number.POSITIVE_INFINITY;

      return left - right;
    }),
  );

  /**
   * Every mechanic who actually logged time on this order, in the order they
   * first clocked on — not the roster order, and not alphabetical, because
   * "who started first" is the more useful reading on a job with several.
   *
   * Falls back to the employee id when a name is missing, the same rule the
   * monitor mechanic list uses, rather than dropping someone the log does
   * name in some form.
   */
  protected readonly mechanicNames = computed<readonly string[]>(() => {
    const seen = new Set<string>();
    const names: string[] = [];

    for (const entry of this.orderedTimeEntries()) {
      const name = entry.employeeName ?? entry.employeeId;

      if (name && !seen.has(name)) {
        seen.add(name);
        names.push(name);
      }
    }

    return names;
  });

  protected mechanicNamesLabel(): string | null {
    const names = this.mechanicNames();

    return names.length > 0 ? names.join(', ') : null;
  }

  /**
   * Total minutes actually worked, summed across every logged session.
   *
   * This is upstream's own arithmetic on real start/end pairs, so it is the
   * one figure on this page that is true for a closed job exactly as it is for
   * an open one — unlike `workedSeconds` below, which only means anything
   * while a mechanic is still clocked on right now.
   */
  protected readonly loggedMinutes = computed<number | null>(() => {
    const entries = this.timeEntries();

    if (entries.length === 0) {
      return null;
    }

    const minutes = entries
      .map((entry) => entry.workedMinutes)
      .filter((value): value is number => value !== undefined);

    return minutes.length > 0 ? minutes.reduce((a, b) => a + b, 0) : null;
  });

  protected readonly loggedLabel = computed<string | null>(() => {
    const minutes = this.loggedMinutes();

    return minutes === null ? null : formatMinutes(minutes);
  });

  /**
   * One entry's own duration — upstream's `workedMinutes` when it sent one,
   * otherwise computed from its own start and end so an entry missing just
   * that one figure still shows something rather than a bare dash.
   */
  protected timeEntryDuration(entry: ServiceOrderTimeEntry): string | null {
    if (entry.workedMinutes !== undefined) {
      return formatMinutes(entry.workedMinutes);
    }

    if (!entry.startedAt || !entry.endedAt) {
      return null;
    }

    const minutes = (Date.parse(entry.endedAt) - Date.parse(entry.startedAt)) / 60_000;

    return Number.isFinite(minutes) && minutes >= 0 ? formatMinutes(minutes) : null;
  }

  /**
   * Progress as a whole-number percentage, or `null` when upstream sent none.
   *
   * Read from `workSession`, not `live`: a closed job's last-known completion
   * percentage is still a true fact about it, unlike a live-only figure such
   * as the ETA below.
   */
  protected readonly liveProgress = computed(() => {
    const fraction = this.workSession()?.completionPercentage;

    return fraction === undefined ? null : Math.round(fraction * 100);
  });

  /**
   * Where every estimate on this page comes from — one source at a time,
   * never mixed.
   *
   * WHY THIS EXISTS
   * ---------------
   * There are two sources, and they disagree. The order's own interventions
   * carry the time booked on *this* job (`202600642`: 60, 30, 30, 30, 330).
   * The price-list catalogue carries a *standard* time per job type, matched
   * by name (`LUZ MOTOR`: 18, where the order booked 30). The header once read
   * the first while each line read the second, so the page said "8 h 00 min"
   * above a list adding up to 33 minutes.
   *
   *  - `'order'` whenever the order has any timed line — the real booking.
   *    12 of 31 active orders did on 2026-09-26.
   *  - `'catalogue'` only when the order has none, so the reader still gets
   *    a standard time — labelled as such in the Tempos section.
   *  - `null` when neither has anything.
   */
  protected readonly estimateSource = computed<'order' | 'catalogue' | null>(() => {
    if (this.store.data()?.estimatedMinutes !== undefined) {
      return 'order';
    }

    const fromCatalogue = (this.workSession()?.interventions ?? []).some(
      (intervention) => intervention.estimatedMinutes !== undefined,
    );

    return fromCatalogue ? 'catalogue' : null;
  });

  /** The whole job's estimate, in minutes, from `estimateSource`. */
  protected readonly estimatedMinutes = computed<number | null>(() => {
    switch (this.estimateSource()) {
      case 'order':
        return this.store.data()?.estimatedMinutes ?? null;
      case 'catalogue':
        return sumDefined(
          (this.workSession()?.interventions ?? []).map((i) => i.estimatedMinutes),
        );
      default:
        return null;
    }
  });

  protected readonly estimatedLabel = computed(() => {
    const minutes = this.estimatedMinutes();

    return minutes === null ? null : formatMinutes(minutes);
  });

  /**
   * Each intervention's estimate, aligned by index with
   * `workSession().interventions` — from the same source as the header, so
   * the lines always add up to it.
   *
   * The order's own times carry no names, so they are paired with the
   * monitor's named list by position. That is only sound when both lists are
   * the same length — true on all 31 active orders checked on 2026-09-26.
   * If they ever differ, no per-line time is shown rather than a misaligned
   * one beside the wrong job.
   */
  protected readonly perLineMinutes = computed<readonly (number | undefined)[]>(() => {
    const interventions = this.workSession()?.interventions ?? [];

    switch (this.estimateSource()) {
      case 'order': {
        const own = this.store.data()?.interventionMinutes;

        return own && own.length === interventions.length
          ? own.map((minutes) => minutes ?? undefined)
          : [];
      }
      case 'catalogue':
        return interventions.map((intervention) => intervention.estimatedMinutes);
      default:
        return [];
    }
  });

  protected interventionEstimate(index: number): string | null {
    const minutes = this.perLineMinutes()[index];

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

  /**
   * Time actually worked on this job — the logged total when there is one,
   * the live figure otherwise.
   *
   * `/times` wins when it has anything: it is upstream's own arithmetic on
   * real start/end pairs and covers every session, open or closed, while the
   * live figure only ever knows about whoever is clocked on to the monitor
   * board right now. Preferring one over adding them together also avoids
   * double-counting a session that is live now and gets logged later.
   */
  protected readonly totalWorkedSeconds = computed<number | null>(() => {
    const logged = this.loggedMinutes();

    return logged !== null ? logged * 60 : this.workedSeconds();
  });

  /**
   * Hours and minutes, never days — the same format as "Tempo estimado" and
   * the hours-log total. `formatSpan` is for how long a job has been *open*;
   * labour is not calendar time, and rendering 30 hours of work as "1 dia 6 h"
   * disagreed with the "30 h 00 min" printed under it in the hours log.
   * Floored rather than rounded, so a running timer never shows a minute that
   * has not finished.
   */
  protected readonly workedLabel = computed<string | null>(() => {
    const seconds = this.totalWorkedSeconds();

    return seconds === null ? null : formatMinutes(Math.floor(seconds / 60));
  });

  /**
   * How much of the estimate has been used, as a percentage.
   *
   * Only when both halves are real. An estimate of zero would divide to
   * infinity, and worked-without-an-estimate would print a percentage of
   * nothing — both are absent rather than guessed.
   */
  protected readonly estimateUsed = computed<number | null>(() => {
    const worked = this.totalWorkedSeconds();
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
      // Distinct from the row below on purpose: this is who the job was
      // *assigned* to in OfficeGest, which the codebase's own probing found
      // sparse — 69 of 1 000 jobs carry one. It is not a claim about who did
      // the work.
      { label: 'Mecânico atribuído', value: this.mechanicName(order) },
      // Who actually clocked time on this job, from the real log below rather
      // than an assignment field. Multiple names, comma-joined, because more
      // than one mechanic working the same order is the ordinary case — 2 of
      // 2 mechanics on the order this was built against.
      { label: 'Mecânicos que trabalharam', value: this.mechanicNamesLabel(), wide: true },
      { label: 'Abertura', value: formatDate(order.openedAt) },
      { label: 'Entrada no sistema', value: formatDateTime(order.registeredAt) },
      { label: 'Entrega prevista', value: formatDate(order.expectedDeliveryAt) },
      // There is deliberately no "Fecho" row. OfficeGest publishes no
      // completion timestamp on a work order — the field this used to read
      // was `undefined` on every job ever mapped — so the row never rendered
      // and the model no longer carries it. See `service-order.mapper.ts`.
      // Read from the billed lines, not `order.total` — see `lineTotals` for
      // why that field cannot be trusted as the job's real total.
      { label: 'Total', value: this.lineTotals()?.total ?? null },
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
   * The column totals — and, since the fix below, the order's own "Total"
   * field too.
   *
   * WHY `order.total` IS NOT USED, ANYWHERE ON THIS PAGE
   * -----------------------------------------------------
   * This was believed to be a legitimate second figure — OfficeGest's own
   * billed total, differing from the line sum only in scope or rounding.
   * CORRECTED 2026-09-26: on order 202600642, `order.total` is `6.03` — which
   * is not a rounding difference from the real total of `409.54`, it is
   * *exactly* the gross of one line, "Taxa de resíduos" (4.90 + 1.13 VAT).
   * Whatever this field is on this tenant, it is not the order's total; it
   * looks like the total of the `lines` array alone (this order has one entry
   * there), with the nine real billed items sitting in `extra_lines` instead
   * and never counted. Showing it anywhere — the top field, this table, the
   * list page, a mechanic's history — would show a customer's brake job as
   * costing six euros three cents.
   *
   * This is summed from `lines`, which the backend already concatenates with
   * `extra_lines` before it reaches here (see `service-order.mapper.ts`), so
   * both arrays are covered.
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
      // The one canonical definition of "this job's real total" — shared with
      // the work-order list and, wherever else it is needed, `computeBilledTotal`.
      total: formatCurrency(computeBilledTotal(lines)) ?? '—',
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

/** The sum of the values that are present, or `null` when none are. */
function sumDefined(values: readonly (number | undefined)[]): number | null {
  const present = values.filter((value): value is number => value !== undefined);

  return present.length > 0 ? present.reduce((a, b) => a + b, 0) : null;
}
