import type { NavLink } from '../models';

/** The primary navigation. Consumed by the header, the tab bar and the footer. */
export const NAV_LINKS: readonly NavLink[] = [
  { label: 'Início', shortLabel: 'Início', path: '/', icon: 'home', exact: true },
  { label: 'Sobre Nós', shortLabel: 'Sobre', path: '/sobre-nos', icon: 'info' },
  { label: 'Serviços', shortLabel: 'Serviços', path: '/servicos', icon: 'wrench' },
  { label: 'Contactos', shortLabel: 'Contactos', path: '/contactos', icon: 'phone' },
];
