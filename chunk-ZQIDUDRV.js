import {
  AUTH_ERROR_CODES,
  AuthGateway,
  HttpAuthGateway
} from "./chunk-DWZ5PAW5.js";
import {
  ApiError
} from "./chunk-4AV4IBWC.js";
import {
  Injectable,
  __spreadProps,
  __spreadValues,
  delay,
  isDevMode,
  makeEnvironmentProviders,
  of,
  setClassMetadata,
  throwError,
  ɵɵdefineInjectable
} from "./chunk-RUFDRP5X.js";

// src/app/core/config/auth.config.ts
var DEV_AUTH_STUB_FLAG = true ? "true".trim() : "";
function isStubFlagEnabled(flag) {
  return ["true", "1", "on", "yes"].includes(flag.toLowerCase());
}
function isDevAuthStubActive() {
  return isStubFlagEnabled(DEV_AUTH_STUB_FLAG) && isDevMode();
}

// src/app/core/auth/dev-auth.gateway.ts
var STUB_SESSION_KEY = "fsautomotive:dev-session";
var STUB_LATENCY_MS = 350;
var STUB_REJECTED_PASSWORD = "wrong";
var STUB_USER = {
  id: "dev-1",
  name: "Miguel Faria",
  email: "miguel@fsautomotive.pt",
  role: "ADMIN",
  permissions: [
    "officegest.read",
    "officegest.write",
    "officegest.customers.read",
    "officegest.vehicles.read",
    "officegest.service-orders.read",
    "officegest.appointments.read",
    "officegest.appointments.write"
  ]
};
var DevAuthGateway = class _DevAuthGateway extends AuthGateway {
  constructor() {
    super();
    if (!isDevMode()) {
      throw new Error("DevAuthGateway must never be constructed outside development.");
    }
  }
  login(credentials) {
    if (credentials.password === STUB_REJECTED_PASSWORD) {
      return throwError(() => new ApiError(401, AUTH_ERROR_CODES.invalidCredentials, "E-mail ou palavra-passe incorretos.")).pipe(delay(STUB_LATENCY_MS));
    }
    const user = __spreadProps(__spreadValues({}, STUB_USER), { email: credentials.email });
    this.remember(user);
    return of(user).pipe(delay(STUB_LATENCY_MS));
  }
  session() {
    return of(this.recall()).pipe(delay(STUB_LATENCY_MS));
  }
  logout() {
    this.forget();
    return of(void 0).pipe(delay(STUB_LATENCY_MS));
  }
  remember(user) {
    try {
      sessionStorage.setItem(STUB_SESSION_KEY, JSON.stringify(user));
    } catch {
    }
  }
  recall() {
    try {
      const raw = sessionStorage.getItem(STUB_SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
  forget() {
    try {
      sessionStorage.removeItem(STUB_SESSION_KEY);
    } catch {
    }
  }
  static \u0275fac = function DevAuthGateway_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _DevAuthGateway)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _DevAuthGateway, factory: _DevAuthGateway.\u0275fac });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DevAuthGateway, [{
    type: Injectable
  }], () => [], null);
})();

// src/app/core/auth/auth.providers.ts
function provideAuth() {
  const useStub = isDevAuthStubActive();
  if (useStub && !isDevMode()) {
    throw new Error("The development authentication stub cannot be used in production.");
  }
  if (useStub) {
    console.warn("[auth] Development stub active: ANY password is accepted. Unset DEV_AUTH_STUB in .env to use the real backend.");
  }
  return makeEnvironmentProviders([
    { provide: AuthGateway, useClass: useStub ? DevAuthGateway : HttpAuthGateway }
  ]);
}

export {
  isDevAuthStubActive,
  STUB_REJECTED_PASSWORD,
  provideAuth
};
//# sourceMappingURL=chunk-ZQIDUDRV.js.map
