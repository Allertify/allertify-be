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


