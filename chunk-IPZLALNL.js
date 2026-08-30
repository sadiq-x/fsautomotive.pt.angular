import {
  DetailList,
  DetailPage,
  createResourceDetail
} from "./chunk-FHBZRBXP.js";
import {
  formatDateTime,
  formatPlate,
  orNull
} from "./chunk-2LZNZMJ7.js";
import "./chunk-NGHYTC22.js";
import {
  OfficeGestService
} from "./chunk-QHRJKSEM.js";
import "./chunk-TZW5CK7K.js";
import "./chunk-4AV4IBWC.js";
import {
  PRIVATE_ROUTES
} from "./chunk-GUS6C3RU.js";
import "./chunk-57VTFLIE.js";
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  computed,
  inject,
  input,
  setClassMetadata,
  ɵsetClassDebugInfo,
  ɵɵadvance,
  ɵɵdefineComponent,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵproperty,
  ɵɵtext
} from "./chunk-RUFDRP5X.js";

// src/app/features/private/officegest/pages/appointments/appointment-detail.ts
var AppointmentDetail = class _AppointmentDetail {
  /** Bound from the `:appointmentId` route parameter. */
  appointmentId = input.required(...ngDevMode ? [{ debugName: "appointmentId" }] : (
    /* istanbul ignore next */
    []
  ));
  officegest = inject(OfficeGestService);
  routes = PRIVATE_ROUTES;
  store = createResourceDetail({
    id: this.appointmentId,
    fetch: (id) => this.officegest.getAppointment(id)
  });
  subtitle = computed(() => formatDateTime(this.store.data()?.startsAt), ...ngDevMode ? [{ debugName: "subtitle" }] : (
    /* istanbul ignore next */
    []
  ));
  fields = computed(() => {
    const appointment = this.store.data();
    if (!appointment) {
      return [];
    }
    return [
      { label: "Assunto", value: orNull(appointment.title) },
      { label: "Estado", value: orNull(appointment.status), badge: true },
      { label: "In\xEDcio", value: formatDateTime(appointment.startsAt) },
      { label: "Fim", value: formatDateTime(appointment.endsAt) },
      { label: "Matr\xEDcula", value: formatPlate(appointment.plate) },
      { label: "Cliente", value: orNull(appointment.customerId) },
      { label: "Notas", value: orNull(appointment.notes), wide: true }
    ];
  }, ...ngDevMode ? [{ debugName: "fields" }] : (
    /* istanbul ignore next */
    []
  ));
  static \u0275fac = function AppointmentDetail_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _AppointmentDetail)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _AppointmentDetail, selectors: [["app-appointment-detail"]], inputs: { appointmentId: [1, "appointmentId"] }, decls: 5, vars: 6, consts: [["backLabel", "Marca\xE7\xF5es", "missingMessage", "Esta marca\xE7\xE3o n\xE3o existe no OfficeGest ou foi removida.", 3, "status", "title", "subtitle", "backLink", "errorMessage"], [1, "rounded-xl", "bg-white", "p-6", "shadow-card", "ring-1", "ring-ink-950/6"], [1, "text-h3", "text-ink-900"], [1, "mt-5", 3, "fields"]], template: function AppointmentDetail_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "app-detail-page", 0)(1, "section", 1)(2, "h2", 2);
      \u0275\u0275text(3, "Dados da marca\xE7\xE3o");
      \u0275\u0275elementEnd();
      \u0275\u0275element(4, "app-detail-list", 3);
      \u0275\u0275elementEnd()();
    }
    if (rf & 2) {
      let tmp_1_0;
      let tmp_4_0;
      \u0275\u0275property("status", ctx.store.status())("title", ((tmp_1_0 = ctx.store.data()) == null ? null : tmp_1_0.title) ?? "Marca\xE7\xE3o")("subtitle", ctx.subtitle())("backLink", ctx.routes.appointments)("errorMessage", ((tmp_4_0 = ctx.store.error()) == null ? null : tmp_4_0.message) ?? null);
      \u0275\u0275advance(4);
      \u0275\u0275property("fields", ctx.fields());
    }
  }, dependencies: [DetailList, DetailPage], encapsulation: 2, changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(AppointmentDetail, [{
    type: Component,
    args: [{
      selector: "app-appointment-detail",
      changeDetection: ChangeDetectionStrategy.OnPush,
      imports: [DetailList, DetailPage],
      template: `
    <app-detail-page
      [status]="store.status()"
      [title]="store.data()?.title ?? 'Marca\xE7\xE3o'"
      [subtitle]="subtitle()"
      [backLink]="routes.appointments"
      backLabel="Marca\xE7\xF5es"
      [errorMessage]="store.error()?.message ?? null"
      missingMessage="Esta marca\xE7\xE3o n\xE3o existe no OfficeGest ou foi removida."
    >
      <section class="rounded-xl bg-white p-6 shadow-card ring-1 ring-ink-950/6">
        <h2 class="text-h3 text-ink-900">Dados da marca\xE7\xE3o</h2>
        <app-detail-list class="mt-5" [fields]="fields()" />
      </section>
    </app-detail-page>
  `
    }]
  }], null, { appointmentId: [{ type: Input, args: [{ isSignal: true, alias: "appointmentId", required: true }] }] });
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(AppointmentDetail, { className: "AppointmentDetail", filePath: "src/app/features/private/officegest/pages/appointments/appointment-detail.ts", lineNumber: 32 });
})();
export {
  AppointmentDetail
};
//# sourceMappingURL=chunk-IPZLALNL.js.map
