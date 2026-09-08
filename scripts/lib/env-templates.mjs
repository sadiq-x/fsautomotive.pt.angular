/**
 * The committed `.env.example` files must never carry a real value.
 *
 * WHY THIS IS A BUILD CHECK AND NOT A CONVENTION
 * ---------------------------------------------
 * The templates say "NEVER commit a real value" in their own headers, and a
 * live OfficeGest credential has been pasted into `server/.env.example`
 * repeatedly anyway — once reaching a commit in a public repository. The reason
 * is structural rather than careless: `.env.example` is the file an editor
 * offers when you search for `OFFICEGEST_API_KEY`, it is not gitignored so it
 * is always visible, and filling it in produces no error because **nothing
 * loads it**. The server reads `.env` and `server/.env`; the template is inert.
 *
 * So a comment cannot be the control. This is the same mechanism the repository
 * already uses for the analytics id and the auth stub: make the build refuse.
 *
 * A rotated credential costs a support ticket and an outage. A failing check
 * costs ten seconds.
 */

/** Variables whose value in a template is, by definition, a leak. */
export const SECRET_TEMPLATE_VARS = [
  'OFFICEGEST_API_KEY',
  'OFFICEGEST_PASSWORD',
  'OFFICEGEST_USERNAME',
  'OFFICEGEST_BASE_URL',
  'BACKEND_API_KEYS',
  // Signs the session cookie for the private area. Committing one would let
  // anyone who reads the repository mint a session for any account.
  'AUTH_SESSION_SECRET',
  // The inline account list: e-mail addresses and password hashes, which is a
  // credential file however it is spelled.
  'AUTH_USERS',
];

/**
 * Placeholders that are obviously not real, so a template can still show the
 * shape of a value. Compared case-insensitively against the whole value.
 */
const PLACEHOLDERS = [
  '',
  'changeme',
  'your-key-here',
  'https://your-company.officegest.com/api/v2',
  'https://your-company.officegest.com/api',
];

/** Strips surrounding quotes and whitespace, the way a dotenv reader would. */
function readValue(raw) {
  const value = raw.trim();

  if (value.length >= 2 && value[0] === value.at(-1) && (value[0] === '"' || value[0] === "'")) {
    return value.slice(1, -1).trim();
  }

  return value;
}

/**
 * Finds populated secrets in one template's contents.
 *
 * Commented-out lines are ignored: a `#` line documents, it does not configure.
 *
 * @param {string} contents Raw file contents.
 * @param {string} file Path used in the message.
 * @returns {string[]} One message per offending line; empty when the file is clean.
 */
export function findTemplateSecrets(contents, file) {
  const issues = [];

  contents.split(/\r?\n/).forEach((line, index) => {
    const match = /^\s*([A-Z_0-9]+)\s*=(.*)$/.exec(line);

    if (!match) {
      return;
    }

    const [, name, rawValue] = match;

    if (!SECRET_TEMPLATE_VARS.includes(name)) {
      return;
    }

    const value = readValue(rawValue);

    if (PLACEHOLDERS.includes(value.toLowerCase())) {
      return;
    }

    // The value itself is never echoed — that is the thing being protected.
    issues.push(
      `${file}:${index + 1} ${name} has a value. Templates are committed: ` +
        `move it to the gitignored .env and leave this empty.`,
    );
  });

  return issues;
}
