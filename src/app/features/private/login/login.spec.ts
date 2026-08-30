/**
 * Sign-in, and the two things about it that are easy to get wrong.
 *
 * 1. `redirect` must be an `input()`. `withComponentInputBinding()` writes to
 *    component inputs; a plain signal field stays `undefined` for ever and the
 *    user silently lands on the dashboard instead of the page they asked for.
 *    That failure is invisible in manual testing unless you specifically
 *    arrive from a deep link.
 * 2. The redirect must be validated. An unchecked `?redirect=` is an open
 *    redirect, and a login page is exactly what attackers phish with.
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
  it('accepts `redirect` as a routed input', () => {
    const { fixture } = setup();

    // Would throw if `redirect` were a plain signal rather than an input.
    fixture.componentRef.setInput('redirect', '/gestao/clientes/42');
    fixture.detectChanges();

    expect(fixture.componentInstance.redirect()).toBe('/gestao/clientes/42');
  });

  it('returns the user to the page the guard interrupted', async () => {
    const { fixture, navigate } = setup();

    fixture.componentRef.setInput('redirect', '/gestao/clientes/42');
    fixture.detectChanges();

    await signIn(fixture);

    expect(navigate).toHaveBeenCalledWith('/gestao/clientes/42');
  });

  it('falls back to the dashboard when there is no redirect', async () => {
    const { fixture, navigate } = setup();
    fixture.detectChanges();

    await signIn(fixture);

    expect(navigate).toHaveBeenCalledWith(PRIVATE_ROUTES.dashboard);
  });

  // An unvalidated redirect parameter is an open redirect. `//evil.example` is
  // the one naive checks miss: it is protocol-relative, so a browser treats it
  // as an absolute URL to another host.
  it.each([
    ['https://evil.example', 'an absolute URL'],
    ['//evil.example', 'a protocol-relative URL'],
    ['/servicos', 'a path outside the private area'],
    [PRIVATE_ROUTES.login, 'the login page itself'],
  ])('refuses %s (%s) and uses the dashboard instead', async (target) => {
    const { fixture, navigate } = setup();

    fixture.componentRef.setInput('redirect', target);
    fixture.detectChanges();

    await signIn(fixture);

    expect(navigate).toHaveBeenCalledWith(PRIVATE_ROUTES.dashboard);
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
