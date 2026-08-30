import {
  API_BASE_URL
} from "./chunk-GUS6C3RU.js";
import {
  HttpClient,
  HttpContext,
  HttpContextToken,
  Injectable,
  computed,
  firstValueFrom,
  inject,
  map,
  setClassMetadata,
  signal,
  ɵɵdefineInjectable,
  ɵɵgetInheritedFactory
} from "./chunk-RUFDRP5X.js";

// src/app/core/interceptors/api.interceptor.ts
var EXPECTS_UNAUTHORIZED = new HttpContextToken(() => false);
var APP_API_PREFIX = "/api/";
var apiInterceptor = (request, next) => {
  if (!request.url.startsWith(APP_API_PREFIX)) {
    return next(request);
  }
  const baseUrl = inject(API_BASE_URL);
  return next(request.clone({
    url: `${baseUrl}${request.url}`,
    // The session lives in an HttpOnly cookie, which the browser only sends
    // cross-origin when asked.
    withCredentials: true
  }));
};

// src/app/core/auth/auth.contract.ts
var AUTH_ROUTES = {
  login: "/api/auth/login",
  session: "/api/auth/session",
  logout: "/api/auth/logout"
};
var AUTH_ERROR_CODES = {
  invalidCredentials: "INVALID_CREDENTIALS",
  accountLocked: "ACCOUNT_LOCKED"
};

// src/app/core/auth/auth.gateway.ts
var AuthGateway = class {
};
var HttpAuthGateway = class _HttpAuthGateway extends AuthGateway {
  http = inject(HttpClient);
  login(credentials) {
    return this.http.post(AUTH_ROUTES.login, credentials, { withCredentials: true }).pipe(map((response) => response.data));
  }
  session() {
    return this.http.get(AUTH_ROUTES.session, {
      withCredentials: true,
      context: new HttpContext().set(EXPECTS_UNAUTHORIZED, true)
    }).pipe(map((response) => response.data));
  }
  logout() {
    return this.http.post(AUTH_ROUTES.logout, null, { withCredentials: true }).pipe(map(() => void 0));
  }
  static \u0275fac = /* @__PURE__ */ (() => {
    let \u0275HttpAuthGateway_BaseFactory;
    return function HttpAuthGateway_Factory(__ngFactoryType__) {
      return (\u0275HttpAuthGateway_BaseFactory || (\u0275HttpAuthGateway_BaseFactory = \u0275\u0275getInheritedFactory(_HttpAuthGateway)))(__ngFactoryType__ || _HttpAuthGateway);
    };
  })();
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _HttpAuthGateway, factory: _HttpAuthGateway.\u0275fac });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(HttpAuthGateway, [{
    type: Injectable
  }], null, null);
})();

// src/app/core/auth/auth.service.ts
var AuthService = class _AuthService {
  gateway = inject(AuthGateway);
  state = signal("unknown", ...ngDevMode ? [{ debugName: "state" }] : (
    /* istanbul ignore next */
    []
  ));
  currentUser = signal(null, ...ngDevMode ? [{ debugName: "currentUser" }] : (
    /* istanbul ignore next */
    []
  ));
  busy = signal(false, ...ngDevMode ? [{ debugName: "busy" }] : (
    /* istanbul ignore next */
    []
  ));
  /** De-duplicates concurrent `restore()` calls from several guards at once. */
  restoring = null;
  /** `unknown` until `restore()` has answered — guards must wait for it. */
  status = this.state.asReadonly();
  user = this.currentUser.asReadonly();
  /** `true` while a login, logout or restore is in flight. */
  pending = this.busy.asReadonly();
  isAuthenticated = computed(() => this.state() === "authenticated", ...ngDevMode ? [{ debugName: "isAuthenticated" }] : (
    /* istanbul ignore next */
    []
  ));
  permissions = computed(() => this.currentUser()?.permissions ?? [], ...ngDevMode ? [{ debugName: "permissions" }] : (
    /* istanbul ignore next */
    []
  ));
  /** Initials for the account menu avatar, e.g. "Miguel Faria" → "MF". */
  initials = computed(() => {
    const name = this.currentUser()?.name.trim();
    if (!name) {
      return "";
    }
    const parts = name.split(/\s+/);
    const first = parts.at(0)?.[0] ?? "";
    const last = parts.length > 1 ? parts.at(-1)?.[0] ?? "" : "";
    return (first + last).toUpperCase();
  }, ...ngDevMode ? [{ debugName: "initials" }] : (
    /* istanbul ignore next */
    []
  ));
  /**
   * Asks the backend whether the cookie names a valid session.
   *
   * Called by the auth guard rather than in a constructor: a visitor who never
   * opens the private area should not cause a request. Concurrent callers share
   * one in-flight promise, so several guards resolving at once make one call.
   */
  restore() {
    if (this.state() !== "unknown") {
      return Promise.resolve();
    }
    this.restoring ??= this.performRestore().finally(() => {
      this.restoring = null;
    });
    return this.restoring;
  }
  async login(credentials) {
    this.busy.set(true);
    try {
      const user = await firstValueFrom(this.gateway.login(credentials));
      this.currentUser.set(user);
      this.state.set("authenticated");
    } finally {
      this.busy.set(false);
    }
  }
  /**
   * Ends the session.
   *
   * Local state is cleared even when the request fails: the user asked to be
   * signed out, and leaving them apparently signed in on a shared machine
   * because the network hiccuped is the worse outcome.
   */
  async logout() {
    this.busy.set(true);
    try {
      await firstValueFrom(this.gateway.logout());
    } catch {
    } finally {
      this.clear();
      this.busy.set(false);
    }
  }
  /** Drops the session without calling the backend. Used by the 401 handler. */
  clear() {
    this.currentUser.set(null);
    this.state.set("anonymous");
  }
  hasPermission(permission) {
    const granted = this.permissions();
    return granted.includes(permission) || permission.endsWith(".read") && granted.includes("officegest.read");
  }
  hasAnyPermission(permissions) {
    return permissions.length === 0 || permissions.some((permission) => this.hasPermission(permission));
  }
  async performRestore() {
    this.busy.set(true);
    try {
      const user = await firstValueFrom(this.gateway.session());
      if (user) {
        this.currentUser.set(user);
        this.state.set("authenticated");
        return;
      }
      this.clear();
    } catch {
      this.clear();
    } finally {
      this.busy.set(false);
    }
  }
  static \u0275fac = function AuthService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _AuthService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _AuthService, factory: _AuthService.\u0275fac, providedIn: "root" });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(AuthService, [{
    type: Injectable,
    args: [{ providedIn: "root" }]
  }], null, null);
})();

export {
  EXPECTS_UNAUTHORIZED,
  apiInterceptor,
  AUTH_ERROR_CODES,
  AuthGateway,
  HttpAuthGateway,
  AuthService
};
//# sourceMappingURL=chunk-DWZ5PAW5.js.map
