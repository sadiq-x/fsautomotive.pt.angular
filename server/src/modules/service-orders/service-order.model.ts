/**
 * A workshop job (folha de obra), as this API publishes it.
 *
 * WHAT THE TENANT ACTUALLY SENDS
 * ------------------------------
 * Probed on 2026-09-08. A *list* record carries 16 fields and a *detail* record
 * 24 — of which this model previously published nine. The ones added since are
 * the ones the workshop reads a job by: who it is for, who is working on it,
 * the mileage it came in at, and whether it is waiting for parts.
 *
 * `interventions`, `lines` and `extra_lines` are detail-only arrays: the labour
 * booked, the parts billed, and the extras. They are the answer to "what was
 * actually done", so they are published rather than summarised away.
 */

/**
 * One billed line — a part, a fluid, or a piece of labour.
 *
 * WHAT CHANGED HERE, AND WHY IT MATTERED
 * --------------------------------------
 * `total` was documented as "gross, i.e. with VAT" and was in fact reading
 * `total_without_vat`, because the candidate list was `['total',
 * 'total_without_vat']` and upstream sends no `total` at all. Every line on
 * every work order was therefore showing a **net** figure under a label
 * promising a gross one — understating what the customer pays by the VAT.
 *
 * Both are now published under names that say which is which, and `total` is
 * computed rather than read, so the two can never drift apart again.
 *
 * The other seven fields are simply ones upstream sends and nothing read:
 * CONFIRMED 2026-09-13 across 158 lines on 33 work orders.
 */
export interface ServiceOrderLine {
  readonly id?: string;
  /** Its position on the sheet, which is the order the workshop reads them in. */
  readonly lineNumber?: number;
  /** The stock article behind the line, when it is a part rather than labour. */
  readonly articleId?: string;
  readonly description?: string;
  readonly quantity?: number;
  /** Net unit price, before VAT. */
  readonly unitPrice?: number;
  /** The same unit price with VAT applied — upstream's own figure, not derived. */
  readonly unitPriceWithVat?: number;
  /** The VAT rate on this line, as a percentage. */
  readonly vatPercentage?: number;
  /** Discount applied to this line, as a percentage. */
  readonly discountPercentage?: number;
  /** Net line total, before VAT. */
  readonly totalWithoutVat?: number;
  /** The VAT on this line, in currency. */
  readonly vatValue?: number;
  /**
   * Gross line total — net plus VAT, which is the figure a customer recognises.
   *
   * Computed here rather than read, because upstream publishes no gross total
   * for a line. Absent when the net is absent: inventing a gross from a missing
   * net would print a confident zero where there is no information.
   */
  readonly total?: number;
}

export interface ServiceOrder {
  readonly id: string;
  /** The number the workshop and the customer actually quote, e.g. `OSV BF2024/1`. */
  readonly number?: string;
  readonly plate?: string;
  readonly customerId?: string;
  /**
   * The customer's name as it appears on the invoice.
   *
   * Present on the record itself, so the list can name the customer without a
   * lookup per row.
   */
  readonly customerName?: string;
  /**
   * The tenant's own short code — `FAC`, `ESP`, `ENT`, `ANU`…
   *
   * Published as the code rather than upstream's `status_name`, which on this
   * tenant is mostly an untranslated token ("n4482"). See the mapper.
   */
  readonly status?: string;
  /** `status_name`, but only when it is a readable label rather than a token. */
  readonly statusName?: string;
  /** `true` when the job was cancelled outright. */
  readonly cancelled?: boolean;
  /** `true` while the job is held waiting for parts. */
  readonly awaitingParts?: boolean;
  readonly description?: string;
  /** The mechanic's own notes, detail-only. */
  readonly mechanicNotes?: string;
  readonly openedAt?: string;
  /** When the job was first entered in OfficeGest, which may precede `openedAt`. */
  readonly registeredAt?: string;
  /** Promised delivery, when one is set. */
  readonly expectedDeliveryAt?: string;
  /** Odometer reading when the vehicle came in. */
  readonly mileage?: number;
  /** The assigned mechanic; resolve to a name with `Employee`. */
  readonly mechanicId?: string;
  /** Upstream's numeric priority. Published verbatim — its scale is not documented. */
  readonly priority?: number;
  /**
   * ⚠️ NOT the order's total. Kept for backward compatibility with any caller
   * still reading it directly, but do not display this as "the total" of a
   * job — use `lines` (summing `totalWithoutVat` + `vatValue` per entry, as
   * the frontend's `lineTotals` does) instead.
   *
   * CORRECTED 2026-09-26: documented here as "Net total", and read from
   * upstream's own `total` field on the assumption it was OfficeGest's billed
   * figure for the whole job, differing from the line sum only by scope or
   * rounding. On order 202600642 it is `6.03` — not close to the real
   * `409.54` the lines add up to, and not a rounding gap either: it is
   * *exactly* the gross of one line ("Taxa de resíduos", 4.90 + 1.13 VAT).
   * This order's `lines` array holds that one entry; the nine real billed
   * items sit in `extra_lines`. Whatever upstream's `total` actually sums, it
   * is not this job's cost.
   */
  readonly total?: number;
  /**
   * The standard time booked on this job, summed across its own interventions.
   *
   * CORRECTED 2026-09-26: this was believed unusable — the intervention
   * catalogue's own header comment says these ids "carry `estimated_time`
   * zero on every one", confirmed 2026-09-13. That is no longer true on this
   * tenant: order 202600642's 5 interventions all carry a real, non-zero
   * `estimated_time` summing to 480 minutes. Detail-only, like `lines`.
   */
  readonly estimatedMinutes?: number;
  /**
   * The same booked time, per intervention, in `line_number` order — `null`
   * for a line nobody timed. Unnamed: upstream's order record carries no
   * intervention names, only the monitor does. Detail-only, like `lines`.
   */
  readonly interventionMinutes?: readonly (number | null)[];
  /** Billed parts and labour. Detail-only; a list row has none. */
  readonly lines?: readonly ServiceOrderLine[];
}

/**
 * One entry in this order's actual clocked time log.
 *
 * Unlike everything else on this order, this carries a real `endedAt` —
 * OfficeGest's `/times` sub-resource is the one place in this API that
 * records a mechanic's clock-*out*, not only their clock-on. See
 * `service-order.mapper.ts` for where that was confirmed.
 */
export interface ServiceOrderTimeEntry {
  readonly id: string;
  readonly employeeId?: string;
  /** Present on the record itself; no roster lookup needed to show a name. */
  readonly employeeName?: string;
  readonly startedAt?: string;
  /** Absent only for an entry nobody has clocked out of yet. */
  readonly endedAt?: string;
  /** Upstream's own `end - start` in minutes, when the entry is closed. */
  readonly workedMinutes?: number;
  readonly interventionId?: string;
}
