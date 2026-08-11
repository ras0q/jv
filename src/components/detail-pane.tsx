import { For, Match, Show, Switch } from "solid-js";
import type { JournalViewerController } from "../application/create-journal-viewer.ts";
import type { DetailItem } from "../domain/journal.ts";
import { renderMarkdown } from "../infrastructure/markdown-renderer.ts";

type DetailPaneProps = {
  viewer: JournalViewerController;
};

/** Renders the selected date and its two previous-year counterparts. */
export function DetailPane(props: DetailPaneProps) {
  const state = props.viewer.state;

  return (
    <aside
      class="detail-pane"
      ref={props.viewer.setDetailPane}
      tabIndex={0}
      aria-label="Three-year journal"
      onKeyDown={(event) => {
        if (
          event.target === event.currentTarget &&
          (event.key === "h" || event.key === "ArrowLeft")
        ) {
          event.preventDefault();
          props.viewer.focusSelectedEntry();
        }
      }}
    >
      <Show
        when={state.selectedDate}
        fallback={<p class="empty-message">Select a journal.</p>}
      >
        <For each={state.detailItems}>
          {(item) => (
            <Detail
              item={item}
              onRetry={props.viewer.retryDetails}
            />
          )}
        </For>
      </Show>
    </aside>
  );
}

function Detail(props: { item: DetailItem; onRetry: () => void }) {
  return (
    <section class="detail-entry">
      <Switch>
        <Match
          when={props.item.type === "invalid-date" ? props.item : undefined}
        >
          {(item) => (
            <>
              <h2>{item().year}-02-29</h2>
              <p class="muted">Date does not exist</p>
            </>
          )}
        </Match>
        <Match when={props.item.type === "loading" ? props.item : undefined}>
          {(item) => (
            <>
              <h2>{item().date}</h2>
              <p class="muted">Loading…</p>
            </>
          )}
        </Match>
        <Match when={props.item.type === "missing" ? props.item : undefined}>
          {(item) => (
            <>
              <h2>{item().date}</h2>
              <p class="muted">No Daily Note</p>
            </>
          )}
        </Match>
        <Match when={props.item.type === "error" ? props.item : undefined}>
          {(item) => (
            <>
              <h2>{item().date}</h2>
              <p class="error" role="alert">Could not read this file.</p>
              <button type="button" onClick={props.onRetry}>Retry</button>
            </>
          )}
        </Match>
        <Match when={props.item.type === "entry" ? props.item : undefined}>
          {(item) => (
            <>
              <h2>{item().date}</h2>
              <Show
                when={item().entry.state === "recorded"}
                fallback={
                  <p class="muted">
                    {item().entry.state === "missing-section"
                      ? "No Journal section"
                      : "No entry"}
                  </p>
                }
              >
                <div
                  class="markdown"
                  innerHTML={renderMarkdown(item().entry.journal)}
                />
              </Show>
            </>
          )}
        </Match>
      </Switch>
    </section>
  );
}
