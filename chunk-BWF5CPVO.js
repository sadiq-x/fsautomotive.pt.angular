import {
  Injectable,
  setClassMetadata,
  signal,
  ɵɵdefineInjectable
} from "./chunk-RUFDRP5X.js";

// src/app/core/services/notification.service.ts
var AUTO_DISMISS_MS = 5e3;
var MAX_VISIBLE = 4;
var NotificationService = class _NotificationService {
  items = signal([], ...ngDevMode ? [{ debugName: "items" }] : (
    /* istanbul ignore next */
    []
  ));
  nextId = 1;
  notifications = this.items.asReadonly();
  success(message, detail) {
    this.push("success", message, detail);
  }
  error(message, detail) {
    this.push("error", message, detail);
  }
  warning(message, detail) {
    this.push("warning", message, detail);
  }
  info(message, detail) {
    this.push("info", message, detail);
  }
  dismiss(id) {
    this.items.update((current) => current.filter((item) => item.id !== id));
  }
  clear() {
    this.items.set([]);
  }
  push(tone, message, detail) {
    const id = this.nextId++;
    const notification = detail ? { id, tone, message, detail } : { id, tone, message };
    this.items.update((current) => [...current, notification].slice(-MAX_VISIBLE));
    if (tone !== "error") {
      const timer = setTimeout(() => this.dismiss(id), AUTO_DISMISS_MS);
      timer.unref?.();
    }
  }
  static \u0275fac = function NotificationService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NotificationService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _NotificationService, factory: _NotificationService.\u0275fac, providedIn: "root" });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NotificationService, [{
    type: Injectable,
    args: [{ providedIn: "root" }]
  }], null, null);
})();

export {
  NotificationService
};
//# sourceMappingURL=chunk-BWF5CPVO.js.map
