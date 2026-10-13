// Relative times worded like moment's fromNow() ("a few seconds ago",
// "3 hours ago"), which the Angular app used through ngx-moment.

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function duration(ms: number): string {
  const round = (unit: number) => Math.round(ms / unit);

  if (ms < 45 * SECOND) return 'a few seconds';
  if (ms < 90 * SECOND) return 'a minute';
  if (ms < 45 * MINUTE) return `${round(MINUTE)} minutes`;
  if (ms < 90 * MINUTE) return 'an hour';
  if (ms < 22 * HOUR) return `${round(HOUR)} hours`;
  if (ms < 36 * HOUR) return 'a day';
  if (ms < 26 * DAY) return `${round(DAY)} days`;
  if (ms < 45 * DAY) return 'a month';
  if (ms < 320 * DAY) return `${Math.max(round(DAY * 30.44), 2)} months`;
  if (ms < 548 * DAY) return 'a year';

  return `${Math.max(round(DAY * 365.25), 2)} years`;
}

// `timestamp` is in milliseconds. Without the suffix it reads like
// moment's fromNow(true): "5 years" instead of "5 years ago".
export function timeAgo(timestamp: number, withoutSuffix = false): string {
  const text = duration(Math.abs(Date.now() - timestamp));
  return withoutSuffix ? text : `${text} ago`;
}
