/**
 * Sign-in.
 *
 * The destination is fixed: the dashboard, always. There is no `?redirect=`
 * handling, and that is the property worth pinning — the component must not
 * declare a `redirect` input, because `withComponentInputBinding()` would then
 * bind whatever a crafted URL carried. An unchecked `?redirect=` is an open
 * redirect, and a login page is exactly what attackers phish with.
 */
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthGateway } from '../../../core/auth/auth.gateway';
import type { SessionUser } from '../../../core/auth/auth.models';
import { PRIVATE_ROUTES } from '../../../core/config/private-routes.config';
import { ApiError } from '../../../core/models';
import { Login } from './login';

const USER: SessionUser = { id: '1', name: 'Ana', role: 'ADMIN', permissions: ['officegest.read'] };

function setup(gateway: Partial<AuthGateway> = {}) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      {
        provide: AuthGateway,
        useValue: {
          login: () => of(USER),
          session: () => of(null),
          logout: () => of(undefined),
          ...gateway,
        },
      },
    ],
  });

  const fixture = TestBed.createComponent(Login);
  const router = TestBed.inject(Router);
  const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

  return { fixture, navigate };
}

/** Fills the form and submits it, the way the template does. */
async function signIn(fixture: ReturnType<typeof setup>['fixture']): Promise<void> {
  const component = fixture.componentInstance as unknown as {
    email: { set: (v: string) => void };
    password: { set: (v: string) => void };
    submit: () => Promise<void>;
  };

  component.email.set('ana@fsautomotive.pt');
  component.password.set('secret');
  await component.submit();
}

describe('Login', () => {
  it('always sends the user to the dashboard', async () => {
    const { fixture, navigate } = setup();
    fixture.detectChanges();

    await signIn(fixture);

    expect(navigate).toHaveBeenCalledWith(PRIVATE_ROUTES.dashboard);
  });

  /**
   * The open-redirect guarantee, stated as the absence of the input.
   *
   * `withComponentInputBinding()` binds query parameters to component *inputs*.
   * No input, nothing to bind — so `/gestao?redirect=https://evil.example`
   * cannot steer the navigation however it is crafted. Re-adding the input
   * without re-adding validation would fail here.
   */
  it('declares no redirect input for a crafted query parameter to bind to', () => {
    const { fixture } = setup();

    expect('redirect' in fixture.componentInstance).toBe(false);
    expect(() => fixture.componentRef.setInput('redirect', 'https://evil.example')).toThrow();
  });

  it('ignores a redirect parameter present on the URL', async () => {
    const { fixture, navigate } = setup();
    await TestBed.inject(Router).navigateByUrl('/?redirect=https://evil.example');
    navigate.mockClear();
    fixture.detectChanges();

    await signIn(fixture);

    expect(navigate).toHaveBeenCalledExactlyOnceWith(PRIVATE_ROUTES.dashboard);
  });

  it('shows a message that does not reveal whether the e-mail exists', async () => {
    const { fixture, navigate } = setup({
      login: () => throwError(() => new ApiError(401, 'INVALID_CREDENTIALS', 'no such user')),
    });
    fixture.detectChanges();

    await signIn(fixture);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('E-mail ou palavra-passe incorretos.');
    expect(text).not.toContain('no such user');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('ties the error to the fields for screen readers', async () => {
    const { fixture } = setup({
      login: () => throwError(() => new ApiError(401, 'INVALID_CREDENTIALS', 'nope')),
    });
    fixture.detectChanges();

    await signIn(fixture);
    fixture.detectChanges();

    const email = fixture.nativeElement.querySelector('#email') as HTMLInputElement;
    const error = fixture.nativeElement.querySelector('#login-erro') as HTMLElement;

    expect(email.getAttribute('aria-invalid')).toBe('true');
    expect(email.getAttribute('aria-describedby')).toBe('login-erro');
    expect(error.getAttribute('role')).toBe('alert');
  });

  it('reports a server failure differently from a rejected password', async () => {
    const { fixture } = setup({
      login: () => throwError(() => new ApiError(502, 'OFFICEGEST_UNAVAILABLE', 'down')),
    });
    fixture.detectChanges();

    await signIn(fixture);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Não foi possível iniciar sessão');
  });
});
