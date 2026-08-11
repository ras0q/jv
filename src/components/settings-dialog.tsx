import { createSignal } from "solid-js";
import type { ViewerSettings } from "../domain/viewer-settings.ts";

type SettingsDialogProps = {
  settings: ViewerSettings;
  onSave: (settings: ViewerSettings) => void | Promise<void>;
};

/** Provides a minimal modal editor for persisted user-facing viewer settings. */
export function SettingsDialog(props: SettingsDialogProps) {
  let dialog: HTMLDialogElement | undefined;
  const [sectionHeading, setSectionHeading] = createSignal("");
  const [comparisonYears, setComparisonYears] = createSignal(3);

  function open(): void {
    setSectionHeading(props.settings.sectionHeading);
    setComparisonYears(props.settings.comparisonYears);
    dialog?.showModal();
  }

  function save(event: SubmitEvent): void {
    event.preventDefault();
    dialog?.close();
    void props.onSave({
      sectionHeading: sectionHeading().trim(),
      comparisonYears: comparisonYears(),
    });
  }

  return (
    <>
      <button type="button" onClick={open}>Settings</button>
      <dialog
        class="settings-dialog"
        ref={dialog}
        aria-labelledby="settings-title"
      >
        <form class="settings-form" onSubmit={save}>
          <h2 id="settings-title">Settings</h2>
          <label class="settings-field">
            <span>Section heading</span>
            <input
              name="section-heading"
              value={sectionHeading()}
              required
              maxLength={100}
              aria-describedby="section-heading-help"
              onInput={(event) => setSectionHeading(event.currentTarget.value)}
            />
            <small id="section-heading-help">
              Enter the heading text without ##.
            </small>
          </label>
          <label class="settings-field">
            <span>Comparison years</span>
            <input
              name="comparison-years"
              type="number"
              value={comparisonYears()}
              min={1}
              max={10}
              required
              onInput={(event) =>
                setComparisonYears(event.currentTarget.valueAsNumber)}
            />
          </label>
          <div class="settings-actions">
            <button type="button" onClick={() => dialog?.close()}>
              Cancel
            </button>
            <button type="submit">Save</button>
          </div>
        </form>
      </dialog>
    </>
  );
}
