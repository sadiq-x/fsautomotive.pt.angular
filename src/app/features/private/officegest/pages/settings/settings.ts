import { HttpClient, HttpContext } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';

import { AuthService } from '../../../../../core/auth';
import { ANALYTICS_CONFIG } from '../../../../../core/config/analytics.config';
import { API_BASE_URL } from '../../../../../core/config/api.config';
import { isDevAuthStubActive } from '../../../../../core/config/auth.config';
import { REPORTS_OWN_ERRORS } from '../../../../../core/interceptors/api.interceptor';
import type { ApiSuccess } from '../../../../../core/models/api.model';
import { ConsentService } from '../../../../../core/services/consent.service';
import { Icon } from '../../../../../shared/components/icon/icon';
import { UiButton } from '../../../../../shared/components/ui-button/ui-button';
import { DetailList, type DetailField } from '../../components/detail-list/detail-list';

/**
 * What the backend's `/health` endpoint returns, as far as this page reads it.
 * Mirrors `server/src/routes/health.routes.ts`.
 */
interface HealthPayload {
  readonly status: string;
  readonly environment: string;
  readonly uptimeSeconds: number;
  readonly officegest: { readonly baseUrl: string; readonly authMode: string };
}

type ProbeState =
  | { readonly kind: 'checking' }
  | { readonly kind: 'up'; readonly latencyMs: number; readonly payload: HealthPayload }
  | { readonly kind: 'down'; readonly reason: string };

/**
 * The private area's settings and diagnostics screen.
 *
 * WHY IT IS READ-ONLY
 * -------------------
 * A settings page that saves needs somewhere to save to, and this application
 * has no such place: `auth.contract.ts` records that even the authentication
 * endpoints do not exist yet, and the backend holds no datastore — it brokers
 * OfficeGest and keeps nothing. Rendering editable fields that silently
 * discard their values would be worse than showing none.
 *
 * So it answers the questions that *are* answerable in the browser, and which
 * are the ones actually asked when something looks wrong: who am I signed in
 * as, what may I do, which backend is this build pointing at, is that backend
 * answering, and what did I tell it about cookies.
 *
 * The one thing that genuinely is a setting — analytics consent — is editable,
 * because `ConsentService` really does persist it.
 *
 * WHY THE STUB WARNING IS PROMINENT
 * ---------------------------------
 * `DEV_AUTH_STUB` accepts any password. A build carrying it is an
 * authentication bypass, and the surest way for that to reach production is
 * for nobody to notice it is on. This page is where someone would look.
 */
@Component({
  selector: 'app-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DetailList, Icon, UiButton],
  templateUrl: './settings.html',
})
export class Settings {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly consent = inject(ConsentService);
  private readonly analytics = inject(ANALYTICS_CONFIG);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  /** Bumped by the "Verificar" button to re-run the probe. */
  private readonly probeAttempt = signal(0);

  protected readonly user = this.auth.user;
  protected readonly consentValue = this.consent.value;
  protected readonly stubActive = isDevAuthStubActive();

  protected readonly permissions = computed(() => [...this.auth.permissions()].sort());

  protected readonly session = computed<readonly DetailField[]>(() => {
    const user = this.user();

    return [
      { label: 'Nome', value: user?.name ?? null },
      { label: 'E-mail', value: user?.email ?? null },
      { label: 'Perfil', value: user?.role ?? null, badge: true },
      { label: 'Identificador', value: user?.id ?? null },
    ];
  });

  protected readonly application = computed<readonly DetailField[]>(() => [
    {
      label: 'Backend',
      // An empty base URL is not "unset" — it means same-origin, which is what
      // a reverse-proxy deployment wants. Saying so beats showing a dash.
      value: this.apiBaseUrl || 'Mesma origem que o site',
    },
    {
      label: 'Analytics',
      value: this.analytics.enabled ? 'Ativo' : 'Inativo',
      badge: true,
    },
    {
      label: 'Measurement ID',
      value: this.analytics.measurementId || null,
    },
    {
      label: 'Stub de autenticação',
      value: this.stubActive ? 'ATIVO' : 'Inativo',
      badge: true,
    },
  ]);

  /**
   * Probes the backend.
   *
   * `/health` sits outside `/api/`, so `apiInterceptor` leaves it alone and the
   * origin has to be prefixed here. When the base URL is empty the request goes
   * to the site's own origin, which in development is the Angular dev server —
   * it will 404, and "não está a responder" is the correct thing to report.
   */
  protected readonly probe = toSignal(
    toObservable(this.probeAttempt).pipe(
      switchMap(() => {
        const startedAt = performance.now();

        return this.http
          .get<ApiSuccess<HealthPayload>>(`${this.apiBaseUrl}/health`, {
            // This page reports the outage itself, in place. A toast on top
            // would repeat it, and again on every re-check.
            context: new HttpContext().set(REPORTS_OWN_ERRORS, true),
          })
          .pipe(
            map((response): ProbeState => ({
              kind: 'up',
              latencyMs: Math.round(performance.now() - startedAt),
              payload: response.data,
            })),
            catchError((error: unknown) =>
              of<ProbeState>({
                kind: 'down',
                reason: error instanceof Error ? error.message : 'Não foi possível contactar.',
              }),
            ),
            startWith<ProbeState>({ kind: 'checking' }),
          );
      }),
    ),
    { initialValue: { kind: 'checking' } as ProbeState },
  );

  protected readonly backend = computed<readonly DetailField[]>(() => {
    const probe = this.probe();

    if (probe.kind !== 'up') {
      return [];
    }

    return [
      { label: 'Estado', value: probe.payload.status, badge: true },
      { label: 'Ambiente', value: probe.payload.environment },
      { label: 'Latência', value: `${probe.latencyMs} ms` },
      { label: 'Ativo há', value: formatUptime(probe.payload.uptimeSeconds) },
      { label: 'OfficeGest', value: probe.payload.officegest.baseUrl, wide: true },
      { label: 'Autenticação OfficeGest', value: probe.payload.officegest.authMode },
    ];
  });

  protected readonly consentLabel = computed(() => {
    switch (this.consentValue()) {
      case 'accepted':
        return 'Aceite';
      case 'declined':
        return 'Recusado';
      default:
        return 'Por decidir';
    }
  });

  protected recheck(): void {
    this.probeAttempt.update((attempt) => attempt + 1);
  }

  protected resetConsent(): void {
    this.consent.reset();
  }
}

/** `3725` → `1 h 2 min`. Seconds are noise once a process has been up a while. */
function formatUptime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} s`;
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  return hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`;
}
