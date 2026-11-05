/**
 * Purpose: Proportional date positions without inline style attributes.
 * Scope: Emits a static stylesheet positioning only the approved pinned-date labels.
 * Does NOT belong: Slider input handling or choosing pinned content.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { monthIndex } from './timeline-dates';
export function railStyles(
  dates: string[],
  earliest: string,
  latest: string,
  prefix = 'date-rail__label--',
): string {
  const start = monthIndex(earliest);
  const span = Math.max(1, monthIndex(latest) - start);
  return dates
    .map((date, index) => {
      const ratio = (monthIndex(date) - start) / span;
      return `.${prefix}${index} { left: calc(${(ratio * 100).toFixed(5)}% + ${(12 - ratio * 24).toFixed(5)}px); }`;
    })
    .join('\n');
}
