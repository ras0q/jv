import type { ViewerSettings } from "../domain/viewer-settings.ts";
import { SettingsDialog } from "./settings-dialog.tsx";

type ViewerHeaderProps = {
  directoryName: string;
  settings: ViewerSettings;
  onRefresh: () => void;
  onUpdateSettings: (settings: ViewerSettings) => void | Promise<void>;
  onChooseDirectory: () => void;
};

/** Renders viewer identity, keyboard guidance, and directory commands. */
export function ViewerHeader(props: ViewerHeaderProps) {
  return (
    <header class="app-header">
      <h1>Journal Viewer</h1>
      <p class="keyboard-help">
        j/k or ↑/↓: entries · h/l or ←/→: panes
      </p>
      <div class="header-actions">
        <button type="button" onClick={props.onRefresh}>Refresh</button>
        <SettingsDialog
          settings={props.settings}
          onSave={props.onUpdateSettings}
        />
        <button
          class="directory-button"
          type="button"
          aria-label={`Choose another folder; current folder: ${props.directoryName}`}
          onClick={props.onChooseDirectory}
        >
          {props.directoryName}
        </button>
      </div>
    </header>
  );
}
