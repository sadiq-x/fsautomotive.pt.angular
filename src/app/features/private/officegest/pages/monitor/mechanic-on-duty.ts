import type { MonitorBoard, MonitorServiceOrder } from '../../models';

/**
 * The board, read by mechanic instead of by car.
 *
 * WHY THIS IS A FUNCTION AND NOT A SECOND REQUEST
 * -----------------------------------------------
 * "Which car is João on?" and "who is on this car?" are the same facts asked
 * from opposite ends, and the board payload already contains both — every card
 * carries its own mechanics. Deriving one from the other costs a pass over a
 * list of twenty-nine; asking the backend for it again would cost a round trip,
 * and would introduce the possibility of the two views disagreeing because they
 * were fetched a second apart.
 *
 * WHY IT LIVES OUTSIDE THE COMPONENT
 * ----------------------------------
 * It is a pure transformation with several edge cases worth pinning — a
 * mechanic on two cars, one at a car but absent from the roster, one with no
 * name — and a plain function can be tested by calling it, without a fixture,
 * a TestBed or a change-detection cycle.
 */

/** A mechanic, and the car they are at — or nothing, when they are free. */
export interface MechanicOnDuty {
  readonly employeeCode: string;
  /** Falls back to the code, which is at least stable and identifying. */
  readonly name: string;
  /**
   * Every car this mechanic is currently clocked onto.
   *
   * An array because OfficeGest does not forbid the same person appearing on
   * two open jobs, and a shape that pretended otherwise would silently drop the
   * second one — showing a mechanic as working on a car they had moved off.
   */
  readonly cars: readonly MechanicCar[];
}

export interface MechanicCar {
  /** The job, for the heading and as the key. */
  readonly serviceOrderId: string;
  /** Normalised; format at the point of display. */
  readonly plate?: string;
  /** "Renault Clio", or the vehicle's own description. */
  readonly vehicle?: string;
  /** When they clocked onto this car, ISO-8601. Absent means assigned only. */
  readonly startedAt?: string;
}

/**
 * Everyone who could be at a car, each with the cars they are at.
 *
 * The roster is the spine rather than the assignments: a workshop where nobody
 * has clocked on must still list its mechanics and say they are free, which is
 * the situation this tenant is actually in. Building the list from assignments
 * alone would render an empty panel there, indistinguishable from a fault.
 *
 * Anyone found at a car but missing from the roster is appended rather than
 * dropped — they are demonstrably working, and a roster that has fallen behind
 * must not erase them from the screen.
 */
export function toMechanicsOnDuty(board: MonitorBoard): readonly MechanicOnDuty[] {
  const names = new Map<string, string | undefined>();
  const cars = new Map<string, MechanicCar[]>();

  for (const entry of board.roster) {
    names.set(entry.employeeCode, entry.name);
    cars.set(entry.employeeCode, []);
  }

  for (const order of board.serviceOrders) {
    for (const mechanic of order.mechanics) {
      const car: MechanicCar = {
        serviceOrderId: order.id,
        plate: order.plate,
        vehicle: describeVehicle(order),
        startedAt: mechanic.startedAt,
      };

      const existing = cars.get(mechanic.employeeCode);

      if (existing) {
        existing.push(car);
      } else {
        // Not on the roster; see the note above on why they are kept.
        cars.set(mechanic.employeeCode, [car]);
      }

      // The assignment's name wins: it is the one upstream attached to the work
      // actually happening, and a roster entry may be missing a name entirely.
      if (mechanic.name) {
        names.set(mechanic.employeeCode, mechanic.name);
      } else if (!names.has(mechanic.employeeCode)) {
        names.set(mechanic.employeeCode, undefined);
      }
    }
  }

  return [...cars.entries()]
    .map(([employeeCode, assigned]) => ({
      employeeCode,
      name: names.get(employeeCode) ?? employeeCode,
      cars: assigned,
    }))
    .sort(byWorkingFirst);
}

/** "Renault Clio", falling back to whatever description upstream sent. */
function describeVehicle(order: MonitorServiceOrder): string | undefined {
  const vehicle = order.vehicle;

  if (!vehicle) {
    return undefined;
  }

  const parts = [vehicle.brand, vehicle.model].filter((part): part is string => !!part);

  return parts.length > 0 ? parts.join(' ') : vehicle.description;
}

/**
 * Working first, longest-running at the top, then everyone else by name.
 *
 * The people at a car are the ones a foreman is looking for; the free ones are
 * the answer to a different question and can wait below. Sorting the free ones
 * by name rather than leaving them in upstream order keeps the list from
 * reordering itself between polls.
 */
function byWorkingFirst(a: MechanicOnDuty, b: MechanicOnDuty): number {
  if (a.cars.length !== b.cars.length) {
    return b.cars.length - a.cars.length;
  }

  const left = earliestStart(a);
  const right = earliestStart(b);

  // Compared before subtracting, deliberately. Two free mechanics are both
  // `Infinity`, and `Infinity - Infinity` is `NaN` — a comparator returning
  // `NaN` leaves the order unspecified, which is exactly the wobble between
  // polls this function exists to prevent. `Infinity !== Infinity` is false,
  // so they fall through to the name instead.
  if (left !== right) {
    return left - right;
  }

  return a.name.localeCompare(b.name, 'pt');
}

/**
 * When this mechanic's longest-running job began.
 *
 * `Infinity` for anyone not working, which sorts them after everyone who is —
 * and keeps the comparison a single numeric expression rather than a chain of
 * null checks.
 */
function earliestStart(mechanic: MechanicOnDuty): number {
  const starts = mechanic.cars
    .map((car) => (car.startedAt ? Date.parse(car.startedAt) : Number.NaN))
    .filter((value) => !Number.isNaN(value));

  return starts.length > 0 ? Math.min(...starts) : Number.POSITIVE_INFINITY;
}
