/**
 * Purpose: Starts the production preview over temporary loopback HTTPS for browser tests.
 * Scope: Test-only certificate generation, the Astro CLI process, and shutdown forwarding.
 * Constraints: Importing Playwright configuration must not create certificates or spawn OpenSSL.
 * Does NOT belong: Production TLS, hosting settings, or application behavior.
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { localTls } from './local-tls.ts';

const tls = localTls();
const child = spawn(
  process.execPath,
  [
    fileURLToPath(new URL('../../node_modules/astro/bin/astro.mjs', import.meta.url)),
    'preview',
    '--host',
    '127.0.0.1',
    '--port',
    process.argv[2] ?? '4323',
  ],
  {
    stdio: 'inherit',
    env: { ...process.env, E2E_TLS_KEY: tls.key, E2E_TLS_CERT: tls.cert },
  },
);
child.once('exit', (code) => process.exit(code ?? 1));
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.once(signal, () => child.kill(signal));
