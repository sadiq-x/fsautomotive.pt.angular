#!/usr/bin/env node
/**
 * Reports the *shape* of a real OfficeGest response, without printing its data.
 *
 * WHY THIS SHIPS WITH THE INTEGRATION
 * -----------------------------------
 * OfficeGest documents its envelope, its authentication and its paths, but not
 * the field names inside a record. The mappers therefore read each field
 * through a list of candidate names (see `officegest.record-readers.ts`), and
 * narrowing those lists needs one thing: the keys a tenant actually returns.
 *
 * This prints the keys and their value types — never the values — so the field
 * maps can be corrected in minutes without a customer's name, plate or tax
 * number ever reaching a terminal, a screenshot or a support ticket.
 *
 *   npm run probe -- /entities/customers
 *   npm run probe -- /workshop/vehicles
 *
 * It performs one authenticated GET against the configured tenant, so it also
 * doubles as the connectivity and credential check the health endpoint
 * deliberately does not make.
 */
import { config, EnvValidationError } from '../src/config/index.js';
import { OfficeGestClient } from '../src/integrations/officegest/officegest.client.js';
import { officeGestRecordSchema } from '../src/integrations/officegest/officegest.types.js';

/** Describes a value without disclosing it. */
function describe(value: unknown): string {
  if (value === null) {
    return 'null';
  }

  if (Array.isArray(value)) {
    return `array(${value.length})`;
  }

  if (typeof value === 'object') {
    return `object{${Object.keys(value as object).join(', ')}}`;
  }

  if (typeof value === 'string') {
    // The length is a useful hint (an id versus a description) and discloses
    // nothing about the content.
    return `string(len ${value.length})`;
  }

  return typeof value;
}

async function main(): Promise<void> {
  const path = process.argv[2] ?? '/entities/customers';

  process.stdout.write(`\nProbing ${config.officegest.baseUrl}${path}\n`);
  process.stdout.write(`Auth mode: ${config.officegest.credentials.mode}\n\n`);

  const client = new OfficeGestClient(config.officegest);

  try {
    const result = await client.getList(path, officeGestRecordSchema, {
      query: { page: 1, per_page: 1 },
    });

    process.stdout.write(`Records returned: ${result.items.length}\n`);
    process.stdout.write(`meta keys: ${Object.keys(result.meta ?? {}).join(', ') || '(none)'}\n\n`);

    const [first] = result.items;

    if (!first) {
      process.stdout.write('No records to describe — try a path with data.\n');
      return;
    }

    process.stdout.write('Fields on the first record (names and types only):\n');

    for (const [key, value] of Object.entries(first)) {
      process.stdout.write(`  ${key.padEnd(28)} ${describe(value)}\n`);
    }

    process.stdout.write('\nCopy the names you need into the FIELDS map of the matching mapper.\n');
  } finally {
    await client.dispose();
  }
}

try {
  await main();
} catch (error) {
  if (error instanceof EnvValidationError) {
    process.stderr.write(`\n${error.message}\n\n`);
    process.exit(1);
  }

  process.stderr.write(
    `\nProbe failed: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  // The cause chain carries the upstream status, which is the useful part.
  if (error instanceof Error && error.cause instanceof Error) {
    process.stderr.write(`Cause: ${error.cause.message}\n`);
  }
  process.exit(1);
}
