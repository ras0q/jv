import { Match, Switch } from "solid-js";
import { createJournalViewer } from "./application/create-journal-viewer.ts";
import { DisconnectedView } from "./components/disconnected-view.tsx";
import { JournalViewer } from "./components/journal-viewer.tsx";
import type { JournalRepository } from "./domain/journal.ts";
import "./styles.css";

type AppProps = { repository?: JournalRepository };

/** Routes connection states to the appropriate top-level screen. */
export default function App(props: AppProps) {
  const viewer = createJournalViewer(props.repository);
  const state = viewer.state;

  return (
    <main class="app-shell">
      <Switch>
        <Match when={state.connection.type === "loading"}>
          <section class="centered" aria-live="polite">
            <p>{state.notice || "Loading."}</p>
          </section>
        </Match>
        <Match when={state.connection.type === "unsupported"}>
          <DisconnectedView
            unsupported
            onChoose={viewer.chooseDirectory}
          />
        </Match>
        <Match when={state.connection.type === "disconnected"}>
          <DisconnectedView
            message={state.connection.type === "disconnected"
              ? state.connection.message
              : undefined}
            onChoose={viewer.chooseDirectory}
          />
        </Match>
        <Match when={state.connection.type === "permission-required"}>
          <section class="centered">
            <h1>Journal Viewer</h1>
            <p>
              Read permission is required for the previously selected Daily
              folder.
            </p>
            <div class="actions">
              <button type="button" onClick={viewer.reconnect}>
                Reconnect
              </button>
              <button type="button" onClick={viewer.chooseDirectory}>
                Choose another folder
              </button>
            </div>
          </section>
        </Match>
        <Match when={state.connection.type === "error"}>
          <section class="centered error" role="alert">
            <h1>Journal Viewer</h1>
            <p>
              {state.connection.type === "error"
                ? state.connection.message
                : ""}
            </p>
            <div class="actions">
              <button
                type="button"
                onClick={() => globalThis.location.reload()}
              >
                Reload
              </button>
              <button type="button" onClick={viewer.chooseDirectory}>
                Choose Daily folder
              </button>
            </div>
          </section>
        </Match>
        <Match when={state.connection.type === "connected"}>
          <JournalViewer
            viewer={viewer}
            directoryName={state.connection.type === "connected"
              ? state.connection.directoryName
              : ""}
          />
        </Match>
      </Switch>
    </main>
  );
}
