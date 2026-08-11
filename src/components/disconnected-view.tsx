import { Show } from "solid-js";

type DisconnectedViewProps = {
  unsupported?: boolean;
  message?: string;
  onChoose: () => void;
};

/** Displays directory selection or unsupported-browser guidance. */
export function DisconnectedView(props: DisconnectedViewProps) {
  return (
    <section class="centered">
      <h1>Journal Viewer</h1>
      <p>
        View Journal sections from your Daily folder entirely in this
        browser.<br />Your files are never sent elsewhere.
      </p>
      <Show when={props.message}>
        <p class="error" role="alert">{props.message}</p>
      </Show>
      <Show
        when={!props.unsupported}
        fallback={
          <p class="error" role="alert">
            This browser cannot read folders. Use a Chromium-based desktop
            browser.
          </p>
        }
      >
        <button type="button" onClick={props.onChoose}>
          Open Daily folder
        </button>
      </Show>
    </section>
  );
}
