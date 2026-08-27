#!/usr/bin/env node
/**
 * Responsive regression guard.
 *
 * Serves the production bundle, then drives headless Chrome across the device
 * matrix and fails if any page can be scrolled sideways, or if any element
 * escapes the viewport. Horizontal overflow is invisible in unit tests and
 * easy to reintroduce with a single stray utility class, so it is checked here.
 *
 *   npm run audit:responsive
 *
 * Set CHROME_PATH to override Chrome's location.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { join, extname, resolve } from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';

const ROOT = resolve('dist/fsautomotive/browser');
const PORT = 4500 + Math.floor(Math.random() * 400);
const CDP_PORT = 9400 + Math.floor(Math.random() * 400);
// Default sweep is the representative set, so this stays fast enough to sit
// inside `npm run verify`. AUDIT_FULL=1 runs every width and route before a
// release; AUDIT_WIDTHS / AUDIT_PAGES override either explicitly.
const FULL = process.env['AUDIT_FULL'] === '1';

const PAGES =
  process.env['AUDIT_PAGES']?.split(',') ??
  (FULL
    ? ['/', '/servicos', '/sobre-nos', '/contactos', '/rota-inexistente']
    : ['/', '/servicos', '/contactos']);

const WIDTHS =
  process.env['AUDIT_WIDTHS']?.split(',').map(Number) ??
  (FULL ? [320, 360, 375, 414, 768, 1024, 1280, 1920, 2560] : [320, 375, 768, 1280, 1920]);

const CHROME_CANDIDATES = [
  process.env['CHROME_PATH'],
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain',
  '.xml': 'application/xml',
  '.webmanifest': 'application/manifest+json',
};

function serve() {
  const server = createServer(async (req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    let file = join(ROOT, url);
    try {
      if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
    } catch {
      file = join(ROOT, 'index.html'); // SPA fallback, as on the host
    }
    try {
      res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' });
      res.end(await readFile(file));
    } catch {
      res.writeHead(404).end();
    }
  });
  return new Promise((ok, fail) => {
    server.once('error', (err) =>
      fail(
        err.code === 'EADDRINUSE'
          ? new Error(`port ${PORT} is already in use — a previous audit may still be running`)
          : err,
      ),
    );
    server.listen(PORT, () => ok(server));
  });
}

async function findChrome() {
  for (const candidate of CHROME_CANDIDATES) {
    try {
      await stat(candidate);
      return candidate;
    } catch {}
  }
  throw new Error(`Chrome not found. Set CHROME_PATH. Tried:\n  ${CHROME_CANDIDATES.join('\n  ')}`);
}

const PROBE = `(() => {
  const de = document.documentElement;
  const vw = de.clientWidth;
  const escapees = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (r.right <= vw + 1 && r.left >= -1) continue;
    // Slides parked outside a genuinely clipped track are expected. Stop the
    // walk before <body>/<html>: those carry the deliberate root overflow
    // guard, and honouring it here would mask every real offender.
    let p = el, clipped = false;
    while ((p = p.parentElement) && p !== document.body && p !== document.documentElement) {
      const o = getComputedStyle(p);
      if (o.overflowX === 'hidden' || o.overflowX === 'clip' || o.overflowX === 'auto') { clipped = true; break; }
    }
    if (clipped) continue;
    escapees.push(el.tagName.toLowerCase() + '.' + String(el.className || '').trim().split(/\\s+/).slice(0, 3).join('.') +
                  ' [right=' + Math.round(r.right) + ' w=' + Math.round(r.width) + ']');
  }
  return JSON.stringify({ vw, scrollW: de.scrollWidth, escapees: escapees.slice(0, 5) });
})()`;

const server = await serve();
if (process.env['AUDIT_DEBUG']) console.error('[audit] static server listening');
const profile = await mkdtemp(join(tmpdir(), 'fsa-audit-'));
const chrome = spawn(
  await findChrome(),
  [
    '--headless',
    '--disable-gpu',
    '--no-sandbox',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${profile}`,
    'about:blank',
  ],
  { stdio: 'ignore' },
);

const withTimeout = (promise, ms, what) =>
  Promise.race([
    promise,
    new Promise((_, fail) =>
      setTimeout(() => fail(new Error(`timed out after ${ms}ms: ${what}`)), ms),
    ),
  ]);

const failures = [];
try {
  let target;
  for (let i = 0; i < 40 && !target; i++) {
    try {
      target = await (
        await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?about:blank`, { method: 'PUT' })
      ).json();
    } catch {
      await new Promise((r) => setTimeout(r, 400));
    }
  }
  if (!target) throw new Error('could not reach Chrome DevTools Protocol');
  if (process.env['AUDIT_DEBUG']) console.error('[audit] CDP target acquired');

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  const send = (method, params = {}) =>
    new Promise((ok) => {
      const i = ++id;
      pending.set(i, ok);
      ws.send(JSON.stringify({ id: i, method, params }));
    });
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) {
      pending.get(m.id)(m.result);
      pending.delete(m.id);
    }
  });
  await withTimeout(
    new Promise((ok, fail) => {
      ws.addEventListener('open', ok);
      ws.addEventListener('error', () => fail(new Error('DevTools websocket refused')));
    }),
    15_000,
    'DevTools websocket handshake',
  );
  if (process.env['AUDIT_DEBUG']) console.error('[audit] websocket open');
  await send('Page.enable');
  await send('Network.enable');
  // Block the webfont CDN: it makes each navigation wait on the network, and
  // fallback metrics are the wider, more conservative case to measure anyway.
  await send('Network.setBlockedURLs', {
    urls: ['*fonts.googleapis.com*', '*fonts.gstatic.com*'],
  });
  if (process.env['AUDIT_DEBUG']) console.error('[audit] Page.enable done');

  for (const width of WIDTHS) {
    process.stdout.write(`  ${width}px `);
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: width < 1024,
    });
    for (const page of PAGES) {
      await send('Page.navigate', { url: `http://localhost:${PORT}${page}` });
      await new Promise((r) => setTimeout(r, 1200));
      await send('Runtime.evaluate', {
        expression: `document.querySelectorAll('.reveal').forEach(e => e.classList.add('reveal-visible'))`,
      });
      await new Promise((r) => setTimeout(r, 250));
      const { result } = await send('Runtime.evaluate', { expression: PROBE, returnByValue: true });
      const { vw, scrollW, escapees } = JSON.parse(result.value);

      if (scrollW > vw + 1)
        failures.push(`${width}px ${page}: page scrolls sideways (scrollWidth ${scrollW} > ${vw})`);
      for (const e of escapees)
        failures.push(`${width}px ${page}: element escapes viewport — ${e}`);
    }
  }
  ws.close();
} finally {
  // Wait for Chrome to actually exit before removing its profile, otherwise
  // the delete races its shutdown writes and throws — masking the real result.
  chrome.kill();
  await new Promise((done) => (chrome.exitCode === null ? chrome.once('exit', done) : done()));
  server.closeAllConnections?.();
  server.close();
  await rm(profile, { recursive: true, force: true }).catch(() => {});
}

if (failures.length) {
  console.error(`\n✘ responsive audit failed (${failures.length})\n`);
  for (const f of failures) console.error('  ' + f);
  process.exit(1);
}
console.log(
  `✔ responsive audit passed — ${WIDTHS.length} widths × ${PAGES.length} pages, no horizontal overflow`,
);
