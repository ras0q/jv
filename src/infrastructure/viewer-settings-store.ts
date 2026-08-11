import {
  DEFAULT_VIEWER_SETTINGS,
  normalizeViewerSettings,
  type ViewerSettings,
} from "../domain/viewer-settings.ts";

const STORAGE_KEY = "jv.settings";

/** Loads validated viewer settings, falling back when storage is unavailable. */
export function loadViewerSettings(): ViewerSettings {
  try {
    const value = globalThis.localStorage.getItem(STORAGE_KEY);
    return value
      ? normalizeViewerSettings(JSON.parse(value))
      : { ...DEFAULT_VIEWER_SETTINGS };
  } catch (_error) {
    return { ...DEFAULT_VIEWER_SETTINGS };
  }
}

/** Persists settings without making storage availability an app requirement. */
export function saveViewerSettings(settings: ViewerSettings): void {
  try {
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (_error) {
    // Browsing restrictions may disable storage while local file reading works.
  }
}
