/**
 * Purpose: Date precision and readable labels for the timeline.
 * Scope: Validates real month/day dates, indexes months, and labels browsing periods without timezones.
 * Does NOT belong: Personal dates (src/data/timeline.ts) or DOM interactions.
 */
export type DateDetail = 'years' | 'quarters' | 'months';
export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export function isTimelineDate(value: string): boolean {
  if (!/^\d{4}-(?:0[1-9]|1[0-2])(?:-(?:0[1-9]|[12]\d|3[01]))?$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (day === undefined) return true;
  return new Date(Date.UTC(year!, month!, 0)).getUTCDate() >= day;
}

export function monthIndex(value: string): number {
  const [year, month] = value.split('-').map(Number);
  return year! * 12 + month! - 1;
}

export function monthAt(index: number): string {
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`;
}

export function dateLabel(value: string, short = false): string {
  const [year, month] = value.split('-').map(Number);
  const name = MONTHS[month! - 1]!;
  return `${short ? name.slice(0, 3) : name} ${year}`;
}

export function fullDateLabel(value: string): string {
  const day = value.split('-')[2];
  if (!day) return dateLabel(value);
  const [month, year] = [dateLabel(value).split(' ')[0], value.slice(0, 4)];
  return `${month} ${Number(day)}, ${year}`;
}

export function periodKey(date: string, detail: DateDetail): string {
  if (detail === 'years') return date.slice(0, 4);
  if (detail === 'quarters')
    return `${date.slice(0, 4)}-Q${Math.floor((monthIndex(date) % 12) / 3) + 1}`;
  return date.slice(0, 7);
}

export function periodLabel(date: string, detail: DateDetail): string {
  if (detail === 'years') return date.slice(0, 4);
  if (detail === 'quarters')
    return `Q${Math.floor((monthIndex(date) % 12) / 3) + 1} ${date.slice(0, 4)}`;
  return dateLabel(date);
}
