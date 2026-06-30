export const PERU_TIME_ZONE = 'America/Lima';

type DateInput = string | Date;

const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;

const toDate = (value: DateInput): Date => {
  if (value instanceof Date) return value;
  if (dateOnlyPattern.test(value)) return new Date(`${value}T12:00:00-05:00`);
  return new Date(value);
};

const getPart = (parts: Intl.DateTimeFormatPart[], type: string) =>
  parts.find((part) => part.type === type)?.value || '';

export const getTodayInPeru = (date = new Date()): string => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: PERU_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  return `${getPart(parts, 'year')}-${getPart(parts, 'month')}-${getPart(parts, 'day')}`;
};

export const formatDateInPeru = (
  value: DateInput,
  options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' }
): string => {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('es-PE', { timeZone: PERU_TIME_ZONE, ...options });
};

export const formatDateTimeInPeru = (
  value: DateInput,
  options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }
): string => {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('es-PE', { timeZone: PERU_TIME_ZONE, ...options });
};

export const getWeekdayInPeru = (value: DateInput, weekday: 'long' | 'short' = 'long'): string =>
  formatDateInPeru(value, { weekday });
