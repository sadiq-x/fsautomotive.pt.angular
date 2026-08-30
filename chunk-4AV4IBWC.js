// src/app/core/models/api.model.ts
var ApiError = class extends Error {
  status;
  code;
  message;
  details;
  requestId;
  name = "ApiError";
  constructor(status, code, message, details, requestId) {
    super(message);
    this.status = status;
    this.code = code;
    this.message = message;
    this.details = details;
    this.requestId = requestId;
  }
  /** `true` when re-issuing the same request could plausibly succeed. */
  get retryable() {
    return this.status === 0 || this.status === 429 || this.status >= 500;
  }
};
function toValidationIssues(details) {
  if (!Array.isArray(details)) {
    return [];
  }
  return details.filter((issue) => typeof issue === "object" && issue !== null && typeof issue.field === "string" && typeof issue.message === "string");
}

export {
  ApiError,
  toValidationIssues
};
//# sourceMappingURL=chunk-4AV4IBWC.js.map
