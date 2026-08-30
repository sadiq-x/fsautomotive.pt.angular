import {
  ChangeDetectionStrategy,
  Component,
  Input,
  computed,
  input,
  setClassMetadata,
  ɵsetClassDebugInfo,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵconditional,
  ɵɵconditionalCreate,
  ɵɵdefineComponent,
  ɵɵdomElement,
  ɵɵdomElementEnd,
  ɵɵdomElementStart,
  ɵɵnamespaceSVG,
  ɵɵnextContext,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIndex
} from "./chunk-RUFDRP5X.js";

// src/app/shared/components/icon/icon-shape.ts
var path = (d, filled = false) => ({ kind: "path", d, filled });
var circle = (cx, cy, r, filled = false) => ({
  kind: "circle",
  cx,
  cy,
  r,
  filled
});
var rect = (x, y, width, height, rx = 0) => ({
  kind: "rect",
  x,
  y,
  width,
  height,
  rx
});
var line = (x1, y1, x2, y2) => ({
  kind: "line",
  x1,
  y1,
  x2,
  y2
});
var polyline = (points) => ({ kind: "polyline", points });

// src/app/shared/components/icon/icon-paths.ts
var ICON_SHAPES = {
  /* ---------------------------------------------------------------- UI --- */
  home: [
    path("M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"),
    path("M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z")
  ],
  info: [circle(12, 12, 10), path("M12 16v-4"), path("M12 8h.01")],
  wrench: [
    path("M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z")
  ],
  phone: [
    path("M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384")
  ],
  mail: [rect(2, 4, 20, 16, 2), path("m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7")],
  "map-pin": [
    path("M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"),
    circle(12, 10, 3)
  ],
  clock: [circle(12, 12, 10), polyline("12 6 12 12 16 14")],
  calendar: [path("M8 2v4"), path("M16 2v4"), rect(3, 4, 18, 18, 2), path("M3 10h18")],
  "chevron-down": [path("m6 9 6 6 6-6")],
  "chevron-right": [path("m9 18 6-6-6-6")],
  "arrow-right": [path("M5 12h14"), path("m12 5 7 7-7 7")],
  "arrow-up-right": [path("M7 7h10v10"), path("M7 17 17 7")],
  check: [path("M20 6 9 17l-5-5")],
  close: [path("M18 6 6 18"), path("m6 6 12 12")],
  menu: [path("M4 5h16"), path("M4 12h16"), path("M4 19h16")],
  "external-link": [
    path("M15 3h6v6"),
    path("M10 14 21 3"),
    path("M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6")
  ],
  star: [
    path("M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z")
  ],
  quote: [
    path("M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h1a1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"),
    path("M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h1a1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z")
  ],
  /* ---------------------------------------------------------- Services --- */
  gauge: [path("m12 14 4-4"), path("M3.34 19a10 10 0 1 1 17.32 0")],
  palette: [
    path("M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"),
    circle(13.5, 6.5, 0.5, true),
    circle(17.5, 10.5, 0.5, true),
    circle(6.5, 12.5, 0.5, true),
    circle(8.5, 7.5, 0.5, true)
  ],
  zap: [
    path("M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z")
  ],
  cpu: [
    rect(4, 4, 16, 16, 2),
    rect(9, 9, 6, 6, 1),
    path("M15 2v2"),
    path("M15 20v2"),
    path("M2 15h2"),
    path("M2 9h2"),
    path("M20 15h2"),
    path("M20 9h2"),
    path("M9 2v2"),
    path("M9 20v2")
  ],
  disc: [circle(12, 12, 10), circle(12, 12, 2)],
  "shield-check": [
    path("M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"),
    path("m9 12 2 2 4-4")
  ],
  wind: [
    path("M12.8 19.6A2 2 0 1 0 14 16H2"),
    path("M17.5 8a2.5 2.5 0 1 1 2 4H2"),
    path("M9.8 4.4A2 2 0 1 1 11 8H2")
  ],
  droplet: [
    path("M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z")
  ],
  "clipboard-check": [
    rect(8, 2, 8, 4, 1),
    path("M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"),
    path("m9 14 2 2 4-4")
  ],
  /* ------------------------------------------------- Management area --- */
  "chevron-left": [path("m15 18-6-6 6-6")],
  search: [circle(11, 11, 8), path("m21 21-4.3-4.3")],
  plus: [path("M5 12h14"), path("M12 5v14")],
  refresh: [
    path("M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"),
    path("M21 3v5h-5"),
    path("M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"),
    path("M8 16H3v5")
  ],
  "alert-triangle": [
    path("m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"),
    path("M12 9v4"),
    path("M12 17h.01")
  ],
  inbox: [
    polyline("22 12 16 12 14 15 10 15 8 12 2 12"),
    path("M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z")
  ],
  lock: [rect(3, 11, 18, 11, 2), path("M7 11V7a5 5 0 0 1 10 0v4")],
  "log-out": [
    path("M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"),
    polyline("16 17 21 12 16 7"),
    line(21, 12, 9, 12)
  ],
  dashboard: [
    rect(3, 3, 7, 9, 1),
    rect(14, 3, 7, 5, 1),
    rect(14, 12, 7, 9, 1),
    rect(3, 16, 7, 5, 1)
  ],
  users: [
    path("M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"),
    circle(9, 7, 4),
    path("M22 21v-2a4 4 0 0 0-3-3.87"),
    path("M16 3.13a4 4 0 0 1 0 7.75")
  ],
  user: [path("M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"), circle(12, 7, 4)],
  car: [
    path("M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"),
    circle(7, 17, 2),
    path("M9 17h6"),
    circle(17, 17, 2)
  ],
  "clipboard-list": [
    rect(8, 2, 8, 4, 1),
    path("M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"),
    path("M12 11h4"),
    path("M12 16h4"),
    path("M8 11h.01"),
    path("M8 16h.01")
  ],
  /* --------------------------------------------------------- Amenities --- */
  parking: [rect(3, 3, 18, 18, 2), path("M9 17V7h4a3 3 0 0 1 0 6H9")],
  sofa: [
    path("M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3"),
    path("M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-4 0Z"),
    path("M4 18v2"),
    path("M20 18v2"),
    path("M12 4v9")
  ],
  /* ------------------------------------------------------------ Social --- */
  facebook: [path("M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z")],
  instagram: [
    rect(2, 2, 20, 20, 5),
    path("M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"),
    line(17.5, 6.5, 17.51, 6.5)
  ]
};

