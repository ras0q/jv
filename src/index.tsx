/* @refresh reload */
/// <reference path="./types/file-system-access.d.ts" />
import { render } from "solid-js/web";
import App from "./App.tsx";
import { MemoryJournalRepository } from "./infrastructure/memory-journal-repository.ts";

const root = document.getElementById("root");
const testFiles = globalThis.__JOURNAL_VIEWER_TEST_DATA__;

render(
  () => (
    <App
      repository={testFiles
        ? new MemoryJournalRepository(testFiles)
        : undefined}
    />
  ),
  root!,
);
