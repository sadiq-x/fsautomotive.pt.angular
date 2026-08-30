import "./chunk-OFYC5P2J.js";
import {
  DefaultValueAccessor,
  FormsModule,
  MaxLengthValidator,
  NgControlStatus,
  NgControlStatusGroup,
  NgForm,
  NgModel,
  RequiredValidator,
  ɵNgNoValidate
} from "./chunk-VLMDAFYN.js";
import {
  UiButton
} from "./chunk-NGHYTC22.js";
import "./chunk-PWBEWDIV.js";
import {
  NotificationService
} from "./chunk-BWF5CPVO.js";
import "./chunk-UVBD33FH.js";
import {
  OfficeGestService
} from "./chunk-QHRJKSEM.js";
import "./chunk-TZW5CK7K.js";
import {
  ApiError,
  toValidationIssues
} from "./chunk-4AV4IBWC.js";
import {
  PRIVATE_ROUTES
} from "./chunk-GUS6C3RU.js";
import {
  Icon
} from "./chunk-57VTFLIE.js";
import {
  ChangeDetectionStrategy,
  Component,
  Router,
  RouterLink,
  __spreadValues,
  computed,
  firstValueFrom,
  inject,
  setClassMetadata,
  signal,
  ɵsetClassDebugInfo,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵconditional,
  ɵɵconditionalCreate,
  ɵɵdefineComponent,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵlistener,
  ɵɵproperty,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1
} from "./chunk-RUFDRP5X.js";

