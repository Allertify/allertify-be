// Helper utilities for timezone-aware date formatting without external deps

/**
 * Format a Date into ISO-like string adjusted to a specific IANA timezone.
 * Example output: 2025-08-19T15:10:21+07:00
 */
export function formatDateInTimeZone(date: Date, timeZone: string): string {
  const zoned = new Date(date.toLocaleString('en-US', { timeZone }));
  // Offset in minutes for the target timezone relative to UTC
  const offsetMinutes = Math.round((zoned.getTime() - new Date(zoned.toUTCString()).getTime()) / 60000);

  const pad = (n: number) => String(n).padStart(2, '0');

  const year = zoned.getFullYear();
  const month = pad(zoned.getMonth() + 1);
  const day = pad(zoned.getDate());
  const hour = pad(zoned.getHours());
  const minute = pad(zoned.getMinutes());
  const second = pad(zoned.getSeconds());

  const sign = offsetMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMinutes);
  const offH = pad(Math.floor(abs / 60));
  const offM = pad(abs % 60);

  return `${year}-${month}-${day}T${hour}:${minute}:${second}${sign}${offH}:${offM}`;
}

export function getDefaultTimeZone(): string {
  return process.env.DEFAULT_TIMEZONE || 'Asia/Jakarta';
}

/**
 * Returns a Date representing the UTC instant of 00:00:00 for the given date in a specific timezone.
 */
export function startOfDayUTCForTimeZone(date: Date, timeZone: string): Date {
  // Get the date as it would be in the target timezone
  const zoned = new Date(date.toLocaleString('en-US', { timeZone }));
  const year = zoned.getFullYear();
  const month = zoned.getMonth();
  const day = zoned.getDate();

  // Compute the timezone offset (in minutes) for that local date
  const offsetMinutes = Math.round((zoned.getTime() - new Date(zoned.toUTCString()).getTime()) / 60000);

  // Construct the UTC timestamp corresponding to local midnight in the target timezone
  const utcMillis = Date.UTC(year, month, day, 0, 0, 0) - offsetMinutes * 60_000;
  return new Date(utcMillis);
}


