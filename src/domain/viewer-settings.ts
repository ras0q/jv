export type ViewerSettings = {
  sectionHeading: string;
  comparisonYears: number;
};

export const DEFAULT_VIEWER_SETTINGS: Readonly<ViewerSettings> = {
  sectionHeading: "Journal",
  comparisonYears: 3,
};

const MAX_HEADING_LENGTH = 100;
const MAX_COMPARISON_YEARS = 10;

/**
 * Converts untrusted persisted input into supported viewer settings.
 * Invalid fields independently fall back to defaults so a future or damaged
 * value cannot prevent the application from starting.
 */
export function normalizeViewerSettings(value: unknown): ViewerSettings {
  const candidate = typeof value === "object" && value !== null
    ? value as Record<string, unknown>
    : {};
  const heading = typeof candidate.sectionHeading === "string"
    ? candidate.sectionHeading.trim()
    : "";
  const comparisonYears = candidate.comparisonYears;

  return {
    sectionHeading: heading && !heading.includes("\n") &&
        heading.length <= MAX_HEADING_LENGTH
      ? heading
      : DEFAULT_VIEWER_SETTINGS.sectionHeading,
    comparisonYears: Number.isInteger(comparisonYears) &&
        Number(comparisonYears) >= 1 &&
        Number(comparisonYears) <= MAX_COMPARISON_YEARS
      ? Number(comparisonYears)
      : DEFAULT_VIEWER_SETTINGS.comparisonYears,
  };
}
