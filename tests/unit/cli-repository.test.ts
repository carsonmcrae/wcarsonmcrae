/**
 * Purpose: Exercise repository/release CLI composition without changing Git or launching builds.
 * Scope: Real policy gates, manifest and Git context, diagnostics, and subpath command failures.
 * Does NOT belong: Simulated success coverage or tests of filesystem/child-process libraries.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { basename } from 'node:path';
import { currentVersion } from '../../src/data/releases';

const io = vi.hoisted(() => ({
  read: vi.fn(),
  stat: vi.fn(),
  git: vi.fn(),
  spawn: vi.fn(),
  files: vi.fn(),
}));
vi.mock('node:fs', () => ({ readFileSync: io.read, statSync: io.stat }));
vi.mock('node:child_process', () => ({ execFileSync: io.git, spawnSync: io.spawn }));
vi.mock('../../scripts/lib/repo-files.ts', () => ({ listRepoFiles: io.files }));

const previousExitCode = process.exitCode;
beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.stubEnv('RELEASE_BASE_SHA', '');
  vi.stubEnv('RELEASE_TAG', '');
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  process.exitCode = undefined;
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  process.exitCode = previousExitCode;
});

describe('release CLI', () => {
  const lock = (version = currentVersion) =>
    JSON.stringify({ version, packages: { '': { version } } });
  it('checks actual release notes against both lock versions and reports missing comparison context', async () => {
    io.read.mockReturnValue(lock());
    await import('../../scripts/check-release.ts');
    expect(io.read).toHaveBeenCalledWith(expect.any(URL), 'utf8');
    expect(io.git).not.toHaveBeenCalled();
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining(`Release ${currentVersion}: manifests`),
    );
    expect(console.info).toHaveBeenCalledWith(expect.stringContaining('No RELEASE_BASE_SHA'));
    expect(process.exitCode).toBeUndefined();
  });
  it('includes working and untracked changes while retaining the initial release bootstrap', async () => {
    vi.stubEnv('RELEASE_BASE_SHA', 'base-sha');
    vi.stubEnv('RELEASE_TAG', `v${currentVersion}`);
    io.read.mockReturnValue(lock());
    io.git.mockImplementation((_command, args: string[]) => {
      if (args[0] === 'ls-tree') return '';
      if (args[0] === 'diff') return 'M\tpackage.json\n';
      return 'docs/architecture/new.md\n';
    });
    await import('../../scripts/check-release.ts');
    expect(io.git.mock.calls.map((call) => call[1][0])).toEqual([
      'ls-tree',
      'ls-tree',
      'diff',
      'ls-files',
    ]);
    expect(console.error).not.toHaveBeenCalled();
    expect(process.exitCode).toBeUndefined();
  });
  it('fails an established product change without a version bump and rejects mismatched tags', async () => {
    vi.stubEnv('RELEASE_BASE_SHA', 'reviewed-base');
    vi.stubEnv('RELEASE_TAG', 'v9.0.0');
    io.read.mockReturnValue(lock('0.9.0'));
    io.git.mockImplementation((_command, args: string[]) => {
      if (args[0] === 'ls-tree') return 'src/data/releases.ts';
      if (args[0] === 'show') return JSON.stringify({ version: currentVersion });
      if (args[0] === 'diff') return 'M\tsrc/pages/index.astro\n';
      return '';
    });
    await import('../../scripts/check-release.ts');
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('lock.json versions'));
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining(`Release tag must be v${currentVersion}`),
    );
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Product changes require'));
    expect(process.exitCode).toBe(1);
  });
  it('propagates an unavailable comparison base instead of skipping policy', async () => {
    vi.stubEnv('RELEASE_BASE_SHA', 'missing-base');
    io.read.mockReturnValue(lock());
    io.git.mockImplementation(() => {
      throw new Error('Unknown revision');
    });
    await expect(import('../../scripts/check-release.ts')).rejects.toThrow('Unknown revision');
    expect(console.info).not.toHaveBeenCalled();
  });
  it('passes the exact approved base to the real policy for the one-time same-version update', async () => {
    const base = '5874a27997343690817a005be93f67301df14ca9';
    vi.stubEnv('RELEASE_BASE_SHA', base);
    io.read.mockReturnValue(lock());
    io.git.mockImplementation((_command, args: string[]) => {
      if (args[0] === 'ls-tree') return 'src/data/releases.ts';
      if (args[0] === 'show') return JSON.stringify({ version: '1.1.0' });
      if (args[0] === 'diff') return 'M\tsrc/styles/profile.css\n';
      return 'tests/unit/compact-ui.test.ts\n';
    });
    await import('../../scripts/check-release.ts');
    expect(io.git).toHaveBeenCalledWith(
      'git',
      ['diff', '--name-status', '--no-renames', base, '--'],
      expect.any(Object),
    );
    expect(console.error).not.toHaveBeenCalled();
    expect(process.exitCode).toBeUndefined();
  });
  it('rejects removing an image identity accepted by the reviewed base', async () => {
    vi.stubEnv('RELEASE_BASE_SHA', 'reviewed-base');
    io.read.mockReturnValue(lock());
    io.git.mockImplementation((_command, args: string[]) => {
      if (args[0] === 'ls-tree') return args[3];
      if (args[0] === 'show' && args[1]?.endsWith('published-image-reactions.json'))
        return JSON.stringify(['photo-retired-fixture']);
      if (args[0] === 'show') return JSON.stringify({ version: '1.0.0' });
      return '';
    });
    await import('../../scripts/check-release.ts');
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('photo-retired-fixture'));
    expect(process.exitCode).toBe(1);
  });
});

describe('repository CLI', () => {
  const header =
    '/**\n * Purpose: Example.\n * Scope: Example.\n * Does NOT belong: Elsewhere.\n * Copyright (c) 2026 William Carson McRae. All rights reserved.\n * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted\n */\n';
  it('reads text and asset sizes, skips removed files, and reports every successful gate', async () => {
    io.files.mockReturnValue(['src/example.ts', 'public/icon.png', 'gone.ts']);
    io.stat.mockImplementation((path: string) =>
      basename(path) === 'gone.ts' ? undefined : { size: 100 },
    );
    io.read.mockReturnValue(header);
    await import('../../scripts/check-repo.ts');
    expect(io.read).toHaveBeenCalledTimes(1);
    expect(io.read.mock.calls[0]![0]).toContain('example.ts');
    expect(vi.mocked(console.info).mock.calls.map(([message]) => message)).toEqual([
      '✓ Line limit: 1 files checked',
      '✓ File headers: 1 files checked',
      '✓ Ownership notices: 1 files checked',
      '✓ Asset sizes: 1 files checked',
      '✓ Dependency boundaries: 1 files checked',
    ]);
    expect(console.warn).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(0);
  });
  it('prints meaningful warnings and failures without losing a later gate result', async () => {
    io.files.mockReturnValue(['large.ts', 'oversize.ts', 'bad.css', 'public/huge.png']);
    io.stat.mockReturnValue({ size: 300 * 1024 });
    io.read.mockImplementation((path: string) => {
      if (basename(path) === 'large.ts') return header + 'x\n'.repeat(405);
      if (basename(path) === 'oversize.ts') return header + 'x\n'.repeat(501);
      return 'body {}';
    });
    await import('../../scripts/check-repo.ts');
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('large.ts:'));
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('oversize.ts:'));
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('bad.css: does not open'));
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('preserve the copyright'));
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('256 KB cap'));
    expect(vi.mocked(console.info).mock.calls.map(([message]) => message)).toEqual([
      '✗ Line limit: 3 files checked',
      '✗ File headers: 3 files checked',
      '✗ Ownership notices: 3 files checked',
      '✗ Asset sizes: 1 files checked',
      '✓ Dependency boundaries: 0 files checked',
    ]);
    expect(process.exitCode).toBe(1);
  });
  it('fails the CLI when a browser entry reaches the Worker-only database service', async () => {
    io.files.mockReturnValue(['src/scripts/site.ts', 'src/lib/reaction-service.ts']);
    io.stat.mockReturnValue({ size: 100 });
    io.read.mockImplementation(
      (path: string) =>
        header + (basename(path) === 'site.ts' ? "import '../lib/reaction-service';" : ''),
    );
    await import('../../scripts/check-repo.ts');
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('src/scripts/site.ts -> src/lib/reaction-service.ts'),
    );
    expect(console.info).toHaveBeenCalledWith('✗ Dependency boundaries: 2 files checked');
    expect(process.exitCode).toBe(1);
  });
  it('fails rather than claiming success when a listed file cannot be read', async () => {
    io.files.mockReturnValue(['unreadable.ts']);
    io.stat.mockReturnValue({ size: 100 });
    io.read.mockImplementation(() => {
      throw new Error('Permission denied');
    });
    await expect(import('../../scripts/check-repo.ts')).rejects.toThrow('Permission denied');
    expect(console.info).not.toHaveBeenCalled();
  });
});

