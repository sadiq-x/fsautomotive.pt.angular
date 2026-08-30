/**
 * The machine-readable `error.code` vocabulary of this API.
 *
 * Clients branch on these, not on the message: messages are for humans and may
 * be reworded or translated, codes are a contract. Keeping the whole vocabulary
 * in one file is what makes that promise checkable in review.
 */
export const ERROR_CODES = {
  /* --- Caller's fault ---------------------------------------------------- */
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMITED: 'RATE_LIMITED',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',

  /* --- OfficeGest's fault, or ours in how we call it ---------------------- */
  OFFICEGEST_API_ERROR: 'OFFICEGEST_API_ERROR',
  OFFICEGEST_AUTH_ERROR: 'OFFICEGEST_AUTH_ERROR',
  OFFICEGEST_FORBIDDEN: 'OFFICEGEST_FORBIDDEN',
  OFFICEGEST_NOT_FOUND: 'OFFICEGEST_NOT_FOUND',
  OFFICEGEST_VALIDATION_ERROR: 'OFFICEGEST_VALIDATION_ERROR',
  OFFICEGEST_RATE_LIMITED: 'OFFICEGEST_RATE_LIMITED',
  OFFICEGEST_UNAVAILABLE: 'OFFICEGEST_UNAVAILABLE',
  OFFICEGEST_TIMEOUT: 'OFFICEGEST_TIMEOUT',
  OFFICEGEST_NETWORK_ERROR: 'OFFICEGEST_NETWORK_ERROR',
  OFFICEGEST_MALFORMED_RESPONSE: 'OFFICEGEST_MALFORMED_RESPONSE',

  /* --- Ours -------------------------------------------------------------- */
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
