/**
 * Purpose: The browser entry point for the site's progressive enhancements.
 * Scope: Starts the theme toggle, small-screen menu, image fallbacks, and achievement notice, and
 *   greets curious visitors in the console.
 * Constraints: Everything here is optional: every page is readable and navigable without
 *   JavaScript.
 * Does NOT belong: The behaviors themselves, which live (and are tested) in src/lib.
 */
import { initAchievements } from '../lib/achievements';
import { initImageFallbacks } from '../lib/image-fallbacks';
import { initMenu } from '../lib/menu';
import { initThemeToggle } from '../lib/theme';

initThemeToggle(document, window);
initMenu(document, window);
initImageFallbacks(document);
initAchievements(document, window);
document.documentElement.dataset['siteReady'] = 'true';

console.info(
  '%cHey, you opened the console.%c\nThat makes us the same kind of curious. The source for this site is on GitHub: https://github.com/carsonmcrae/wcarsonmcrae',
  'font-weight: 700; font-size: 14px;',
  'font-weight: 400;',
);