describe('subpath build CLI', () => {
  function platform(name: string) {
    vi.stubGlobal('process', { ...process, platform: name });
  }
  it.each(['win32', 'linux'])(
    'builds then validates the same project-path output on %s',
    async (name) => {
      platform(name);
      io.spawn.mockReturnValue({ status: 0 });
      await import('../../scripts/build-subpath.ts');
      expect(io.spawn.mock.calls.map((call) => call[1])).toEqual([
        ['exec', '--', 'astro', 'build', '--outDir', 'dist-subpath'],
        ['exec', '--', 'vitest', 'run', '--config', 'vitest.build.config.ts'],
      ]);
      expect(io.spawn).toHaveBeenNthCalledWith(2, 'npm', expect.any(Array), {
        env: expect.objectContaining({
          SITE_URL: 'https://carsonmcrae.github.io',
          BASE_PATH: '/wcarsonmcrae',
          DIST_DIR: 'dist-subpath',
        }),
        stdio: 'inherit',
        shell: name === 'win32',
      });
    },
  );
  it.each([7, null])('stops immediately on a failed build with status %s', async (status) => {
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('Stopped');
    });
    io.spawn.mockReturnValue({ status });
    await expect(import('../../scripts/build-subpath.ts')).rejects.toThrow('Stopped');
    expect(exit).toHaveBeenCalledWith(status ?? 1);
    expect(io.spawn).toHaveBeenCalledTimes(1);
  });
  it('propagates a built-site validation failure after a successful build', async () => {
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('Stopped');
    });
    io.spawn.mockReturnValueOnce({ status: 0 }).mockReturnValueOnce({ status: 3 });
    await expect(import('../../scripts/build-subpath.ts')).rejects.toThrow('Stopped');
    expect(exit).toHaveBeenCalledWith(3);
    expect(io.spawn).toHaveBeenCalledTimes(2);
  });
});
