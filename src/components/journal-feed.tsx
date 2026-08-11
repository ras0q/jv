import { For, Match, Show, Switch } from "solid-js";
import type { JournalViewerController } from "../application/create-journal-viewer.ts";
import { renderMarkdown } from "../infrastructure/markdown-renderer.ts";

type JournalFeedProps = {
  viewer: JournalViewerController;
};

/**
 * Renders the paginated journal feed and translates feed keyboard events into
 * controller commands. Repository access remains outside the component.
 */
export function JournalFeed(props: JournalFeedProps) {
  const state = props.viewer.state;

  return (
    <section
      class="feed-pane"
      ref={props.viewer.setFeedPane}
      onScroll={(event) => {
        const element = event.currentTarget;
        if (
          state.hasMore && !state.isLoadingMore &&
          element.scrollHeight - element.scrollTop - element.clientHeight < 320
        ) {
          void props.viewer.loadMore();
        }
      }}
      aria-label="Journal feed"
    >
      <Show
        when={state.visibleItems.length}
        fallback={<p class="empty-message">No recorded journals.</p>}
      >
        <For each={state.visibleItems}>
          {(item) => (
            <Switch>
              <Match when={item.type === "entry" ? item.entry : undefined}>
                {(entry) => (
                  <article
                    class="journal-entry"
                    classList={{
                      selected: state.selectedDate === entry().date,
                    }}
                    tabIndex={0}
                    data-journal-date={entry().date}
                    aria-current={state.selectedDate === entry().date
                      ? "true"
                      : undefined}
                    onClick={() => void props.viewer.selectDate(entry().date)}
                    onKeyDown={(event) => {
                      if (event.target !== event.currentTarget) return;
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        void props.viewer.selectDate(entry().date);
                      } else if (
                        event.key === "j" || event.key === "ArrowDown"
                      ) {
                        event.preventDefault();
                        void props.viewer.moveEntrySelection(entry().date, 1);
                      } else if (
                        event.key === "k" || event.key === "ArrowUp"
                      ) {
                        event.preventDefault();
                        void props.viewer.moveEntrySelection(entry().date, -1);
                      } else if (
                        event.key === "l" || event.key === "ArrowRight"
                      ) {
                        event.preventDefault();
                        props.viewer.focusDetailPane();
                      }
                    }}
                  >
                    <h2>{entry().date}</h2>
                    <div
                      class="markdown"
                      innerHTML={renderMarkdown(entry().journal)}
                    />
                  </article>
                )}
              </Match>
              <Match when={item.type === "error" ? item : undefined}>
                {(failed) => (
                  <div class="item-error" role="alert">
                    <p>{failed().date} could not be read.</p>
                    <button
                      type="button"
                      onClick={() => props.viewer.retryFeedItem(failed().date)}
                    >
                      Retry
                    </button>
                  </div>
                )}
              </Match>
            </Switch>
          )}
        </For>
      </Show>
      <Show when={state.hasMore}>
        <button
          type="button"
          class="load-more"
          disabled={state.isLoadingMore}
          onClick={() => props.viewer.loadMore()}
        >
          {state.isLoadingMore ? "Loading…" : "Load more"}
        </button>
      </Show>
      <Show when={!state.hasMore && state.visibleItems.length > 0}>
        <p class="end-message">End of journals.</p>
      </Show>
    </section>
  );
}
