/**
 * Purpose: A temporary HTTPS certificate for production-browser verification.
 * Scope: Loopback-only test key generation using the system OpenSSL and cleanup after the runner exits.
 * Constraints: Never installs a trust root or changes the production CSP; the key stays in OS temp.
 * Does NOT belong: Production certificates, deployment secrets, or application behavior.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export function localTls() {
  const directory = mkdtempSync(join(tmpdir(), 'daysforth-e2e-'));
  const key = join(directory, 'loopback-key.pem');
  const cert = join(directory, 'loopback-cert.pem');
  const openssl =
    process.env['OPENSSL_PATH'] ??
    (process.platform === 'win32' ? 'C:/Program Files/Git/usr/bin/openssl.exe' : 'openssl');
  execFileSync(
    openssl,
    [
      'req',
      '-x509',
      '-newkey',
      'rsa:2048',
      '-nodes',
      '-keyout',
      key,
      '-out',
      cert,
      '-days',
      '2',
      '-subj',
      '/CN=localhost',
      '-addext',
      'subjectAltName=DNS:localhost,IP:127.0.0.1',
    ],
    { stdio: 'ignore' },
  );
  process.once('exit', () => {
    rmSync(key, { force: true });
    rmSync(cert, { force: true });
    rmdirSync(directory);
  });
  return { key, cert };
}
