/**
 * Purpose: Keep keyboard access to the viewer caption compatible with the strict accessibility lint policy.
 * Scope: Real ESLint configuration, the one component/region allowance, and rejected unrelated tab stops.
 * Does NOT belong: Disabling accessibility rules or replacing browser scroll and focus verification.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { describe, expect, it } from 'vitest';
import { ESLint } from 'eslint';
import configuration from '../../eslint.config.js';

// Use the actual exported policy through ESLint, so its executable configuration is covered too.
const lint = new ESLint({ overrideConfigFile: true, overrideConfig: configuration });
const viewer = 'src/components/PhotoViewer.astro';
const rule = 'astro/jsx-a11y/no-noninteractive-tabindex';

async function messages(source: string, filePath = viewer) {
  const [result] = await lint.lintText(source, { filePath });
  expect(result!.messages.filter((message) => message.fatal)).toEqual([]);
  return result!.messages;
}

describe('focusable viewer caption region', () => {
  it('accepts the actual named region in its owning component while retaining error severity', async () => {
    expect(
      await messages('<div role="region" aria-label="Photo caption" tabindex="0">Caption</div>'),
    ).toEqual([]);
    const policy = await lint.calculateConfigForFile(viewer);
    expect(policy.rules[rule]).toEqual([2, { roles: ['region'], tags: [] }]);
  });

  it.each(['0', '1'])(
    'rejects a plain noninteractive tab stop with tabindex=%s in the viewer',
    async (index) => {
      const diagnostics = await messages(`<div tabindex="${index}">Static text</div>`);
      expect(diagnostics).toContainEqual(expect.objectContaining({ ruleId: rule, severity: 2 }));
    },
  );

  it('keeps positive tab order prohibited even on the allowed viewer region', async () => {
    expect(
      await messages('<div role="region" aria-label="Photo caption" tabindex="1">Caption</div>'),
    ).toContainEqual(
      expect.objectContaining({ ruleId: 'astro/jsx-a11y/tabindex-no-positive', severity: 2 }),
    );
  });

  it('retains the strict region rule in every other component', async () => {
    const diagnostics = await messages(
      '<div role="region" aria-label="Other region" tabindex="0">Text</div>',
      'src/components/Other.astro',
    );
    expect(diagnostics).toContainEqual(expect.objectContaining({ ruleId: rule, severity: 2 }));
  });
});
