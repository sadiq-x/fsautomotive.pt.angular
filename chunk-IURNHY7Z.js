import "./chunk-OFYC5P2J.js";
import {
  DefaultValueAccessor,
  FormsModule,
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
import {
  STUB_REJECTED_PASSWORD,
  isDevAuthStubActive
} from "./chunk-ZQIDUDRV.js";
import {
  AuthService
} from "./chunk-DWZ5PAW5.js";
import {
  ApiError
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
  Input,
  Router,
  inject,
  input,
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
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1
} from "./chunk-RUFDRP5X.js";

// src/app/features/private/login/login.ts
function Login_Conditional_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 7)(1, "strong", 17);
    \u0275\u0275text(2, "Modo de desenvolvimento.");
    \u0275\u0275elementEnd();
    \u0275\u0275text(3, " Qualquer palavra-passe \xE9 aceite \u2014 use ");
    \u0275\u0275elementStart(4, "code", 18);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd();
    \u0275\u0275text(6, " para testar o estado de erro. ");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate(ctx_r0.stubRejectedPassword);
  }
}
function Login_Conditional_19_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 13);
    \u0275\u0275element(1, "app-icon", 19);
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
var Login = class _Login {
  auth = inject(AuthService);
  router = inject(Router);
  /**
   * Bound from `?redirect=` by `withComponentInputBinding()`.
   *
   * It must be an `input()`, not a plain signal: the router writes to component
   * *inputs*, so a signal field would silently stay `undefined` and every
   * sign-in would land on the dashboard, discarding the page the user asked
   * for.
   */
  redirect = input(void 0, ...ngDevMode ? [{ debugName: "redirect" }] : (
    /* istanbul ignore next */
    []
  ));
  email = signal("", ...ngDevMode ? [{ debugName: "email" }] : (
    /* istanbul ignore next */
    []
  ));
  password = signal("", ...ngDevMode ? [{ debugName: "password" }] : (
    /* istanbul ignore next */
    []
  ));
  errorMessage = signal(null, ...ngDevMode ? [{ debugName: "errorMessage" }] : (
    /* istanbul ignore next */
    []
  ));
  submitting = this.auth.pending;
  stubActive = isDevAuthStubActive();
  stubRejectedPassword = STUB_REJECTED_PASSWORD;
  async submit() {
    this.errorMessage.set(null);
    try {
      await this.auth.login({ email: this.email().trim(), password: this.password() });
      await this.router.navigateByUrl(this.safeRedirect());
    } catch (error) {
      this.errorMessage.set(error instanceof ApiError && error.status === 401 ? "E-mail ou palavra-passe incorretos." : "N\xE3o foi poss\xEDvel iniciar sess\xE3o. Tente novamente dentro de momentos.");
    }
  }
  /**
   * Only a path inside the private area is accepted.
   *
   * `//evil.example` and `https://evil.example` are both rejected: the first is
   * a protocol-relative URL that most naive checks miss.
   */
  safeRedirect() {
    const target = this.redirect();
    if (target && target.startsWith(`${PRIVATE_ROUTES.base}/`) && !target.startsWith("//") && target !== PRIVATE_ROUTES.login) {
      return target;
    }
    return PRIVATE_ROUTES.dashboard;
  }
  static \u0275fac = function Login_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _Login)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _Login, selectors: [["app-login"]], hostAttrs: [1, "flex", "min-h-dvh", "flex-col", "bg-ink-950"], inputs: { redirect: [1, "redirect"] }, decls: 25, vars: 12, consts: [[1, "flex", "flex-1", "items-center", "justify-center", "px-5", "py-12"], [1, "w-full", "max-w-sm"], [1, "text-center"], [1, "inline-flex", "size-12", "items-center", "justify-center", "rounded-2xl", "bg-brand-600", "text-white"], ["name", "lock", 3, "size"], [1, "mt-5", "text-h2", "text-white"], [1, "mt-2", "text-body", "text-bone-400"], ["role", "status", 1, "mt-6", "rounded-xl", "bg-amber-400/10", "px-4", "py-3", "text-meta", "text-amber-200", "ring-1", "ring-amber-400/25"], [1, "mt-8", "space-y-4", 3, "ngSubmit"], ["for", "email", 1, "block", "text-meta", "font-semibold", "text-bone-300"], ["id", "email", "name", "email", "type", "email", "autocomplete", "username", "required", "", "placeholder", "nome@fsautomotive.pt", 1, "placeholder:text-bone-500", "mt-1.5", "w-full", "rounded-xl", "border-0", "bg-white/8", "px-4", "py-3", "text-body", "text-white", "ring-1", "ring-white/15", "transition-shadow", "ring-inset", "focus:ring-2", "focus:ring-brand-500", "focus:outline-none", 3, "ngModelChange", "ngModel"], ["for", "password", 1, "block", "text-meta", "font-semibold", "text-bone-300"], ["id", "password", "name", "password", "type", "password", "autocomplete", "current-password", "required", "", 1, "placeholder:text-bone-500", "mt-1.5", "w-full", "rounded-xl", "border-0", "bg-white/8", "px-4", "py-3", "text-body", "text-white", "ring-1", "ring-white/15", "transition-shadow", "ring-inset", "focus:ring-2", "focus:ring-brand-500", "focus:outline-none", 3, "ngModelChange", "ngModel"], ["id", "login-erro", "role", "alert", 1, "flex", "items-start", "gap-2", "rounded-xl", "bg-brand-500/10", "px-4", "py-3", "text-meta", "text-brand-200", "ring-1", "ring-brand-500/25"], ["type", "submit", "variant", "primary", 1, "pt-2", 3, "block", "disabled"], [1, "text-bone-500", "mt-8", "text-center", "text-meta"], ["href", "/", 1, "underline", "decoration-white/25", "underline-offset-4", "transition-colors", "hover:text-bone-300"], [1, "font-bold"], [1, "font-mono"], ["name", "alert-triangle", 1, "mt-0.5", "shrink-0", 3, "size"]], template: function Login_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "div", 2)(3, "span", 3);
      \u0275\u0275element(4, "app-icon", 4);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(5, "h1", 5);
      \u0275\u0275text(6, "\xC1rea de gest\xE3o");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(7, "p", 6);
      \u0275\u0275text(8, "Inicie sess\xE3o para consultar os dados do OfficeGest.");
      \u0275\u0275elementEnd()();
      \u0275\u0275conditionalCreate(9, Login_Conditional_9_Template, 7, 1, "p", 7);
      \u0275\u0275elementStart(10, "form", 8);
      \u0275\u0275listener("ngSubmit", function Login_Template_form_ngSubmit_10_listener() {
        return ctx.submit();
      });
      \u0275\u0275elementStart(11, "div")(12, "label", 9);
      \u0275\u0275text(13, "E-mail");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(14, "input", 10);
      \u0275\u0275listener("ngModelChange", function Login_Template_input_ngModelChange_14_listener($event) {
        return ctx.email.set($event);
      });
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(15, "div")(16, "label", 11);
      \u0275\u0275text(17, " Palavra-passe ");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(18, "input", 12);
      \u0275\u0275listener("ngModelChange", function Login_Template_input_ngModelChange_18_listener($event) {
        return ctx.password.set($event);
      });
      \u0275\u0275elementEnd()();
      \u0275\u0275conditionalCreate(19, Login_Conditional_19_Template, 3, 2, "p", 13);
      \u0275\u0275elementStart(20, "app-button", 14);
      \u0275\u0275text(21);
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(22, "p", 15)(23, "a", 16);
      \u0275\u0275text(24, "Voltar ao site");
      \u0275\u0275elementEnd()()()();
    }
    if (rf & 2) {
      let tmp_8_0;
      \u0275\u0275advance(4);
      \u0275\u0275property("size", 22);
      \u0275\u0275advance(5);
      \u0275\u0275conditional(ctx.stubActive ? 9 : -1);
      \u0275\u0275advance(5);
      \u0275\u0275property("ngModel", ctx.email());
      \u0275\u0275attribute("aria-invalid", ctx.errorMessage() ? "true" : null)("aria-describedby", ctx.errorMessage() ? "login-erro" : null);
      \u0275\u0275advance(4);
      \u0275\u0275property("ngModel", ctx.password());
      \u0275\u0275attribute("aria-invalid", ctx.errorMessage() ? "true" : null)("aria-describedby", ctx.errorMessage() ? "login-erro" : null);
      \u0275\u0275advance();
      \u0275\u0275conditional((tmp_8_0 = ctx.errorMessage()) ? 19 : -1, tmp_8_0);
      \u0275\u0275advance();
      \u0275\u0275property("block", true)("disabled", ctx.submitting() || !ctx.email() || !ctx.password());
      \u0275\u0275advance();
      \u0275\u0275textInterpolate1(" ", ctx.submitting() ? "A entrar\u2026" : "Entrar", " ");
    }
  }, dependencies: [FormsModule, \u0275NgNoValidate, DefaultValueAccessor, NgControlStatus, NgControlStatusGroup, RequiredValidator, NgModel, NgForm, Icon, UiButton], encapsulation: 2, changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(Login, [{
    type: Component,
    args: [{ selector: "app-login", changeDetection: ChangeDetectionStrategy.OnPush, imports: [FormsModule, Icon, UiButton], host: { class: "flex min-h-dvh flex-col bg-ink-950" }, template: `<div class="flex flex-1 items-center justify-center px-5 py-12">
  <div class="w-full max-w-sm">
    <div class="text-center">
      <span class="inline-flex size-12 items-center justify-center rounded-2xl bg-brand-600 text-white">
        <app-icon name="lock" [size]="22" />
      </span>
      <h1 class="mt-5 text-h2 text-white">\xC1rea de gest\xE3o</h1>
      <p class="mt-2 text-body text-bone-400">Inicie sess\xE3o para consultar os dados do OfficeGest.</p>
    </div>

    @if (stubActive) {
      <p
        class="mt-6 rounded-xl bg-amber-400/10 px-4 py-3 text-meta text-amber-200 ring-1 ring-amber-400/25"
        role="status"
      >
        <strong class="font-bold">Modo de desenvolvimento.</strong>
        Qualquer palavra-passe \xE9 aceite \u2014 use
        <code class="font-mono">{{ stubRejectedPassword }}</code> para testar o estado de erro.
      </p>
    }

    <form class="mt-8 space-y-4" (ngSubmit)="submit()">
      <div>
        <label class="block text-meta font-semibold text-bone-300" for="email">E-mail</label>
        <input
          id="email"
          name="email"
          type="email"
          autocomplete="username"
          required
          class="placeholder:text-bone-500 mt-1.5 w-full rounded-xl border-0 bg-white/8 px-4 py-3 text-body text-white ring-1 ring-white/15 transition-shadow ring-inset focus:ring-2 focus:ring-brand-500 focus:outline-none"
          placeholder="nome@fsautomotive.pt"
          [ngModel]="email()"
          (ngModelChange)="email.set($event)"
          [attr.aria-invalid]="errorMessage() ? 'true' : null"
          [attr.aria-describedby]="errorMessage() ? 'login-erro' : null"
        />
      </div>

      <div>
        <label class="block text-meta font-semibold text-bone-300" for="password"> Palavra-passe </label>
        <input
          id="password"
          name="password"
          type="password"
          autocomplete="current-password"
          required
          class="placeholder:text-bone-500 mt-1.5 w-full rounded-xl border-0 bg-white/8 px-4 py-3 text-body text-white ring-1 ring-white/15 transition-shadow ring-inset focus:ring-2 focus:ring-brand-500 focus:outline-none"
          [ngModel]="password()"
          (ngModelChange)="password.set($event)"
          [attr.aria-invalid]="errorMessage() ? 'true' : null"
          [attr.aria-describedby]="errorMessage() ? 'login-erro' : null"
        />
      </div>

      @if (errorMessage(); as message) {
        <p
          id="login-erro"
          role="alert"
          class="flex items-start gap-2 rounded-xl bg-brand-500/10 px-4 py-3 text-meta text-brand-200 ring-1 ring-brand-500/25"
        >
          <app-icon name="alert-triangle" [size]="16" class="mt-0.5 shrink-0" />
          {{ message }}
        </p>
      }

      <app-button
        class="pt-2"
        type="submit"
        variant="primary"
        [block]="true"
        [disabled]="submitting() || !email() || !password()"
      >
        {{ submitting() ? 'A entrar\u2026' : 'Entrar' }}
      </app-button>
    </form>

    <p class="text-bone-500 mt-8 text-center text-meta">
      <a
        class="underline decoration-white/25 underline-offset-4 transition-colors hover:text-bone-300"
        href="/"
        >Voltar ao site</a
      >
    </p>
  </div>
</div>
` }]
  }], null, { redirect: [{ type: Input, args: [{ isSignal: true, alias: "redirect", required: false }] }] });
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(Login, { className: "Login", filePath: "src/app/features/private/login/login.ts", lineNumber: 41 });
})();
export {
  Login
};
//# sourceMappingURL=chunk-IURNHY7Z.js.map
