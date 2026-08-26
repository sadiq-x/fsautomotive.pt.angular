import type { OpeningHoursEntry } from '../models';

/**
 * Opening hours. `schema*` fields feed the LocalBusiness structured data,
 * so the human-readable and machine-readable versions can never drift apart.
 */
export const OPENING_HOURS: readonly OpeningHoursEntry[] = [
  {
    days: 'Segunda a Sexta-feira',
    periods: ['08:30 – 13:00', '14:30 – 18:30'],
    closed: false,
    schemaDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    schemaOpens: ['08:30', '14:30'],
    schemaCloses: ['13:00', '18:30'],
  },
  {
    days: 'Sábado',
    periods: [],
    closed: true,
    schemaDays: ['Saturday'],
  },
  {
    days: 'Domingo e Feriados',
    periods: [],
    closed: true,
    schemaDays: ['Sunday'],
  },
];
