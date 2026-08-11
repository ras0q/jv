const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parses a strict ISO calendar date without allowing JavaScript date rollover. */
export function parseDate(
  value: string,
): { year: number; month: number; day: number } | null {
  const match = DATE_PATTERN.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

/** Returns whether a string is a real calendar date in YYYY-MM-DD form. */
export function isValidDate(value: string): boolean {
  return parseDate(value) !== null;
}

/** Subtracts whole calendar years, returning null when the same month/day does not exist. */
export function subtractYears(value: string, years: number): string | null {
  const parsed = parseDate(value);
  if (!parsed) return null;
  const candidate = `${String(parsed.year - years).padStart(4, "0")}-${
    String(parsed.month).padStart(2, "0")
  }-${String(parsed.day).padStart(2, "0")}`;
  return isValidDate(candidate) ? candidate : null;
}
