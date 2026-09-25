/**
 * Safe date parsing and formatting utilities
 */

/**
 * Checks if a value is a valid Date instance
 * @param {any} d 
 * @returns {boolean}
 */
export const isValidDate = (d) => {
  return d instanceof Date && !isNaN(d.getTime());
};

/**
 * Safely parses any date value (DD/MM/YYYY, YYYY-MM-DD, ISO string, Date(y,m,d), timestamp, Date object)
 * into a valid Date object, or returns null if invalid.
 * @param {any} dateVal 
 * @returns {Date|null}
 */
export const parseToDate = (dateVal) => {
  if (!dateVal) return null;

  // Already a Date object
  if (dateVal instanceof Date) {
    return isNaN(dateVal.getTime()) ? null : dateVal;
  }

  // Numeric timestamp or Excel serial date
  if (typeof dateVal === 'number') {
    if (dateVal > 30000 && dateVal < 60000) {
      const googleEpoch = new Date(1899, 11, 30);
      return new Date(googleEpoch.getTime() + dateVal * 24 * 60 * 60 * 1000);
    }
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim();
    if (
      !trimmed ||
      trimmed === '-' ||
      trimmed.toLowerCase() === 'null' ||
      trimmed.toLowerCase() === 'undefined' ||
      trimmed.toLowerCase() === 'invalid date' ||
      trimmed.toLowerCase() === 'n/a'
    ) {
      return null;
    }

    // ISO strings with T (e.g. 2026-04-28T00:00:00.000Z)
    if (trimmed.includes('T')) {
      const d = new Date(trimmed);
      if (!isNaN(d.getTime())) return d;
    }

    // Match DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY (with optional time after)
    const ddmmyyyy = trimmed.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
    if (ddmmyyyy) {
      const day = parseInt(ddmmyyyy[1], 10);
      const month = parseInt(ddmmyyyy[2], 10) - 1; // 0-indexed month
      const year = parseInt(ddmmyyyy[3], 10);
      const hours = ddmmyyyy[4] ? parseInt(ddmmyyyy[4], 10) : 0;
      const minutes = ddmmyyyy[5] ? parseInt(ddmmyyyy[5], 10) : 0;
      const seconds = ddmmyyyy[6] ? parseInt(ddmmyyyy[6], 10) : 0;
      const d = new Date(year, month, day, hours, minutes, seconds);
      if (!isNaN(d.getTime())) return d;
    }

    // Match YYYY-MM-DD or YYYY/MM/DD (with optional time after)
    const yyyymmdd = trimmed.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})(?:[\sT]+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
    if (yyyymmdd) {
      const year = parseInt(yyyymmdd[1], 10);
      const month = parseInt(yyyymmdd[2], 10) - 1;
      const day = parseInt(yyyymmdd[3], 10);
      const hours = yyyymmdd[4] ? parseInt(yyyymmdd[4], 10) : 0;
      const minutes = yyyymmdd[5] ? parseInt(yyyymmdd[5], 10) : 0;
      const seconds = yyyymmdd[6] ? parseInt(yyyymmdd[6], 10) : 0;
      const d = new Date(year, month, day, hours, minutes, seconds);
      if (!isNaN(d.getTime())) return d;
    }

    // Match Date(year, month, day) Google Sheets format
    if (trimmed.startsWith('Date(')) {
      const match = trimmed.match(/Date\((\d+),\s*(\d+),\s*(\d+)/);
      if (match) {
        const d = new Date(parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10));
        if (!isNaN(d.getTime())) return d;
      }
    }

    // Standard JavaScript fallback parse
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) return d;
  }

  return null;
};

/**
 * Formats any date value into DD/MM/YYYY for UI display
 * @param {any} dateVal 
 * @param {string} fallback 
 * @returns {string}
 */
export const formatDateDisplay = (dateVal, fallback = '-') => {
  const d = parseToDate(dateVal);
  if (!d) return fallback;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Formats any date value into DD/MM/YYYY hh:mm AM/PM for UI display
 * @param {any} dateVal 
 * @param {string} fallback 
 * @returns {string}
 */
export const formatDateTimeDisplay = (dateVal, fallback = '-') => {
  const d = parseToDate(dateVal);
  if (!d) return fallback;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strHours = String(hours).padStart(2, '0');
  return `${day}/${month}/${year} ${strHours}:${minutes} ${ampm}`;
};
