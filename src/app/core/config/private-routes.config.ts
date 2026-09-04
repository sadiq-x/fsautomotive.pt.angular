/**
 * The private area's URL layout, in one place.
 *
 * Guards, the sidebar, the login redirect and the pages themselves all need
 * these paths. Defined once so a rename is a single edit, and so no template
 * contains a hand-typed `/gestao/...` that a refactor can miss.
 *
 * Portuguese, like the public routes (`/sobre-nos`, `/servicos`), because the
 * whole site is in Portuguese and a mixed-language URL space reads like an
 * accident.
 */
export const PRIVATE_BASE = '/gestao';

export const PRIVATE_ROUTES = {
  base: PRIVATE_BASE,
  /**
   * The sign-in screen is the area's front door — `/gestao` itself, not a
   * sub-path.
   *
   * Every refusal in the private area lands here: the auth guard, the
   * permission guard, the 401 handler and sign-out all navigate to
   * `PRIVATE_ROUTES.login`, so there is exactly one URL a user can be turned
   * away to. `/gestao` then shows the form when anonymous and the dashboard
   * when not, which is why it can be both the entry point and the redirect
   * target without a loop.
   */
  login: PRIVATE_BASE,
  /** The previous login URL. Redirects to `login`, so old links still work. */
  legacyLogin: `${PRIVATE_BASE}/entrar`,
  dashboard: `${PRIVATE_BASE}/painel`,
  customers: `${PRIVATE_BASE}/clientes`,
  customer: (id: string) => `${PRIVATE_BASE}/clientes/${encodeURIComponent(id)}`,
  vehicles: `${PRIVATE_BASE}/veiculos`,
  vehicle: (plate: string) => `${PRIVATE_BASE}/veiculos/${encodeURIComponent(plate)}`,
  serviceOrders: `${PRIVATE_BASE}/folhas-de-obra`,
  serviceOrder: (id: string) => `${PRIVATE_BASE}/folhas-de-obra/${encodeURIComponent(id)}`,
  appointments: `${PRIVATE_BASE}/marcacoes`,
  appointment: (id: string) => `${PRIVATE_BASE}/marcacoes/${encodeURIComponent(id)}`,
  newAppointment: `${PRIVATE_BASE}/marcacoes/nova`,
  workers: `${PRIVATE_BASE}/trabalhadores`,
  settings: `${PRIVATE_BASE}/configuracoes`,
} as const;
