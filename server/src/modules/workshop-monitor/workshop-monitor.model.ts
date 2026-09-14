/**
 * The live workshop board, as this service publishes it.
 *
 * WHY ELAPSED TIME IS NOT A FIELD HERE
 * ------------------------------------
 * A mechanic's entry carries `startedAt` and nothing else, because the elapsed
 * time is a function of *when you ask*. Serialising `elapsedSeconds: 4 812` into
 * a response would bake in the instant the server happened to answer, and the
 * number would be wrong by the time it reached the screen — then wrong by a
 * further second, every second, until the next poll. The browser ticks its own
 * clock between polls (see the Angular board) and needs only the start.
 *
 * `MonitorBoard.observedAt` is what makes that safe across clock skew: it is
 * the server's own reading of "now" at the moment the snapshot was taken, so a
 * browser whose clock is ten minutes fast can still compute a correct elapsed
 * time by measuring forward from `observedAt` instead of from its own `now`.
 *
 * WHY THERE IS NO `endedAt`
 * -------------------------
 * Upstream does not publish one. A mechanic appears in `mechanics` while they
 * are on the job and is gone from it afterwards — the array *is* the present
 * tense. Total time per completed repair therefore cannot be read from this
 * API; see `workshop-monitor.service.ts`.
 */

/** A mechanic currently stood at the car. */
export interface MonitorMechanic {
  /** Upstream's `employee_code`. Opaque; matches `id` on `/workshop/mechanics`. */
  readonly employeeCode: string;
  readonly name?: string;
  /**
   * When this mechanic clocked onto the job, ISO-8601.
   *
   * Optional because upstream may list a mechanic as assigned without a
   * clock-on. A row with a name and no `startedAt` means "assigned, not
   * started", which the board shows differently from a running timer.
   */
  readonly startedAt?: string;
  /** Upstream's `show_in_monitor`. A mechanic flagged false is hidden on the shop screen. */
  readonly showInMonitor?: boolean;
}

/** One job of work booked on the order. */
export interface MonitorIntervention {
  /** Upstream's `sequence_number` — the line's order on the sheet. */
  readonly sequenceNumber?: number;
  /** The job's name, e.g. "Mudança de óleo". */
  readonly name?: string;
  readonly completed: boolean;
  /**
   * Upstream's `duration`, verbatim and unconverted.
   *
   * The documentation gives the type (integer) and not the unit, and no record
   * on this tenant has ever carried the field, so there is nothing to calibrate
   * against. Publishing it under a name that claims minutes or hours would be
   * inventing a fact; `durationRaw` says exactly what is known. Rename it the
   * day a real value appears and the unit can be confirmed.
   */
  readonly durationRaw?: number;
  /**
   * How long this job is expected to take, in minutes.
   *
   * Resolved from the intervention catalogue by name — the only join that works
   * (see `OFFICEGEST_PATHS.interventionCatalogue`). Absent for the majority:
   * only 38 of 218 catalogue entries carry a non-zero time.
   *
   * WHY MINUTES IS NOT A GUESS HERE
   * -------------------------------
   * Unlike `durationRaw`, this field has real values to calibrate against, and
   * their distribution settles it. The 38 non-zero entries are 12, 15, 15, 15,
   * 18, 24, 30 (twelve times), 48, 60 (eight times), 78, 90, 120, 120, 180, 240,
   * 300 — the shape of a workshop price list in minutes. Seconds would make the
   * commonest job half a minute; hours would make it thirty. Two entries (0.3,
   * 0.5) and one outlier (3000) look like data-entry slips and are published as
   * they are rather than silently corrected.
   */
  readonly estimatedMinutes?: number;
}

/** The vehicle, as the monitor expands it — no second lookup needed. */
export interface MonitorVehicle {
  readonly plate?: string;
  readonly description?: string;
  readonly manufacturingYear?: number;
  readonly mileage?: number;
  readonly brand?: string;
  readonly model?: string;
  readonly version?: string;
  readonly fuel?: string;
}

/** One card on the board. */
export interface MonitorServiceOrder {
  /** Upstream's `number`. The key the workshop quotes. */
  readonly id: string;
  /** The printed reference, e.g. `OSV BF2024/1`. */
  readonly documentNumber?: string;
  /** The tenant's own code — `ESP`, `EXE`, `MAR`. */
  readonly status?: string;
  /** Opened date, ISO-8601. */
  readonly openedAt?: string;
  readonly customerId?: string;
  readonly customerName?: string;
  /** Normalised, so a board card and a vehicle page agree on the key. */
  readonly plate?: string;
  readonly vehicle?: MonitorVehicle;
  readonly awaitingParts?: boolean;
  readonly priority?: number;
  /**
   * Progress as a fraction from 0 to 1.
   *
   * The two documentation pages disagree — one says "number", the other
   * "decimal 0-1" — so the mapper normalises whichever it receives and this
   * field's contract is fixed regardless of which is true upstream.
   */
  readonly completionPercentage?: number;
  readonly estimatedCompletionAt?: string;
  readonly expectedDeliveryAt?: string;
  /** Upstream's `badge_color`, the colour the shop screen paints the card. */
  readonly badgeColor?: string;
  readonly interventions: readonly MonitorIntervention[];
  readonly mechanics: readonly MonitorMechanic[];
}

/**
 * A mechanic on the workshop's roster, whether or not they are on a car.
 *
 * Separate from `MonitorMechanic`, which is an *assignment* — a person at a
 * particular car since a particular time. This is the person themselves. The
 * board needs both to answer "who is working on what", because the interesting
 * half of that question on most days is who is not working on anything.
 */
export interface MonitorRosterEntry {
  /** Matches `MonitorMechanic.employeeCode`, which is what joins the two. */
  readonly employeeCode: string;
  readonly name?: string;
  readonly departmentId?: string;
  /**
   * The department's name, resolved from `departmentId`.
   *
   * Absent when the mechanic has no department, or when the table could not be
   * read — the id is published either way, so the caller can tell "no
   * department" from "name unavailable" rather than being handed a silent gap.
   */
  readonly department?: string;
}

/** The board, plus the reading of "now" every elapsed time is measured from. */
export interface MonitorBoard {
  readonly serviceOrders: readonly MonitorServiceOrder[];
  /**
   * Everyone who could be on a car, so the screen can show who is free.
   *
   * Empty when the roster could not be fetched — which is not the same as an
   * empty workshop, and is why the board carries on rendering without it
   * rather than failing. See `WorkshopMonitorService`.
   */
  readonly roster: readonly MonitorRosterEntry[];
  /** The server's clock when this snapshot was taken, ISO-8601. */
  readonly observedAt: string;
  /**
   * How many jobs have at least one mechanic clocked on.
   *
   * Published because it is the one number that distinguishes "the workshop is
   * idle" from "nobody is recording their work" — and on this tenant it is
   * currently always zero. The board says so in words rather than rendering an
   * empty panel that looks broken.
   */
  readonly activeMechanicCount: number;
}
