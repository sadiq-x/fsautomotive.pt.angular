import type { Routes } from '@angular/router';

import type { PageMeta } from './core/models';

/**
 * Every route carries its own `meta`, which `App` feeds to `SeoService`.
 * Feature pages are lazily loaded so each one ships as its own chunk.
 */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
    data: {
      meta: {
        title: 'Oficina automóvel multimarca em Vialonga',
        description:
          'FS Automotive — oficina multimarca em Vialonga. Mecânica, diagnóstico ' +
          'computorizado, pintura, pneus e pré-inspeção com atendimento personalizado.',
        path: '/',
        image: 'images/workshop/oficina-1.jpg',
      } satisfies PageMeta,
    },
  },
  {
    path: 'sobre-nos',
    loadComponent: () => import('./features/about/about').then((m) => m.About),
    data: {
      meta: {
        title: 'Sobre Nós',
        description:
          'Conheça a FS Automotive: uma equipa experiente liderada por Miguel Faria, ' +
          'com tecnologia de ponta, sala de espera e parque para clientes em Vialonga.',
        path: '/sobre-nos',
        image: 'images/workshop/oficina-4.jpg',
      } satisfies PageMeta,
    },
  },
  {
    path: 'servicos',
    loadComponent: () => import('./features/services/services').then((m) => m.Services),
    data: {
      meta: {
        title: 'Serviços',
        description:
          'Serviços rápidos, mecânica especializada, eletricidade e eletrónica, ' +
          'diagnóstico computorizado, pneus, escapes, pintura e pré-inspeção.',
        path: '/servicos',
        image: 'images/workshop/oficina-3.jpg',
      } satisfies PageMeta,
    },
  },
  {
    path: 'contactos',
    loadComponent: () => import('./features/contact/contact').then((m) => m.Contact),
    data: {
      meta: {
        title: 'Contactos',
        description:
          'Rua do Olival Santo 16b, 2625-585 Vialonga. Telefone (+351) 933 678 865 · ' +
          'fsautomotive.servicos@gmail.com. Veja o horário e como chegar.',
        path: '/contactos',
      } satisfies PageMeta,
    },
  },

  /* Legacy paths from the previous static site, kept so old links survive. */
  { path: 'home', redirectTo: '', pathMatch: 'full' },
  { path: 'sobrenos', redirectTo: 'sobre-nos', pathMatch: 'full' },
  { path: 'contacts', redirectTo: 'contactos', pathMatch: 'full' },

  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFound),
    data: {
      meta: {
        title: 'Página não encontrada',
        description: 'A página que procura não existe ou foi movida.',
        path: '/404',
      } satisfies PageMeta,
    },
  },
];
