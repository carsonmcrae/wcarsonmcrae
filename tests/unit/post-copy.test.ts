/**
 * Purpose: Preserve permanent Copy destinations across canonical and project deployments.
 * Scope: Derived post URLs, cached markup overrides, clipboard success and manual fallback.
 * Does NOT belong: Save, reaction mutation or deferred module loading.
 * @vitest-environment happy-dom
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { describe, expect, it, vi } from 'vitest';
import { setup } from './post-actions-fixture';

describe('Copy', () => {
  it.each([
    ['/', 'https://canonical.test/posts/current/', 'https://canonical.test/posts/born/'],
    ['/project/', 'https://pages.test/project/', 'https://pages.test/project/posts/born/'],
    ['/', null, 'https://daysforth.com/posts/born/'],
    ['/project/', null, 'https://daysforth.com/project/posts/born/'],
  ])(
    'derives Copy from stable ID at base %s with canonical %s',
    async (base, canonical, expected) => {
      vi.stubEnv('BASE_URL', base);
      const { win, click } = setup();
      document.querySelector('[data-post-actions]')!.removeAttribute('data-post-url');
      if (canonical) {
        const link = document.createElement('link');
        link.rel = 'canonical';
        link.href = canonical;
        document.head.append(link);
      }
      click('copy');
      await vi.waitFor(() =>
        expect(win.navigator.clipboard.writeText).toHaveBeenCalledWith(expected),
      );
    },
  );
  it('preserves a legacy explicit permalink and supplies it manually when the clipboard fails', async () => {
    const { win, click, announce } = setup();
    document.querySelector<HTMLElement>('[data-post-actions]')!.dataset['postUrl'] =
      'https://legacy.test/archive/born/';
    click('copy');
    await vi.waitFor(() => expect(announce).toHaveBeenLastCalledWith('Link copied.'));
    expect(win.navigator.clipboard.writeText).toHaveBeenCalledWith(
      'https://legacy.test/archive/born/',
    );
    win.navigator.clipboard.writeText.mockRejectedValueOnce(new Error('blocked'));
    click('copy');
    await vi.waitFor(() =>
      expect(announce).toHaveBeenLastCalledWith(
        'Copy this link: https://legacy.test/archive/born/',
      ),
    );
    Object.assign(win, { navigator: {} });
    click('copy');
    await vi.waitFor(() =>
      expect(announce).toHaveBeenLastCalledWith(
        'Copy this link: https://legacy.test/archive/born/',
      ),
    );
  });
});
