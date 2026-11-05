/**
 * Purpose: Cache licensed UI glyph definitions once instead of repeating them in every document.
 * Scope: A static same-origin SVG sprite with trusted Phosphor paths.
 * Does NOT belong: User-supplied SVG, scripts, or branded assets.
 */
import { icons, iconBody } from '../lib/icons';
export function GET() {
  return new Response(
    `<svg xmlns="http://www.w3.org/2000/svg">${Object.entries(icons)
      .map(
        ([name, svg]) =>
          `<symbol id="icon-${name}" viewBox="0 0 256 256">${iconBody(svg)}</symbol>`,
      )
      .join('')}</svg>`,
    { headers: { 'Content-Type': 'image/svg+xml' } },
  );
}
