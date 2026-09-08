#!/usr/bin/env node
/**
 * Turns a password into the hash that goes in the account list.
 *
 *   npm --prefix server run hash:password
 *
 * WHY THIS EXISTS RATHER THAN A NOTE IN THE README
 * ------------------------------------------------
 * The alternative to a one-command tool is a person pasting a password into an
 * online "scrypt generator", or writing a throwaway script and leaving it in
 * the repository with the password still in it. Both happen. Both are worse
 * than the sixty lines below.
 *
 * The password is read from the terminal with echo off and never appears in an
 * argument — `ps` shows every process's arguments to every user on the machine,
 * and shell history keeps them for months.
 */
import { createInterface, type Interface } from 'node:readline';
import { stdin, stdout } from 'node:process';

import { hashPassword } from '../src/modules/auth/password.js';

/** Long enough that scrypt's cost is the attacker's problem, not the length. */
const MIN_LENGTH = 12;

/**
 * Both prompts share one readline interface, and it is closed once at the end.
 *
 * This is an interactive tool and only an interactive tool: `readline` resolves
 * no further question once stdin reaches end-of-file, so piping the password in
 * would hang on the confirmation rather than fail. `assertInteractive` below
 * refuses that case up front — and piping a password is the thing this script
 * exists to avoid anyway, since it would put the password in a file or in shell
 * history.
 */
function createPrompter() {
  const rl = createInterface({ input: stdin, output: stdout, terminal: true });
  let muted = false;

  // `terminal: true` makes readline echo what is typed. Muting its output for
  // the duration of the answer is how a password prompt stays a password
  // prompt; the question itself is written directly, so it still appears.
  const write = stdout.write.bind(stdout);
  (rl as Interface & { _writeToOutput: (text: string) => void })._writeToOutput = (
    text: string,
  ): void => {
    if (!muted) {
      write(text);
    }
  };

  return {
    async ask(question: string): Promise<string> {
      stdout.write(question);
      muted = true;

      try {
        return await new Promise<string>((resolve) => rl.question('', resolve));
      } finally {
        muted = false;
        stdout.write('\n');
      }
    },
    close(): void {
      rl.close();
    },
  };
}

/**
 * Reads both answers, then closes the terminal before anything can exit.
 *
 * `process.exit` does not run `finally` blocks, so the validation below
 * deliberately happens after the interface is closed rather than inside a
 * `try` around it.
 */
async function readPassword(): Promise<{ password: string; confirmation: string }> {
  const prompter = createPrompter();

  try {
    const password = await prompter.ask('Password: ');
    const confirmation = await prompter.ask('Confirm:  ');

    return { password, confirmation };
  } finally {
    prompter.close();
  }
}

/**
 * Refuses a non-terminal stdin, with a sentence instead of a hang.
 *
 * Without it, `echo pw | npm run hash:password` prints the first prompt and
 * then stops for ever — the confirmation can never be answered once the input
 * stream has ended. A tool that appears to freeze is one people report as
 * broken; a tool that says why is one they use correctly.
 */
function assertInteractive(): void {
  if (stdin.isTTY) {
    return;
  }

  stdout.write(
    'This command must be run in a terminal: it asks for the password twice, ' +
      'with the echo off.\nPiping it in would also put the password in a file ' +
      'or in your shell history, which is what this tool exists to avoid.\n',
  );
  process.exit(1);
}

assertInteractive();

/**
 * Says that the prompt is silent, before it is silent.
 *
 * Without this the tool looks broken: the prompt appears, you type, nothing
 * happens on screen, and the reasonable conclusion is that the command hung.
 * It is the same problem the login form solves with a reveal toggle — a person
 * typing a long password with no feedback needs to be told that is expected.
 */
stdout.write(
  'Creating a password hash.\n\n' +
    'What you type will NOT appear on screen — that is deliberate.\n' +
    'Type the password, press Enter, then type it again and press Enter.\n\n',
);

const { password, confirmation } = await readPassword();

if (password !== confirmation) {
  stdout.write('\nThe two entries do not match. Nothing was written.\n');
  process.exit(1);
}

if (password.length < MIN_LENGTH) {
  stdout.write(`\nToo short: use at least ${MIN_LENGTH} characters. Nothing was written.\n`);
  process.exit(1);
}

const hash = await hashPassword(password);

stdout.write(
  '\nAdd this account to AUTH_USERS_FILE (or AUTH_USERS):\n\n' +
    `${JSON.stringify(
      {
        email: 'nome@fsautomotive.pt',
        name: 'Nome Completo',
        role: 'ADMIN',
        passwordHash: hash,
      },
      null,
      2,
    )}\n\n` +
    'Roles: ADMIN (everything), MANAGER (reads, plus staff),\n' +
    'USER (read-only OfficeGest). Add a "permissions" array to override.\n',
);
