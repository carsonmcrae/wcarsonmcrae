/**
 * Purpose: Protect the deployment/runtime boundaries with adversarial import graphs.
 * Scope: Erased types, transitive/deferred dependencies, environment capabilities, and upward dependencies.
 * Does NOT belong: Third-party bundling or a second TypeScript syntax checker.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkDependencyBoundaries } from '../../scripts/lib/dependency-boundaries';
import { listRepoFiles } from '../../scripts/lib/repo-files';

const files = (sources: Record<string, string>) =>
  Object.entries(sources).map(([path, text]) => ({ path, text }));
const check = (sources: Record<string, string>) => checkDependencyBoundaries(files(sources));

describe('runtime dependency boundaries', () => {
  it('accepts the current source graph and keeps independent public deployment units', () => {
    const root = join(import.meta.dirname, '../..');
    const sources = listRepoFiles(root)
      .filter((path) => /^(?:src|scripts|workers)\/.+\.(?:[cm]?[jt]s|astro)$/.test(path))
      .map((path) => ({ path, text: readFileSync(join(root, path), 'utf8') }));
    const report = checkDependencyBoundaries(sources);
    expect(report.checked).toBeGreaterThan(40);
    expect(report.errors).toEqual([]);
    expect(report.warnings).toEqual([]);
  });

  it('follows literal imports and re-exports, terminates cycles, and ignores erased types', () => {
    const report = check({
      'src/scripts/site.ts': `
        import defaultValue from 'safe-package';
        import * as helpers from '../lib/shared';
        import { value, type Model } from '../lib/shared';
        import type { Service } from '../lib/reaction-service';
        import { type Service } from '../lib/reaction-service';
        import '../lib/shared';
        void import('../lib/collection');
        void import('../lib/plain.js');
        void import('../lib/module.mts');
        void import('../lib/module.mjs');
      `,
      'src/lib/shared.ts': `
        export { value } from './collection';
        export type { Service } from './reaction-service';
        export { type Service } from './reaction-service';
        export {} from './reaction-service';
        export * as namespace from 'safe-package';
        export { value };
        const object = { window: false }; object.window;
        function sample() { return new.target.glob; }
      `,
      'src/lib/collection/index.ts': "export * from '../shared';",
      'src/lib/plain.js': 'export const value = 1;',
      'src/lib/module.mts': 'export const value = 2;',
      'src/lib/module.mjs': 'export const value = 3;',
      'src/lib/reaction-service.ts': 'export interface Service {}',
      'src/env.d.ts': 'import "node:fs";',
      'README.md': 'This is not a JavaScript import graph.',
    });
    expect(report.errors).toEqual([]);
    expect(report.checked).toBe(7);
  });

  it('reports the full deferred chain when browser code reaches the database service', () => {
    const report = check({
      'src/scripts/site.ts': "void import('../lib/bridge');",
      'src/lib/bridge.ts': "export * from './reaction-service';",
      'src/lib/reaction-service.ts': 'export const secretBinding = true;',
    });
    expect(report.errors).toEqual([
      expect.stringContaining(
        'src/scripts/site.ts -> src/lib/bridge.ts -> src/lib/reaction-service.ts',
      ),
    ]);
  });

  it('treats TypeScript deferred imports as runtime dependencies rather than erased types', () => {
    expect(
      check({
        'src/scripts/site.ts': "import defer * as service from '../lib/reaction-service';",
        'src/lib/reaction-service.ts': 'export const database = true;',
      }).errors,
    ).toEqual([
      expect.stringContaining('the reaction database service belongs only in the Worker graph'),
    ]);
  });

  it('checks component browser scripts without confusing server frontmatter or self-closing script tags', () => {
    const report = check({
      'src/components/Example.astro': `---
import fs from 'node:fs';
---
<script is:inline set:html={bootstrap} />
<scripture>ordinary markup</scripture>
<script type="module">import '../lib/reaction-service';</script>
<script>import 'node:fs';</script>`,
      'src/lib/reaction-service.ts': 'export const database = true;',
      'src/components/Empty.astro': '<p>No browser script.</p>',
      'src/components/IncompleteOpen.astro': '<script',
      'src/components/IncompleteBody.astro': '<script>missing close',
      'src/components/SelfClosing.astro': '<script src="/known.js" />',
    });
    expect(report.errors).toEqual([
      expect.stringContaining('Example.astro#script-1 -> src/lib/reaction-service.ts'),
      expect.stringContaining('Example.astro#script-2 -> node:fs'),
    ]);
  });

  it.each([
    ['import fs from "node:fs";', 'Node built-ins'],
    ['import fs from "fs";', 'Node built-ins'],
    ['import { getImage } from "astro:assets";', 'Astro build APIs'],
    ['const photos = import.meta.glob("./*.jpg");', 'site-build capability'],
    ['void import(chosenModule);', 'literal ES module imports'],
    ['void import();', 'literal ES module imports'],
    ['require("./chosenModule");', 'literal ES module imports'],
  ])('rejects unsupported browser loading: %s', (text, message) => {
    expect(check({ 'src/scripts/site.ts': text }).errors).toEqual([
      expect.stringContaining(message),
    ]);
  });

  it('rejects deployment adapters and repository tooling in browser dependency graphs', () => {
    const report = check({
      'src/scripts/site.ts':
        "import '../../workers/reactions/src/index'; import '../../scripts/lib/tool';",
      'workers/reactions/src/index.ts': 'export default {};',
      'scripts/lib/tool.ts': 'export const tool = true;',
    });
    expect(report.errors.some((error) => error.includes('belongs only in the Worker graph'))).toBe(
      true,
    );
    expect(report.errors.some((error) => error.includes('repository tooling cannot enter'))).toBe(
      true,
    );
  });

  it.each([
    'export function mount(doc: Document) {}',
    'export function mount(win: Window) {}',
    'export function mount(node: HTMLInputElement) {}',
    'document.querySelector("main");',
    'window.scrollTo(0, 0);',
    'localStorage.getItem("preference");',
    'globalThis.document.querySelector("main");',
    'globalThis.window.scrollTo(0, 0);',
    'globalThis.localStorage.getItem("preference");',
  ])('keeps a DOM-capability dependency out of Worker code: %s', (text) => {
    const report = check({
      'workers/reactions/src/index.ts': "import '../../../src/lib/shared';",
      'src/lib/shared.ts': text,
    });
    expect(report.errors).toEqual([
      expect.stringContaining('DOM/browser controllers cannot enter the Worker graph'),
    ]);
  });

  it('does not confuse declared object members with browser globals', () => {
    expect(
      check({
        'workers/reactions/src/index.ts': "import '../../../src/lib/config';",
        'src/lib/config.ts': `
        interface Options { document: string; }
        class Config { window = false; sessionStorage() {} }
        const config = { localStorage: null };
        const value = config.localStorage;
      `,
      }).errors,
    ).toEqual([]);
  });

  it('keeps entry adapters out of both Worker graphs and their lower-level libraries', () => {
    const report = check({
      'workers/reactions/src/index.ts': "import '../../../src/scripts/site';",
      'src/scripts/site.ts': 'export const start = true;',
      'src/lib/shared.ts': "import '../scripts/site';",
      'scripts/lib/policy.ts': "import '../check-repo';",
      'scripts/check-repo.ts': 'export const check = true;',
    });
    expect(
      report.errors.some((error) => error.includes('DOM/browser controllers cannot enter')),
    ).toBe(true);
    expect(
      report.errors.some((error) =>
        error.includes('behavior libraries cannot depend on browser entry points'),
      ),
    ).toBe(true);
    expect(
      report.errors.some((error) =>
        error.includes('CLI policy libraries cannot depend on executable entry points'),
      ),
    ).toBe(true);
  });
});
