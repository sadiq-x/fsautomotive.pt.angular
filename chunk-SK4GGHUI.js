import {
  ResourcePage,
  createResourceList
} from "./chunk-FAVO3ITR.js";
import {
  formatDateTime,
  formatPlate,
  orNull
} from "./chunk-2LZNZMJ7.js";
import {
  DefaultValueAccessor,
  FormsModule,
  NgControlStatus,
  NgModel
} from "./chunk-VLMDAFYN.js";
import {
  UiButton
} from "./chunk-NGHYTC22.js";
import {
  OfficeGestService
} from "./chunk-QHRJKSEM.js";
import "./chunk-TZW5CK7K.js";
import "./chunk-ZQIDUDRV.js";
import {
  AuthService
} from "./chunk-DWZ5PAW5.js";
import "./chunk-4AV4IBWC.js";
import {
  PRIVATE_ROUTES
} from "./chunk-GUS6C3RU.js";
import "./chunk-57VTFLIE.js";
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  setClassMetadata,
  ɵsetClassDebugInfo,
  ɵɵadvance,
  ɵɵconditional,
  ɵɵconditionalCreate,
  ɵɵdefineComponent,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵlistener,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵtext
} from "./chunk-RUFDRP5X.js";

// src/app/features/private/officegest/pages/appointments/appointments.ts
function Appointments_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "app-button", 1);
    \u0275\u0275text(1, " Nova marca\xE7\xE3o ");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275property("routerLink", ctx_r0.routes.newAppointment);
  }
}
var Appointments = class _Appointments {
  officegest = inject(OfficeGestService);
  auth = inject(AuthService);
  routes = PRIVATE_ROUTES;
  store = createResourceList({
    fetch: (query) => this.officegest.listAppointments(query),
    initialFilters: {}
  });
  rowKey = (appointment) => appointment.id;
  rowLink = (appointment) => PRIVATE_ROUTES.appointment(appointment.id);
  rowLabel = (appointment) => `Ver marca\xE7\xE3o ${appointment.title ?? appointment.id}`;
  canCreate() {
    return this.auth.hasPermission("officegest.appointments.write");
  }
  columns = [
    {
      key: "title",
      header: "Assunto",
      value: (appointment) => orNull(appointment.title),
      sortValue: (appointment) => appointment.title ?? null,
      priority: "primary"
    },
    {
      key: "startsAt",
      header: "In\xEDcio",
      value: (appointment) => formatDateTime(appointment.startsAt),
      sortValue: (appointment) => appointment.startsAt ?? null,
      priority: "secondary"
    },
    {
      key: "endsAt",
      header: "Fim",
      value: (appointment) => formatDateTime(appointment.endsAt),
      sortValue: (appointment) => appointment.endsAt ?? null
    },
    {
      key: "plate",
      header: "Matr\xEDcula",
      value: (appointment) => formatPlate(appointment.plate),
      sortValue: (appointment) => appointment.plate ?? null
    },
    {
      key: "status",
      header: "Estado",
      value: (appointment) => orNull(appointment.status),
      badge: true,
      align: "end"
    }
  ];
  /** ISO instant → the `yyyy-MM-dd` an `<input type="date">` expects. */
  dateValue(iso) {
    return iso ? iso.slice(0, 10) ?? "" : "";
  }
  /**
   * A date input gives a day; the backend wants an instant. The day is widened
   * to its full local span so "de 1 até 1 de setembro" includes that whole day
   * rather than only midnight.
   */
  toStartOfDay(value) {
    if (!value) {
      return void 0;
    }
    const date = /* @__PURE__ */ new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? void 0 : date.toISOString();
  }
  toEndOfDay(value) {
    if (!value) {
      return void 0;
    }
    const date = /* @__PURE__ */ new Date(`${value}T23:59:59.999`);
    return Number.isNaN(date.getTime()) ? void 0 : date.toISOString();
  }
  static \u0275fac = function Appointments_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _Appointments)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _Appointments, selectors: [["app-appointments"]], decls: 11, vars: 8, consts: [["title", "Marca\xE7\xF5es", "subtitle", "Agenda da oficina no OfficeGest.", "caption", "Lista de marca\xE7\xF5es", 3, "store", "columns", "rowKey", "rowLink", "rowLabel"], ["slot", "actions", "icon", "plus", "iconPosition", "left", 3, "routerLink"], ["slot", "filters", 1, "flex", "flex-wrap", "items-center", "gap-3"], [1, "flex", "items-center", "gap-2", "text-meta", "text-ink-500"], ["type", "date", 1, "rounded-full", "border-0", "bg-white", "px-4", "py-2", "text-body", "text-ink-900", "shadow-btn", "ring-1", "ring-ink-950/8", "ring-inset", "focus:ring-2", "focus:ring-brand-600", "focus:outline-none", 3, "ngModelChange", "ngModel"]], template: function Appointments_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "app-resource-page", 0);
      \u0275\u0275conditionalCreate(1, Appointments_Conditional_1_Template, 2, 1, "app-button", 1);
      \u0275\u0275elementStart(2, "div", 2)(3, "label", 3)(4, "span");
      \u0275\u0275text(5, "De");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(6, "input", 4);
      \u0275\u0275listener("ngModelChange", function Appointments_Template_input_ngModelChange_6_listener($event) {
        return ctx.store.setFilters({ from: ctx.toStartOfDay($event) });
      });
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(7, "label", 3)(8, "span");
      \u0275\u0275text(9, "At\xE9");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(10, "input", 4);
      \u0275\u0275listener("ngModelChange", function Appointments_Template_input_ngModelChange_10_listener($event) {
        return ctx.store.setFilters({ to: ctx.toEndOfDay($event) });
      });
      \u0275\u0275elementEnd()()()();
    }
    if (rf & 2) {
      \u0275\u0275property("store", ctx.store)("columns", ctx.columns)("rowKey", ctx.rowKey)("rowLink", ctx.rowLink)("rowLabel", ctx.rowLabel);
      \u0275\u0275advance();
      \u0275\u0275conditional(ctx.canCreate() ? 1 : -1);
      \u0275\u0275advance(5);
      \u0275\u0275property("ngModel", ctx.dateValue(ctx.store.filters().from));
      \u0275\u0275advance(4);
      \u0275\u0275property("ngModel", ctx.dateValue(ctx.store.filters().to));
    }
  }, dependencies: [FormsModule, DefaultValueAccessor, NgControlStatus, NgModel, ResourcePage, UiButton], encapsulation: 2, changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(Appointments, [{
    type: Component,
    args: [{
      selector: "app-appointments",
      changeDetection: ChangeDetectionStrategy.OnPush,
      imports: [FormsModule, ResourcePage, UiButton],
      template: `
    <app-resource-page
      title="Marca\xE7\xF5es"
      subtitle="Agenda da oficina no OfficeGest."
      caption="Lista de marca\xE7\xF5es"
      [store]="store"
      [columns]="columns"
      [rowKey]="rowKey"
      [rowLink]="rowLink"
      [rowLabel]="rowLabel"
    >
      @if (canCreate()) {
        <app-button
          slot="actions"
          icon="plus"
          iconPosition="left"
          [routerLink]="routes.newAppointment"
        >
          Nova marca\xE7\xE3o
        </app-button>
      }

      <div slot="filters" class="flex flex-wrap items-center gap-3">
        <label class="flex items-center gap-2 text-meta text-ink-500">
          <span>De</span>
          <input
            type="date"
            class="rounded-full border-0 bg-white px-4 py-2 text-body text-ink-900 shadow-btn ring-1 ring-ink-950/8 ring-inset focus:ring-2 focus:ring-brand-600 focus:outline-none"
            [ngModel]="dateValue(store.filters().from)"
            (ngModelChange)="store.setFilters({ from: toStartOfDay($event) })"
          />
        </label>

        <label class="flex items-center gap-2 text-meta text-ink-500">
          <span>At\xE9</span>
          <input
            type="date"
            class="rounded-full border-0 bg-white px-4 py-2 text-body text-ink-900 shadow-btn ring-1 ring-ink-950/8 ring-inset focus:ring-2 focus:ring-brand-600 focus:outline-none"
            [ngModel]="dateValue(store.filters().to)"
            (ngModelChange)="store.setFilters({ to: toEndOfDay($event) })"
          />
        </label>
      </div>
    </app-resource-page>
  `
    }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(Appointments, { className: "Appointments", filePath: "src/app/features/private/officegest/pages/appointments/appointments.ts", lineNumber: 76 });
})();
export {
  Appointments
};
//# sourceMappingURL=chunk-SK4GGHUI.js.map
