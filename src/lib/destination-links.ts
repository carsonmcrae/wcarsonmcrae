/**
 * Purpose: Present standalone destinations consistently without embedding remote content.
 * Scope: Base-aware destinations, external-link behavior, and trusted YouTube host recognition.
 * Does NOT belong: Inline sentence links, fetching videos, or autoplay.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { isExternalUrl, withBase } from './paths';

export function destinationLink(href: string, base = import.meta.env.BASE_URL) {
  const external = isExternalUrl(href);
  const url = new URL(href, 'https://example.invalid');
  const youtube =
    url.protocol === 'https:' &&
    (url.hostname === 'youtu.be' ||
      url.hostname === 'youtube.com' ||
      url.hostname.endsWith('.youtube.com'));
  return {
    href: withBase(href, base),
    target: external ? '_blank' : undefined,
    rel: external ? 'noopener noreferrer' : undefined,
    external,
    icon: youtube ? ('youtube' as const) : ('link' as const),
  };
}
