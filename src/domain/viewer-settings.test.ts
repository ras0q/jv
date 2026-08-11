import { assertEquals } from "@std/assert";
import {
  DEFAULT_VIEWER_SETTINGS,
  normalizeViewerSettings,
} from "./viewer-settings.ts";

Deno.test("normalizeViewerSettings accepts supported values", () => {
  assertEquals(
    normalizeViewerSettings({ sectionHeading: " Notes ", comparisonYears: 5 }),
    { sectionHeading: "Notes", comparisonYears: 5 },
  );
});

Deno.test("normalizeViewerSettings replaces invalid fields with defaults", () => {
  assertEquals(
    normalizeViewerSettings({ sectionHeading: "\n", comparisonYears: 0 }),
    DEFAULT_VIEWER_SETTINGS,
  );
});
