#!/usr/bin/env node
/**
 * Runs the Angular dev server and the OfficeGest backend as one command.
 *
 * WHY A SCRIPT AND NOT `concurrently`
 * -----------------------------------
 * The two things a dev runner has to get right are signal handling — one
 * Ctrl-C must stop both processes, not orphan one — and exit codes, so a
 * backend that fails to boot does not leave a frontend running against
 * nothing. Both are twenty lines of `child_process`, and this project already
 * prefers a small Node script over a dependency (see `ng-env.mjs`, which exists
 * instead of `dotenv`).
 *
 * Each side keeps its own start-up: the frontend through `ng-env.mjs`, which
 * compiles allow-listed variables into the bundle, and the backend through its
 * own npm script, which loads `server/.env` at runtime. Neither reads the
 * other's configuration, which is exactly the separation the API key depends
 * on.
 *
 * USAGE
 *   npm start            both
 *   npm run start:web    frontend only
 *   npm run start:api    backend only
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ESC = String.fromCharCode(27);
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const serverDir = join(repoRoot, 'server');

/** ANSI colours, but only when a human is watching. */
const useColour = process.stdout.isTTY && !process.env['NO_COLOR'];
const paint = (code, text) => (useColour ? `${ESC}[${code}m${text}${ESC}[0m` : text);

const TASKS = [
  { name: 'web', colour: '36', cwd: repoRoot, args: ['run', 'start:web'] },
  { name: 'api', colour: '35', cwd: serverDir, args: ['run', 'dev'] },
];

// The backend has its own dependency tree. Without this check the failure is an
// opaque "tsx: not found" from a child process.
if (!existsSync(join(serverDir, 'node_modules'))) {
  console.error(
    `\n${paint('31', 'The backend dependencies are not installed.')}\n` +
      `Run ${paint('1', 'npm run install:all')} first.\n`,
  );
  process.exit(1);
}

const width = Math.max(...TASKS.map((task) => task.name.length));
const children = [];
let shuttingDown = false;

/** Prefixes every line so two interleaved streams stay readable. */
function pipe(stream, target, task) {
  const label = paint(task.colour, `[${task.name.padEnd(width)}]`);
  let buffer = '';

  stream.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    // The last element is an unterminated line; hold it until the rest arrives.
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      target.write(`${label} ${line}\n`);
    }
  });

  stream.on('end', () => {
    if (buffer) {
      target.write(`${label} ${buffer}\n`);
    }
  });
}

/** Stops everything still running. Called on a signal or on a child's failure. */
function shutdown(signal = 'SIGTERM') {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of children) {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill(signal);
    }
  }
}

for (const task of TASKS) {
  // `npm` is a shell script on Windows, so it needs `shell: true` there. Piping
  // rather than inheriting is what makes the prefixes possible.
  const child = spawn('npm', task.args, {
    cwd: task.cwd,
    shell: process.platform === 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  pipe(child.stdout, process.stdout, task);
  pipe(child.stderr, process.stderr, task);

  child.on('error', (error) => {
    console.error(`${paint('31', `[${task.name}]`)} failed to start: ${error.message}`);
    process.exitCode = 1;
    shutdown();
  });

  child.on('exit', (code, signal) => {
    // During shutdown, a child exiting is the expected outcome, not a failure.
    if (shuttingDown) {
      return;
    }

    const reason = signal ? `signal ${signal}` : `code ${code}`;
    console.error(`\n${paint('31', `[${task.name}]`)} exited (${reason}); stopping the other.\n`);
    process.exitCode = code ?? 1;
    shutdown();
  });

  children.push(child);
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => shutdown(signal));
}
