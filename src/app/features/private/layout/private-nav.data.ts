import type { IconName } from '../../../core/models';
import { PRIVATE_ROUTES } from '../../../core/config/private-routes.config';
import type { Permission } from '../../../core/auth/auth.models';

/**
 * The private area's navigation, as data.
 *
 * Declared once and consumed by the sidebar, the mobile drawer and the
 * dashboard's shortcut cards — the same approach the public site takes with
 * `NAV_LINKS`. A new OfficeGest resource becomes one entry here plus a route,
 * and it appears everywhere it should.
 *
 * `permission` hides an item the user cannot use. That is a courtesy, not a
 * control: the route guard also checks it, and the backend decides for real.
 */
export interface PrivateNavItem {
  readonly label: string;
  readonly path: string;
  readonly icon: IconName;
  /** Only the dashboard should match exactly when highlighting the active link. */
  readonly exact?: boolean;
  readonly permission?: Permission;
  /** One line on the dashboard card; not shown in the sidebar. */
  readonly description?: string;
}

export const PRIVATE_NAV: readonly PrivateNavItem[] = [
  {
    label: 'Painel',
    path: PRIVATE_ROUTES.dashboard,
    icon: 'dashboard',
    exact: true,
    description: 'Resumo da atividade da oficina.',
  },
  {
    label: 'Clientes',
    path: PRIVATE_ROUTES.customers,
    icon: 'users',
    permission: 'officegest.customers.read',
    description: 'Consultar a base de clientes do OfficeGest.',
  },
  {
    label: 'Veículos',
    path: PRIVATE_ROUTES.vehicles,
    icon: 'car',
    permission: 'officegest.vehicles.read',
    description: 'Procurar por matrícula, marca ou modelo.',
  },
  {
    label: 'Folhas de obra',
    path: PRIVATE_ROUTES.serviceOrders,
    icon: 'clipboard-list',
    permission: 'officegest.service-orders.read',
    description: 'Acompanhar as intervenções em curso e concluídas.',
  },
  {
    label: 'Marcações',
    path: PRIVATE_ROUTES.appointments,
    icon: 'calendar',
    permission: 'officegest.appointments.read',
    description: 'Ver e criar marcações de oficina.',
  },
];
