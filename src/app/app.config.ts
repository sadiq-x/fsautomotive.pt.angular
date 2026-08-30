import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  type ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';

import { routes } from './app.routes';
import { provideAuth } from './core/auth';
import { apiInterceptor, errorInterceptor } from './core/interceptors';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),

    // Order matters: `apiInterceptor` rewrites the URL and attaches
    // credentials on the way out, `errorInterceptor` normalises whatever comes
    // back. The error handler is listed last so it wraps the outgoing one and
    // sees every failure, including those raised by the rewrite.
    provideHttpClient(withInterceptors([apiInterceptor, errorInterceptor])),

    // Picks the real authentication gateway, or the development stub when
    // `DEV_AUTH_STUB=true` — which the production build refuses outright.
    provideAuth(),
    provideRouter(
      routes,
      // Scroll to the top on navigation, but honour #fragment links and
      // restore the previous offset when going back.
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
      }),
      withComponentInputBinding(),
      withViewTransitions({ skipInitialTransition: true }),
    ),
  ],
};
