/**
 * Registration-plate normalisation.
 *
 * WHY IT IS ITS OWN FILE
 * ----------------------
 * The plate is the vehicle's primary key upstream, and it arrives from humans:
 * `AA-00-BB`, `aa00bb`, `AA 00 BB` are one car typed three ways. Normalising in
 * one place means the cache key, the upstream path and the response all agree —
 * and it is pure, so the rules can be tested without a server or a network.
 *
 * Portuguese plates are six alphanumerics in three pairs. Separators are dropped
 * rather than rejected: refusing a hyphen a driver naturally types would be
 * pedantry, not validation.
 */

/** Uppercases and strips separators and whitespace. */
export function normalisePlate(input: string): string {
  return input.toUpperCase().replace(/[\s._-]/g, '');
}

/**
 * Six alphanumerics after normalisation — the shape of a Portuguese plate,
 * across every series since 1937.
 *
 * Deliberately not stricter: encoding which pairs are letters and which are
 * digits would reject imported and classic plates the workshop actually
 * services, and the upstream is the real authority anyway.
 */
export function isPlausiblePlate(normalised: string): boolean {
  return /^[A-Z0-9]{6}$/.test(normalised);
}

/** Renders a normalised plate in the conventional `AA-00-BB` grouping. */
export function formatPlate(normalised: string): string {
  return isPlausiblePlate(normalised)
    ? `${normalised.slice(0, 2)}-${normalised.slice(2, 4)}-${normalised.slice(4, 6)}`
    : normalised;
}
