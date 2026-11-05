/**
 * Purpose: Unit tests for src/lib/inline-markdown.ts.
 * Scope: Escaping, links with the base path, external link notes, unsafe protocols, emphasis,
 *   injection attempts, and linear-time matching on hostile input.
 * Does NOT belong: Checks on the content itself (tests/unit/content.test.ts).
 */
import { describe, expect, it } from 'vitest';
import { escapeHtml, renderInline, toPlainText } from '../../src/lib/inline-markdown';

describe('escapeHtml', () => {
  it('escapes every HTML-significant character', () => {
    expect(escapeHtml(`<a href="x">Tom & Jerry's</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&#39;s&lt;/a&gt;',
    );
  });
});

describe('renderInline', () => {
  it('returns plain text escaped', () => {
    expect(renderInline('Nicole & Carson <3')).toBe('Nicole &amp; Carson &lt;3');
  });

  it('renders internal links with the base path', () => {
    expect(renderInline('See [my work](/work/#projects).', '/wcarsonmcrae/')).toBe(
      'See <a href="/wcarsonmcrae/work/#projects">my work</a>.',
    );
    expect(renderInline('[About](/about/)', '/')).toBe('<a href="/about/">About</a>');
  });

  it('marks external links for screen readers', () => {
    expect(renderInline('[TTSNative](https://ttsnative.com)')).toBe(
      '<a href="https://ttsnative.com" target="_blank" rel="noopener noreferrer">TTSNative<span class="visually-hidden"> (external site, opens in a new tab)</span></a>',
    );
  });

  it('keeps query strings intact', () => {
    expect(renderInline('[x](https://example.com/?a=1&b=2)')).toContain(
      'href="https://example.com/?a=1&amp;b=2"',
    );
  });

  it('refuses unsafe link protocols', () => {
    expect(renderInline('[click](javascript:alert)')).toBe('click');
    expect(renderInline('[data](data:text/html,hi)')).toBe('data');
    expect(renderInline('[click](javascript:alert(1))')).not.toContain('href');
  });

  it('renders emphasis and strong text', () => {
    expect(renderInline('a **bold** and *quiet* claim')).toBe(
      'a <strong>bold</strong> and <em>quiet</em> claim',
    );
    expect(renderInline('*start*')).toBe('<em>start</em>');
  });

  it('stays fast on hostile input', () => {
    const started = performance.now();
    renderInline(`${'['.repeat(50_000)}x](${'('.repeat(50_000)}`);
    expect(performance.now() - started).toBeLessThan(500);
  });

  it('cannot be used to inject markup', () => {
    expect(renderInline('[<img src=x onerror=alert(1)>](/about/)', '/')).toBe(
      '<a href="/about/">&lt;img src=x onerror=alert(1)&gt;</a>',
    );
  });
});

describe('toPlainText', () => {
  it('removes formatting but keeps the words', () => {
    expect(toPlainText('Built [PicPledge](/work/) and **TTSNative**, *on weekends*.')).toBe(
      'Built PicPledge and TTSNative, on weekends.',
    );
  });
});
