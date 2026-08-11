import type { JournalViewerController } from "../application/create-journal-viewer.ts";
import { DetailPane } from "./detail-pane.tsx";
import { JournalFeed } from "./journal-feed.tsx";
import { ViewerHeader } from "./viewer-header.tsx";

type JournalViewerProps = {
  viewer: JournalViewerController;
  directoryName: string;
};

/** Composes the connected viewer shell from its independent pane components. */
export function JournalViewer(props: JournalViewerProps) {
  return (
    <div class="viewer">
      <ViewerHeader
        directoryName={props.directoryName}
        settings={props.viewer.state.settings}
        onRefresh={props.viewer.refreshAll}
        onUpdateSettings={props.viewer.updateSettings}
        onChooseDirectory={props.viewer.chooseDirectory}
      />
      <div class="panes">
        <JournalFeed viewer={props.viewer} />
        <DetailPane viewer={props.viewer} />
      </div>
      <p class="sr-only" aria-live="polite">{props.viewer.state.notice}</p>
    </div>
  );
}
