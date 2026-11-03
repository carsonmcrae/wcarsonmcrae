/**
 * Purpose: A tiny, safe formatter for the inline markdown used in content strings.
 * Scope: Escapes all HTML, then renders [links](/path/ or https://…), *emphasis*, and **strong**
 *   text; internal links get the base path and external links get a screen-reader note.
 * Constraints: Only http(s) and mailto links are allowed, and every pattern matches in linear
 *   time.
 * Does NOT belong: Block-level markdown, or the content itself (src/data).
 */
import { isExternalUrl, withBase } from './paths';

/**
 * A deliberately tiny formatter for content strings. It escapes all HTML,
 * then supports exactly three things:
 *
 *   [link text](/internal/ or https://external)
 *   *emphasis*
 *   **strong**
 *
 * Internal links get the deployment base path. External links are marked so
 * screen readers announce them, and only http(s) and mailto links are allowed.
 */

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(value: string): string {
  // The pattern only matches keys of ESCAPES, so the lookup always succeeds.
  return value.replace(/[&<>"']/g, (character) => ESCAPES[character] as string);
}

const SAFE_PROTOCOL = /^(?:https?:|mailto:)/i;
// Link text cannot contain brackets and URLs cannot contain parentheses or spaces, which keeps
// matching linear on any input.
const LINK = /\[([^[\]]+)\]\(([^()\s]+)\)/g;

function renderLink(text: string, href: string, base: string | undefined): string {
  const external = isExternalUrl(href);
  if (external && !SAFE_PROTOCOL.test(href)) {
    return text;
  }
  const target = external ? href : withBase(href, base);
  const marker = external ? '<span class="visually-hidden"> (external site)</span>' : '';
  return `<a href="${escapeHtml(target)}"${external ? ' rel="noopener"' : ''}>${text}${marker}</a>`;
}

export function renderInline(source: string, base?: string): string {
  let html = escapeHtml(source);
  // Links: the URL part has already been escaped, so decode quotes we just encoded
  // only for matching; the final attribute value is re-escaped in renderLink.
  html = html.replace(LINK, (_match, text: string, rawHref: string) => {
    const href = rawHref.replaceAll('&amp;', '&');
    return renderLink(text, href, base);
  });
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1<em>$2</em>');
  return html;
}

/** Plain text version of an inline markdown string (for metadata and alt text). */
export function toPlainText(source: string): string {
  return source
    .replace(LINK, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1');
}