// src/app/shared/components/icon/icon.ts
function Icon_For_2_Case_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275namespaceSVG();
    \u0275\u0275domElement(0, "path");
  }
  if (rf & 2) {
    const shape_r1 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275attribute("d", shape_r1.d)("fill", shape_r1.filled ? "currentColor" : "none");
  }
}
function Icon_For_2_Case_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275namespaceSVG();
    \u0275\u0275domElement(0, "circle");
  }
  if (rf & 2) {
    const shape_r1 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275attribute("cx", shape_r1.cx)("cy", shape_r1.cy)("r", shape_r1.r)("fill", shape_r1.filled ? "currentColor" : "none");
  }
}
function Icon_For_2_Case_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275namespaceSVG();
    \u0275\u0275domElement(0, "rect");
  }
  if (rf & 2) {
    const shape_r1 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275attribute("x", shape_r1.x)("y", shape_r1.y)("width", shape_r1.width)("height", shape_r1.height)("rx", shape_r1.rx);
  }
}
function Icon_For_2_Case_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275namespaceSVG();
    \u0275\u0275domElement(0, "line");
  }
  if (rf & 2) {
    const shape_r1 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275attribute("x1", shape_r1.x1)("y1", shape_r1.y1)("x2", shape_r1.x2)("y2", shape_r1.y2);
  }
}
function Icon_For_2_Case_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275namespaceSVG();
    \u0275\u0275domElement(0, "polyline");
  }
  if (rf & 2) {
    const shape_r1 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275attribute("points", shape_r1.points);
  }
}
function Icon_For_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275conditionalCreate(0, Icon_For_2_Case_0_Template, 1, 2, ":svg:path")(1, Icon_For_2_Case_1_Template, 1, 4, ":svg:circle")(2, Icon_For_2_Case_2_Template, 1, 5, ":svg:rect")(3, Icon_For_2_Case_3_Template, 1, 4, ":svg:line")(4, Icon_For_2_Case_4_Template, 1, 1, ":svg:polyline");
  }
  if (rf & 2) {
    let tmp_10_0;
    const shape_r1 = ctx.$implicit;
    \u0275\u0275conditional((tmp_10_0 = shape_r1.kind) === "path" ? 0 : tmp_10_0 === "circle" ? 1 : tmp_10_0 === "rect" ? 2 : tmp_10_0 === "line" ? 3 : tmp_10_0 === "polyline" ? 4 : -1);
  }
}
var Icon = class _Icon {
  name = input.required(...ngDevMode ? [{ debugName: "name" }] : (
    /* istanbul ignore next */
    []
  ));
  /** Edge length in pixels; icons are square. */
  size = input(24, ...ngDevMode ? [{ debugName: "size" }] : (
    /* istanbul ignore next */
    []
  ));
  strokeWidth = input(1.75, ...ngDevMode ? [{ debugName: "strokeWidth" }] : (
    /* istanbul ignore next */
    []
  ));
  /** Accessible name. When omitted the icon is hidden from assistive tech. */
  label = input(null, ...ngDevMode ? [{ debugName: "label" }] : (
    /* istanbul ignore next */
    []
  ));
  shapes = computed(() => ICON_SHAPES[this.name()], ...ngDevMode ? [{ debugName: "shapes" }] : (
    /* istanbul ignore next */
    []
  ));
  decorative = computed(() => this.label() === null, ...ngDevMode ? [{ debugName: "decorative" }] : (
    /* istanbul ignore next */
    []
  ));
  static \u0275fac = function Icon_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _Icon)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _Icon, selectors: [["app-icon"]], hostAttrs: [1, "inline-flex", "shrink-0", "items-center", "justify-center"], inputs: { name: [1, "name"], size: [1, "size"], strokeWidth: [1, "strokeWidth"], label: [1, "label"] }, decls: 3, vars: 6, consts: [["xmlns", "http://www.w3.org/2000/svg", "viewBox", "0 0 24 24", "fill", "none", "stroke", "currentColor", "stroke-linecap", "round", "stroke-linejoin", "round", "focusable", "false"]], template: function Icon_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275namespaceSVG();
      \u0275\u0275domElementStart(0, "svg", 0);
      \u0275\u0275repeaterCreate(1, Icon_For_2_Template, 5, 1, null, null, \u0275\u0275repeaterTrackByIndex);
      \u0275\u0275domElementEnd();
    }
    if (rf & 2) {
      \u0275\u0275attribute("width", ctx.size())("height", ctx.size())("stroke-width", ctx.strokeWidth())("aria-hidden", ctx.decorative() ? "true" : null)("role", ctx.decorative() ? null : "img")("aria-label", ctx.label());
      \u0275\u0275advance();
      \u0275\u0275repeater(ctx.shapes());
    }
  }, encapsulation: 2, changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(Icon, [{
    type: Component,
    args: [{ selector: "app-icon", changeDetection: ChangeDetectionStrategy.OnPush, host: {
      class: "inline-flex shrink-0 items-center justify-center"
    }, template: `<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  [attr.width]="size()"
  [attr.height]="size()"
  fill="none"
  stroke="currentColor"
  [attr.stroke-width]="strokeWidth()"
  stroke-linecap="round"
  stroke-linejoin="round"
  [attr.aria-hidden]="decorative() ? 'true' : null"
  [attr.role]="decorative() ? null : 'img'"
  [attr.aria-label]="label()"
  focusable="false"
>
  @for (shape of shapes(); track $index) {
    @switch (shape.kind) {
      @case ('path') {
        <svg:path [attr.d]="shape.d" [attr.fill]="shape.filled ? 'currentColor' : 'none'" />
      }
      @case ('circle') {
        <svg:circle
          [attr.cx]="shape.cx"
          [attr.cy]="shape.cy"
          [attr.r]="shape.r"
          [attr.fill]="shape.filled ? 'currentColor' : 'none'"
        />
      }
      @case ('rect') {
        <svg:rect
          [attr.x]="shape.x"
          [attr.y]="shape.y"
          [attr.width]="shape.width"
          [attr.height]="shape.height"
          [attr.rx]="shape.rx"
        />
      }
      @case ('line') {
        <svg:line [attr.x1]="shape.x1" [attr.y1]="shape.y1" [attr.x2]="shape.x2" [attr.y2]="shape.y2" />
      }
      @case ('polyline') {
        <svg:polyline [attr.points]="shape.points" />
      }
    }
  }
</svg>
` }]
  }], null, { name: [{ type: Input, args: [{ isSignal: true, alias: "name", required: true }] }], size: [{ type: Input, args: [{ isSignal: true, alias: "size", required: false }] }], strokeWidth: [{ type: Input, args: [{ isSignal: true, alias: "strokeWidth", required: false }] }], label: [{ type: Input, args: [{ isSignal: true, alias: "label", required: false }] }] });
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(Icon, { className: "Icon", filePath: "src/app/shared/components/icon/icon.ts", lineNumber: 24 });
})();

export {
  Icon
};
//# sourceMappingURL=chunk-57VTFLIE.js.map
