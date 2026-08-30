/**
 * The single place an HTTP failure becomes something the UI can use.
 *
 * WHY NOT HANDLE ERRORS IN EACH SERVICE
 * -------------------------------------
 * Because the same eight decisions would be repeated in every one of them, and
 * the ninth service would get one of them wrong. Here, exactly once:
 *
 * - The backend's `{ success: false, error }` envelope is unwrapped, so no
 *   component inspects an `HttpErrorResponse`.
 * - Every failure arrives as an `ApiError` with a message written for a person.
 *   Backend internals, stack traces and request URLs never reach the screen.
 * - A 401 ends the session once and redirects once, rather than each of four
 *   concurrent list requests starting its own redirect.
 * - Faults the user cannot act on (502, 504, network) are announced through the
 *   shared toast queue, so a page only has to render its own empty state.
 *
 * Messages are Portuguese: they are read by the same people as the rest of the
 * site.
 */
import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { PRIVATE_ROUTES } from '../config/private-routes.config';
import { ApiError, type ApiFailure } from '../models/api.model';
import { NotificationService } from '../services/notification.service';
import { EXPECTS_UNAUTHORIZED } from './api.interceptor';

/** Status → what to tell the user. Never the backend's own wording for 5xx. */
const MESSAGES: Readonly<Record<number, string>> = {
  0: 'Não foi possível contactar o servidor. Verifique a sua ligação.',
  400: 'O pedido não é válido.',
  403: 'Não tem permissão para efetuar esta ação.',
  404: 'Não encontrámos o registo pedido.',
  408: 'O pedido demorou demasiado tempo.',
  413: 'O conteúdo enviado é demasiado grande.',
  429: 'Demasiados pedidos. Aguarde um momento e tente novamente.',
  500: 'Ocorreu um erro no servidor. Tente novamente dentro de momentos.',
  502: 'O serviço OfficeGest está indisponível de momento.',
  503: 'O serviço está temporariamente indisponível.',
  504: 'O OfficeGest demorou demasiado tempo a responder.',
};

const FALLBACK_MESSAGE = 'Ocorreu um erro inesperado.';

/** Statuses worth interrupting the user for, rather than only failing the page. */
const ANNOUNCED_STATUSES = new Set([0, 429, 500, 502, 503, 504]);

/** Reads the backend envelope when the body is one. */
function asFailure(body: unknown): ApiFailure | null {
  if (typeof body !== 'object' || body === null) {
    return null;
  }

  const candidate = body as Partial<ApiFailure>;

  return candidate.success === false && typeof candidate.error?.message === 'string'
    ? (candidate as ApiFailure)
    : null;
}

function toApiError(response: HttpErrorResponse): ApiError {
  const failure = asFailure(response.error);
  const status = response.status;

  if (failure) {
    // The backend writes its 4xx messages for callers, so they are shown as-is.
    // Its 5xx messages are generic by design, and ours are friendlier.
    const message =
      status < 500 ? failure.error.message : (MESSAGES[status] ?? failure.error.message);

    return new ApiError(
      status,
      failure.error.code,
      message,
      failure.error.details,
      failure.requestId,
    );
  }

  // No envelope: a proxy error page, a CORS rejection, or the network.
  return new ApiError(status, `HTTP_${status}`, MESSAGES[status] ?? FALLBACK_MESSAGE);
}

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const notifications = inject(NotificationService);

  return next(request).pipe(
    catchError((response: unknown) => {
      if (!(response instanceof HttpErrorResponse)) {
        return throwError(() => response);
      }

      const error = toApiError(response);

      if (error.status === 401 && !request.context.get(EXPECTS_UNAUTHORIZED)) {
        // `clear()` is idempotent, so concurrent failures converge on one
        // signed-out state; the router then coalesces the navigations.
        if (auth.isAuthenticated()) {
          notifications.warning('A sua sessão terminou. Inicie sessão novamente.');
        }

        auth.clear();
        void router.navigate([PRIVATE_ROUTES.login], {
          queryParams: { redirect: router.url },
        });
      }

      if (ANNOUNCED_STATUSES.has(error.status)) {
        notifications.error(
          error.message,
          error.requestId ? `Referência: ${error.requestId}` : undefined,
        );
      }

      return throwError(() => error);
    }),
  );
};