// src/app/features/private/officegest/pages/appointments/appointment-form.ts
function AppointmentForm_Conditional_17_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 12);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx);
  }
}
function AppointmentForm_Conditional_24_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 15);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx);
  }
}
function AppointmentForm_Conditional_29_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 18);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx);
  }
}
function AppointmentForm_Conditional_34_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 21);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx);
  }
}
function AppointmentForm_Conditional_43_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 26);
    \u0275\u0275element(1, "app-icon", 30);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275property("size", 16);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx, " ");
  }
}
var AppointmentForm = class _AppointmentForm {
  officegest = inject(OfficeGestService);
  notifications = inject(NotificationService);
  router = inject(Router);
  routes = PRIVATE_ROUTES;
  title = signal("", ...ngDevMode ? [{ debugName: "title" }] : (
    /* istanbul ignore next */
    []
  ));
  startsAt = signal("", ...ngDevMode ? [{ debugName: "startsAt" }] : (
    /* istanbul ignore next */
    []
  ));
  endsAt = signal("", ...ngDevMode ? [{ debugName: "endsAt" }] : (
    /* istanbul ignore next */
    []
  ));
  plate = signal("", ...ngDevMode ? [{ debugName: "plate" }] : (
    /* istanbul ignore next */
    []
  ));
  customerId = signal("", ...ngDevMode ? [{ debugName: "customerId" }] : (
    /* istanbul ignore next */
    []
  ));
  notes = signal("", ...ngDevMode ? [{ debugName: "notes" }] : (
    /* istanbul ignore next */
    []
  ));
  submitting = signal(false, ...ngDevMode ? [{ debugName: "submitting" }] : (
    /* istanbul ignore next */
    []
  ));
  /** Field name → message, filled locally and by the backend's 422. */
  fieldErrors = signal({}, ...ngDevMode ? [{ debugName: "fieldErrors" }] : (
    /* istanbul ignore next */
    []
  ));
  formError = signal(null, ...ngDevMode ? [{ debugName: "formError" }] : (
    /* istanbul ignore next */
    []
  ));
  /** The earliest value the datetime input will accept: now, to the minute. */
  minDateTime = computed(() => toLocalInput(/* @__PURE__ */ new Date()), ...ngDevMode ? [{ debugName: "minDateTime" }] : (
    /* istanbul ignore next */
    []
  ));
  canSubmit = computed(() => !this.submitting() && this.title().trim().length >= 3 && this.startsAt() !== "", ...ngDevMode ? [{ debugName: "canSubmit" }] : (
    /* istanbul ignore next */
    []
  ));
  async submit() {
    this.formError.set(null);
    const errors = this.validate();
    if (Object.keys(errors).length > 0) {
      this.fieldErrors.set(errors);
      return;
    }
    this.fieldErrors.set({});
    this.submitting.set(true);
    try {
      const created = await firstValueFrom(this.officegest.createAppointment(this.toRequest()));
      this.notifications.success("Marca\xE7\xE3o criada com sucesso.");
      await this.router.navigateByUrl(PRIVATE_ROUTES.appointment(created.id));
    } catch (error) {
      this.handleFailure(error);
    } finally {
      this.submitting.set(false);
    }
  }
  /** Mirrors the backend's rules, so the common mistakes never leave the page. */
  validate() {
    const errors = {};
    const title = this.title().trim();
    if (title.length < 3 || title.length > 160) {
      errors["title"] = "Indique um assunto com 3 a 160 caracteres.";
    }
    const start = Date.parse(this.startsAt());
    if (Number.isNaN(start)) {
      errors["startsAt"] = "Indique a data e hora de in\xEDcio.";
    } else if (start < Date.now() - 6e4) {
      errors["startsAt"] = "A marca\xE7\xE3o tem de ser no futuro.";
    }
    if (this.endsAt()) {
      const end = Date.parse(this.endsAt());
      if (Number.isNaN(end)) {
        errors["endsAt"] = "Data de fim inv\xE1lida.";
      } else if (!Number.isNaN(start) && end <= start) {
        errors["endsAt"] = "O fim tem de ser depois do in\xEDcio.";
      } else if (!Number.isNaN(start) && end - start > 12 * 60 * 60 * 1e3) {
        errors["endsAt"] = "A marca\xE7\xE3o n\xE3o pode durar mais de 12 horas.";
      }
    }
    const plate = this.normalisedPlate();
    if (plate && !/^[A-Z0-9]{6}$/.test(plate)) {
      errors["plate"] = "Matr\xEDcula inv\xE1lida. Use o formato AA-00-BB.";
    }
    return errors;
  }
  toRequest() {
    const plate = this.normalisedPlate();
    const customerId = this.customerId().trim();
    const notes = this.notes().trim();
    const endsAt = this.endsAt();
    return __spreadValues(__spreadValues(__spreadValues(__spreadValues({
      title: this.title().trim(),
      startsAt: new Date(this.startsAt()).toISOString()
    }, endsAt ? { endsAt: new Date(endsAt).toISOString() } : {}), plate ? { plate } : {}), customerId ? { customerId } : {}), notes ? { notes } : {});
  }
  normalisedPlate() {
    return this.plate().toUpperCase().replace(/[\s._-]/g, "");
  }
  /** Maps a backend rejection back onto the fields where possible. */
  handleFailure(error) {
    if (!(error instanceof ApiError)) {
      this.formError.set("N\xE3o foi poss\xEDvel criar a marca\xE7\xE3o.");
      return;
    }
    const issues = toValidationIssues(error.details);
    if (issues.length > 0) {
      this.fieldErrors.set(Object.fromEntries(issues.map((issue) => [issue.field, issue.message])));
      this.formError.set("Corrija os campos assinalados.");
      return;
    }
    if (!error.retryable) {
      this.formError.set(error.message);
    }
  }
  static \u0275fac = function AppointmentForm_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _AppointmentForm)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _AppointmentForm, selectors: [["app-appointment-form"]], hostAttrs: [1, "block"], decls: 49, vars: 26, consts: [[1, "inline-flex", "items-center", "gap-1.5", "rounded-sm", "text-meta", "font-semibold", "text-ink-500", "transition-colors", "hover:text-ink-900", "focus-visible:outline-2", "focus-visible:outline-offset-2", "focus-visible:outline-brand-600", 3, "routerLink"], ["name", "chevron-left", 3, "size"], [1, "mt-4"], [1, "text-h2", "text-ink-950"], [1, "mt-1", "text-body", "text-ink-500"], ["novalidate", "", 1, "mt-6", "max-w-2xl", 3, "ngSubmit"], [1, "rounded-xl", "bg-white", "p-6", "shadow-card", "ring-1", "ring-ink-950/6"], [1, "grid", "gap-5", "sm:grid-cols-2"], [1, "sm:col-span-2"], ["for", "title", 1, "block", "text-meta", "font-semibold", "text-ink-700"], ["aria-hidden", "true", 1, "text-brand-600"], ["id", "title", "name", "title", "type", "text", "required", "", "maxlength", "160", "placeholder", "Revis\xE3o dos 60.000 km", 1, "mt-1.5", "w-full", "rounded-lg", "border-0", "bg-bone-50", "px-3.5", "py-2.5", "text-body", "text-ink-900", "ring-1", "ring-ink-950/10", "ring-inset", "focus:ring-2", "focus:ring-brand-600", "focus:outline-none", 3, "ngModelChange", "ngModel"], ["id", "erro-title", 1, "mt-1.5", "text-meta", "text-brand-700"], ["for", "startsAt", 1, "block", "text-meta", "font-semibold", "text-ink-700"], ["id", "startsAt", "name", "startsAt", "type", "datetime-local", "required", "", 1, "mt-1.5", "w-full", "rounded-lg", "border-0", "bg-bone-50", "px-3.5", "py-2.5", "text-body", "text-ink-900", "ring-1", "ring-ink-950/10", "ring-inset", "focus:ring-2", "focus:ring-brand-600", "focus:outline-none", 3, "ngModelChange", "min", "ngModel"], ["id", "erro-startsAt", 1, "mt-1.5", "text-meta", "text-brand-700"], ["for", "endsAt", 1, "block", "text-meta", "font-semibold", "text-ink-700"], ["id", "endsAt", "name", "endsAt", "type", "datetime-local", 1, "mt-1.5", "w-full", "rounded-lg", "border-0", "bg-bone-50", "px-3.5", "py-2.5", "text-body", "text-ink-900", "ring-1", "ring-ink-950/10", "ring-inset", "focus:ring-2", "focus:ring-brand-600", "focus:outline-none", 3, "ngModelChange", "min", "ngModel"], ["id", "erro-endsAt", 1, "mt-1.5", "text-meta", "text-brand-700"], ["for", "plate", 1, "block", "text-meta", "font-semibold", "text-ink-700"], ["id", "plate", "name", "plate", "type", "text", "maxlength", "16", "placeholder", "AA-00-BB", 1, "mt-1.5", "w-full", "rounded-lg", "border-0", "bg-bone-50", "px-3.5", "py-2.5", "text-body", "text-ink-900", "uppercase", "ring-1", "ring-ink-950/10", "ring-inset", "placeholder:normal-case", "focus:ring-2", "focus:ring-brand-600", "focus:outline-none", 3, "ngModelChange", "ngModel"], ["id", "erro-plate", 1, "mt-1.5", "text-meta", "text-brand-700"], ["for", "customerId", 1, "block", "text-meta", "font-semibold", "text-ink-700"], ["id", "customerId", "name", "customerId", "type", "text", "maxlength", "64", 1, "mt-1.5", "w-full", "rounded-lg", "border-0", "bg-bone-50", "px-3.5", "py-2.5", "text-body", "text-ink-900", "ring-1", "ring-ink-950/10", "ring-inset", "focus:ring-2", "focus:ring-brand-600", "focus:outline-none", 3, "ngModelChange", "ngModel"], ["for", "notes", 1, "block", "text-meta", "font-semibold", "text-ink-700"], ["id", "notes", "name", "notes", "rows", "4", "maxlength", "2000", 1, "mt-1.5", "w-full", "rounded-lg", "border-0", "bg-bone-50", "px-3.5", "py-2.5", "text-body", "text-ink-900", "ring-1", "ring-ink-950/10", "ring-inset", "focus:ring-2", "focus:ring-brand-600", "focus:outline-none", 3, "ngModelChange", "ngModel"], ["role", "alert", 1, "mt-5", "flex", "items-start", "gap-2", "rounded-lg", "bg-brand-50", "px-4", "py-3", "text-meta", "text-brand-800", "ring-1", "ring-brand-600/15"], [1, "mt-5", "flex", "flex-wrap", "items-center", "gap-3"], ["type", "submit", "variant", "primary", 3, "disabled"], ["variant", "secondary", 3, "routerLink"], ["name", "alert-triangle", 1, "mt-0.5", "shrink-0", 3, "size"]], template: function AppointmentForm_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "a", 0);
      \u0275\u0275element(1, "app-icon", 1);
      \u0275\u0275text(2, " Marca\xE7\xF5es\n");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(3, "header", 2)(4, "h1", 3);
      \u0275\u0275text(5, "Nova marca\xE7\xE3o");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(6, "p", 4);
      \u0275\u0275text(7, "A marca\xE7\xE3o \xE9 criada diretamente no OfficeGest.");
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(8, "form", 5);
      \u0275\u0275listener("ngSubmit", function AppointmentForm_Template_form_ngSubmit_8_listener() {
        return ctx.submit();
      });
      \u0275\u0275elementStart(9, "div", 6)(10, "div", 7)(11, "div", 8)(12, "label", 9);
      \u0275\u0275text(13, " Assunto ");
      \u0275\u0275elementStart(14, "span", 10);
      \u0275\u0275text(15, "*");
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(16, "input", 11);
      \u0275\u0275listener("ngModelChange", function AppointmentForm_Template_input_ngModelChange_16_listener($event) {
        return ctx.title.set($event);
      });
      \u0275\u0275elementEnd();
      \u0275\u0275conditionalCreate(17, AppointmentForm_Conditional_17_Template, 2, 1, "p", 12);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(18, "div")(19, "label", 13);
      \u0275\u0275text(20, " In\xEDcio ");
      \u0275\u0275elementStart(21, "span", 10);
      \u0275\u0275text(22, "*");
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(23, "input", 14);
      \u0275\u0275listener("ngModelChange", function AppointmentForm_Template_input_ngModelChange_23_listener($event) {
        return ctx.startsAt.set($event);
      });
      \u0275\u0275elementEnd();
      \u0275\u0275conditionalCreate(24, AppointmentForm_Conditional_24_Template, 2, 1, "p", 15);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(25, "div")(26, "label", 16);
      \u0275\u0275text(27, "Fim");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(28, "input", 17);
      \u0275\u0275listener("ngModelChange", function AppointmentForm_Template_input_ngModelChange_28_listener($event) {
        return ctx.endsAt.set($event);
      });
      \u0275\u0275elementEnd();
      \u0275\u0275conditionalCreate(29, AppointmentForm_Conditional_29_Template, 2, 1, "p", 18);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(30, "div")(31, "label", 19);
      \u0275\u0275text(32, "Matr\xEDcula");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(33, "input", 20);
      \u0275\u0275listener("ngModelChange", function AppointmentForm_Template_input_ngModelChange_33_listener($event) {
        return ctx.plate.set($event);
      });
      \u0275\u0275elementEnd();
      \u0275\u0275conditionalCreate(34, AppointmentForm_Conditional_34_Template, 2, 1, "p", 21);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(35, "div")(36, "label", 22);
      \u0275\u0275text(37, " C\xF3digo do cliente ");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(38, "input", 23);
      \u0275\u0275listener("ngModelChange", function AppointmentForm_Template_input_ngModelChange_38_listener($event) {
        return ctx.customerId.set($event);
      });
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(39, "div", 8)(40, "label", 24);
      \u0275\u0275text(41, "Notas");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(42, "textarea", 25);
      \u0275\u0275listener("ngModelChange", function AppointmentForm_Template_textarea_ngModelChange_42_listener($event) {
        return ctx.notes.set($event);
      });
      \u0275\u0275elementEnd()()();
      \u0275\u0275conditionalCreate(43, AppointmentForm_Conditional_43_Template, 3, 2, "p", 26);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(44, "div", 27)(45, "app-button", 28);
      \u0275\u0275text(46);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(47, "app-button", 29);
      \u0275\u0275text(48, "Cancelar");
      \u0275\u0275elementEnd()()();
    }
    if (rf & 2) {
      let tmp_5_0;
      let tmp_10_0;
      let tmp_15_0;
      let tmp_19_0;
      let tmp_22_0;
      \u0275\u0275property("routerLink", ctx.routes.appointments);
      \u0275\u0275advance();
      \u0275\u0275property("size", 16);
      \u0275\u0275advance(15);
      \u0275\u0275property("ngModel", ctx.title());
      \u0275\u0275attribute("aria-invalid", ctx.fieldErrors()["title"] ? "true" : null)("aria-describedby", ctx.fieldErrors()["title"] ? "erro-title" : null);
      \u0275\u0275advance();
      \u0275\u0275conditional((tmp_5_0 = ctx.fieldErrors()["title"]) ? 17 : -1, tmp_5_0);
      \u0275\u0275advance(6);
      \u0275\u0275property("min", ctx.minDateTime())("ngModel", ctx.startsAt());
      \u0275\u0275attribute("aria-invalid", ctx.fieldErrors()["startsAt"] ? "true" : null)("aria-describedby", ctx.fieldErrors()["startsAt"] ? "erro-startsAt" : null);
      \u0275\u0275advance();
      \u0275\u0275conditional((tmp_10_0 = ctx.fieldErrors()["startsAt"]) ? 24 : -1, tmp_10_0);
      \u0275\u0275advance(4);
      \u0275\u0275property("min", ctx.startsAt() || ctx.minDateTime())("ngModel", ctx.endsAt());
      \u0275\u0275attribute("aria-invalid", ctx.fieldErrors()["endsAt"] ? "true" : null)("aria-describedby", ctx.fieldErrors()["endsAt"] ? "erro-endsAt" : null);
      \u0275\u0275advance();
      \u0275\u0275conditional((tmp_15_0 = ctx.fieldErrors()["endsAt"]) ? 29 : -1, tmp_15_0);
      \u0275\u0275advance(4);
      \u0275\u0275property("ngModel", ctx.plate());
      \u0275\u0275attribute("aria-invalid", ctx.fieldErrors()["plate"] ? "true" : null)("aria-describedby", ctx.fieldErrors()["plate"] ? "erro-plate" : null);
      \u0275\u0275advance();
      \u0275\u0275conditional((tmp_19_0 = ctx.fieldErrors()["plate"]) ? 34 : -1, tmp_19_0);
      \u0275\u0275advance(4);
      \u0275\u0275property("ngModel", ctx.customerId());
      \u0275\u0275advance(4);
      \u0275\u0275property("ngModel", ctx.notes());
      \u0275\u0275advance();
      \u0275\u0275conditional((tmp_22_0 = ctx.formError()) ? 43 : -1, tmp_22_0);
      \u0275\u0275advance(2);
      \u0275\u0275property("disabled", !ctx.canSubmit());
      \u0275\u0275advance();
      \u0275\u0275textInterpolate1(" ", ctx.submitting() ? "A criar\u2026" : "Criar marca\xE7\xE3o", " ");
      \u0275\u0275advance();
      \u0275\u0275property("routerLink", ctx.routes.appointments);
    }
  }, dependencies: [FormsModule, \u0275NgNoValidate, DefaultValueAccessor, NgControlStatus, NgControlStatusGroup, RequiredValidator, MaxLengthValidator, NgModel, NgForm, Icon, RouterLink, UiButton], encapsulation: 2, changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(AppointmentForm, [{
    type: Component,
    args: [{ selector: "app-appointment-form", changeDetection: ChangeDetectionStrategy.OnPush, imports: [FormsModule, Icon, RouterLink, UiButton], host: { class: "block" }, template: `<a
  class="inline-flex items-center gap-1.5 rounded-sm text-meta font-semibold text-ink-500 transition-colors hover:text-ink-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
  [routerLink]="routes.appointments"
>
  <app-icon name="chevron-left" [size]="16" />
  Marca\xE7\xF5es
</a>

<header class="mt-4">
  <h1 class="text-h2 text-ink-950">Nova marca\xE7\xE3o</h1>
  <p class="mt-1 text-body text-ink-500">A marca\xE7\xE3o \xE9 criada diretamente no OfficeGest.</p>
</header>

<form class="mt-6 max-w-2xl" (ngSubmit)="submit()" novalidate>
  <div class="rounded-xl bg-white p-6 shadow-card ring-1 ring-ink-950/6">
    <div class="grid gap-5 sm:grid-cols-2">
      <div class="sm:col-span-2">
        <label class="block text-meta font-semibold text-ink-700" for="title">
          Assunto <span class="text-brand-600" aria-hidden="true">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxlength="160"
          class="mt-1.5 w-full rounded-lg border-0 bg-bone-50 px-3.5 py-2.5 text-body text-ink-900 ring-1 ring-ink-950/10 ring-inset focus:ring-2 focus:ring-brand-600 focus:outline-none"
          placeholder="Revis\xE3o dos 60.000 km"
          [ngModel]="title()"
          (ngModelChange)="title.set($event)"
          [attr.aria-invalid]="fieldErrors()['title'] ? 'true' : null"
          [attr.aria-describedby]="fieldErrors()['title'] ? 'erro-title' : null"
        />
        @if (fieldErrors()['title']; as message) {
          <p id="erro-title" class="mt-1.5 text-meta text-brand-700">{{ message }}</p>
        }
      </div>

      <div>
        <label class="block text-meta font-semibold text-ink-700" for="startsAt">
          In\xEDcio <span class="text-brand-600" aria-hidden="true">*</span>
        </label>
        <input
          id="startsAt"
          name="startsAt"
          type="datetime-local"
          required
          [min]="minDateTime()"
          class="mt-1.5 w-full rounded-lg border-0 bg-bone-50 px-3.5 py-2.5 text-body text-ink-900 ring-1 ring-ink-950/10 ring-inset focus:ring-2 focus:ring-brand-600 focus:outline-none"
          [ngModel]="startsAt()"
          (ngModelChange)="startsAt.set($event)"
          [attr.aria-invalid]="fieldErrors()['startsAt'] ? 'true' : null"
          [attr.aria-describedby]="fieldErrors()['startsAt'] ? 'erro-startsAt' : null"
        />
        @if (fieldErrors()['startsAt']; as message) {
          <p id="erro-startsAt" class="mt-1.5 text-meta text-brand-700">{{ message }}</p>
        }
      </div>

      <div>
        <label class="block text-meta font-semibold text-ink-700" for="endsAt">Fim</label>
        <input
          id="endsAt"
          name="endsAt"
          type="datetime-local"
          [min]="startsAt() || minDateTime()"
          class="mt-1.5 w-full rounded-lg border-0 bg-bone-50 px-3.5 py-2.5 text-body text-ink-900 ring-1 ring-ink-950/10 ring-inset focus:ring-2 focus:ring-brand-600 focus:outline-none"
          [ngModel]="endsAt()"
          (ngModelChange)="endsAt.set($event)"
          [attr.aria-invalid]="fieldErrors()['endsAt'] ? 'true' : null"
          [attr.aria-describedby]="fieldErrors()['endsAt'] ? 'erro-endsAt' : null"
        />
        @if (fieldErrors()['endsAt']; as message) {
          <p id="erro-endsAt" class="mt-1.5 text-meta text-brand-700">{{ message }}</p>
        }
      </div>

      <div>
        <label class="block text-meta font-semibold text-ink-700" for="plate">Matr\xEDcula</label>
        <input
          id="plate"
          name="plate"
          type="text"
          maxlength="16"
          class="mt-1.5 w-full rounded-lg border-0 bg-bone-50 px-3.5 py-2.5 text-body text-ink-900 uppercase ring-1 ring-ink-950/10 ring-inset placeholder:normal-case focus:ring-2 focus:ring-brand-600 focus:outline-none"
          placeholder="AA-00-BB"
          [ngModel]="plate()"
          (ngModelChange)="plate.set($event)"
          [attr.aria-invalid]="fieldErrors()['plate'] ? 'true' : null"
          [attr.aria-describedby]="fieldErrors()['plate'] ? 'erro-plate' : null"
        />
        @if (fieldErrors()['plate']; as message) {
          <p id="erro-plate" class="mt-1.5 text-meta text-brand-700">{{ message }}</p>
        }
      </div>

      <div>
        <label class="block text-meta font-semibold text-ink-700" for="customerId"> C\xF3digo do cliente </label>
        <input
          id="customerId"
          name="customerId"
          type="text"
          maxlength="64"
          class="mt-1.5 w-full rounded-lg border-0 bg-bone-50 px-3.5 py-2.5 text-body text-ink-900 ring-1 ring-ink-950/10 ring-inset focus:ring-2 focus:ring-brand-600 focus:outline-none"
          [ngModel]="customerId()"
          (ngModelChange)="customerId.set($event)"
        />
      </div>

      <div class="sm:col-span-2">
        <label class="block text-meta font-semibold text-ink-700" for="notes">Notas</label>
        <textarea
          id="notes"
          name="notes"
          rows="4"
          maxlength="2000"
          class="mt-1.5 w-full rounded-lg border-0 bg-bone-50 px-3.5 py-2.5 text-body text-ink-900 ring-1 ring-ink-950/10 ring-inset focus:ring-2 focus:ring-brand-600 focus:outline-none"
          [ngModel]="notes()"
          (ngModelChange)="notes.set($event)"
        ></textarea>
      </div>
    </div>

    @if (formError(); as message) {
      <p
        role="alert"
        class="mt-5 flex items-start gap-2 rounded-lg bg-brand-50 px-4 py-3 text-meta text-brand-800 ring-1 ring-brand-600/15"
      >
        <app-icon name="alert-triangle" [size]="16" class="mt-0.5 shrink-0" />
        {{ message }}
      </p>
    }
  </div>

  <div class="mt-5 flex flex-wrap items-center gap-3">
    <app-button type="submit" variant="primary" [disabled]="!canSubmit()">
      {{ submitting() ? 'A criar\u2026' : 'Criar marca\xE7\xE3o' }}
    </app-button>
    <app-button variant="secondary" [routerLink]="routes.appointments">Cancelar</app-button>
  </div>
</form>
` }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(AppointmentForm, { className: "AppointmentForm", filePath: "src/app/features/private/officegest/pages/appointments/appointment-form.ts", lineNumber: 43 });
})();
function toLocalInput(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
export {
  AppointmentForm
};
//# sourceMappingURL=chunk-YFOUE7CI.js.map
