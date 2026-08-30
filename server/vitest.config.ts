import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts', 'tests/**/*.spec.ts'],
    restoreMocks: true,
    // Every suite starts from a known environment. `tests/setup.ts` installs a
    // complete, fake OfficeGest configuration so importing `config/env.ts`
    // never depends on the developer's real `.env`.
    setupFiles: ['tests/setup.ts'],
  },
});
