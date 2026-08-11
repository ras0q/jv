import { onCleanup, onMount } from "solid-js";
import { createStore } from "solid-js/store";
import { isValidDate, parseDate, subtractYears } from "../domain/date.ts";
import {
  DailyNoteMissingError,
  type DetailItem,
  type FeedItem,
  type JournalEntry,
  type JournalRepository,
  type ViewerState,
} from "../domain/journal.ts";
import {
  normalizeViewerSettings,
  type ViewerSettings,
} from "../domain/viewer-settings.ts";
import {
  loadDirectoryHandle,
  saveDirectoryHandle,
} from "../infrastructure/directory-handle-store.ts";
import { FileSystemJournalRepository } from "../infrastructure/file-system-journal-repository.ts";
import {
  loadViewerSettings,
  saveViewerSettings,
} from "../infrastructure/viewer-settings-store.ts";

const BATCH_SIZE = 20;

function readableError(error: unknown): string {
  if (error instanceof DOMException && error.name === "NotAllowedError") {
    return "Read permission was denied.";
  }
  return "The file could not be read.";
}

/**
 * Creates the application controller for Journal Viewer.
 *
 * The controller owns repository access, connection restoration, URL state,
 * journal caching, pagination, and cross-pane focus. Components receive its
 * reactive state and invoke explicit commands without knowing storage details.
 * An injected repository bypasses directory restoration for deterministic
 * browser tests.
 */
export function createJournalViewer(repositoryOverride?: JournalRepository) {
  const [state, setState] = createStore<ViewerState>({
    settings: loadViewerSettings(),
    connection: { type: "loading" },
    selectedDate: null,
    availableDates: [],
    visibleItems: [],
    detailItems: [],
    journalCache: new Map(),
    nextCandidateIndex: 0,
    hasMore: false,
    isLoadingMore: false,
    notice: "",
  });
  let repository: JournalRepository | null = null;
  let feedPane: HTMLElement | undefined;
  let detailPane: HTMLElement | undefined;

  const recordedEntries = () =>
    state.visibleItems.flatMap((item) =>
      item.type === "entry" ? [item.entry] : []
    );

  async function readEntry(
    date: string,
    force = false,
  ): Promise<JournalEntry> {
    const cached = state.journalCache.get(date);
    if (cached && !force) return cached;
    if (!repository) throw new Error("Repository unavailable");
    const entry = await repository.read(date, state.settings.sectionHeading);
    state.journalCache.set(date, entry);
    return entry;
  }

  async function loadMore(requiredDate?: string): Promise<void> {
    if (!repository || state.isLoadingMore) return;
    setState("isLoadingMore", true);
    setState("notice", "Loading journals.");
    let index = state.nextCandidateIndex;
    let recordedCount = 0;
    const items = [...state.visibleItems];
    const requiredIndex = requiredDate
      ? state.availableDates.indexOf(requiredDate)
      : -1;

    try {
      while (
        index < state.availableDates.length &&
        (recordedCount < BATCH_SIZE ||
          (requiredIndex >= 0 && index <= requiredIndex))
      ) {
        const date = state.availableDates[index];
        index += 1;
        try {
          const entry = await readEntry(date);
          if (entry.state === "recorded") {
            items.push({ type: "entry", entry });
            recordedCount += 1;
          }
        } catch (error) {
          items.push({ type: "error", date, message: readableError(error) });
        }
      }
      setState("visibleItems", items);
      setState("nextCandidateIndex", index);
      setState("hasMore", index < state.availableDates.length);
      setState(
        "notice",
        index < state.availableDates.length ? "" : "All journals are loaded.",
      );
    } finally {
      setState("isLoadingMore", false);
    }
  }

  function replaceUrlDate(date: string | null): void {
    const url = new URL(globalThis.location.href);
    if (date) url.searchParams.set("date", date);
    else url.searchParams.delete("date");
    globalThis.history.replaceState({}, "", url);
  }

  async function loadDetails(date: string, force = false): Promise<void> {
    const selected = parseDate(date);
    if (!selected) return;
    const targets = Array.from(
      { length: state.settings.comparisonYears },
      (_, offset): DetailItem => {
        const target = subtractYears(date, offset);
        return target
          ? { type: "loading", date: target }
          : { type: "invalid-date", year: selected.year - offset };
      },
    );
    setState("detailItems", targets);

    const loaded = await Promise.all(
      targets.map(async (item): Promise<DetailItem> => {
        if (item.type === "invalid-date") return item;
        try {
          return {
            type: "entry",
            date: item.date,
            entry: await readEntry(item.date, force),
          };
        } catch (error) {
          if (error instanceof DailyNoteMissingError) {
            return { type: "missing", date: item.date };
          }
          return {
            type: "error",
            date: item.date,
            message: readableError(error),
          };
        }
      }),
    );
    if (state.selectedDate === date) setState("detailItems", loaded);
  }

  async function selectDate(date: string): Promise<void> {
    setState("selectedDate", date);
    replaceUrlDate(date);
    await loadDetails(date);
  }

  async function connect(nextRepository: JournalRepository): Promise<void> {
    repository = nextRepository;
    setState("connection", { type: "loading" });
    setState("notice", "Loading the Daily folder.");
    try {
      if (!await nextRepository.validate()) {
        setState("connection", {
          type: "error",
          message:
            "Choose a Daily folder that directly contains at least one YYYY year folder.",
        });
        return;
      }

      const dates = await nextRepository.listDates();
      setState({
        connection: {
          type: "connected",
          handle: nextRepository.handle,
          directoryName: nextRepository.directoryName,
        },
        availableDates: dates,
        visibleItems: [],
        detailItems: [],
        nextCandidateIndex: 0,
        hasMore: dates.length > 0,
        selectedDate: null,
        notice: "",
      });
      state.journalCache.clear();

      const requestedDate = new URL(globalThis.location.href).searchParams.get(
        "date",
      );
      const preferredDate = requestedDate && isValidDate(requestedDate) &&
          dates.includes(requestedDate)
        ? requestedDate
        : undefined;
      await loadMore(preferredDate);
      const preferredIsRecorded = preferredDate &&
        recordedEntries().some((entry) => entry.date === preferredDate);
      const selectedDate = preferredIsRecorded
        ? preferredDate
        : recordedEntries()[0]?.date ?? null;
      setState("selectedDate", selectedDate);
      replaceUrlDate(selectedDate);
      if (selectedDate) await loadDetails(selectedDate);
    } catch (_error) {
      setState("connection", {
        type: "error",
        message: "The Daily folder could not be read.",
      });
    }
  }

  async function chooseDirectory(): Promise<void> {
    try {
      const handle = await globalThis.showDirectoryPicker({ mode: "read" });
      const nextRepository = new FileSystemJournalRepository(handle);
      if (!await nextRepository.validate()) {
        setState("connection", {
          type: "error",
          message:
            "Choose a Daily folder that directly contains at least one YYYY year folder.",
        });
        return;
      }
      await saveDirectoryHandle(handle);
      await connect(nextRepository);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setState("connection", { type: "error", message: readableError(error) });
    }
  }

  async function reconnect(): Promise<void> {
    if (state.connection.type !== "permission-required") return;
    const handle = state.connection.handle;
    const permission = await handle.requestPermission({ mode: "read" });
    if (permission === "granted") {
      await connect(new FileSystemJournalRepository(handle));
      return;
    }
    setState("connection", {
      type: "disconnected",
      message: "Read permission was denied. Choose another folder.",
    });
  }

  async function refreshVisible(): Promise<void> {
    if (!repository || state.connection.type !== "connected") return;
    const selectedDate = state.selectedDate;
    const scrollTop = feedPane?.scrollTop ?? 0;
    setState("notice", "Refreshing visible journals.");
    const refreshed = await Promise.all(
      state.visibleItems.map(async (item): Promise<FeedItem | null> => {
        const date = item.type === "entry" ? item.entry.date : item.date;
        try {
          const entry = await readEntry(date, true);
          return entry.state === "recorded" ? { type: "entry", entry } : null;
        } catch (error) {
          return { type: "error", date, message: readableError(error) };
        }
      }),
    );
    setState(
      "visibleItems",
      refreshed.filter((item): item is FeedItem => item !== null),
    );
    if (selectedDate) await loadDetails(selectedDate, true);
    setState("notice", "");
    requestAnimationFrame(() => {
      if (feedPane) feedPane.scrollTop = scrollTop;
    });
  }

  async function refreshAll(): Promise<void> {
    if (!repository || state.connection.type !== "connected") return;
    const scrollTop = feedPane?.scrollTop ?? 0;
    const selectedDate = state.selectedDate;
    setState("notice", "Refreshing the Daily folder.");
    try {
      const dates = await repository.listDates();
      state.journalCache.clear();
      setState({
        availableDates: dates,
        visibleItems: [],
        nextCandidateIndex: 0,
        hasMore: dates.length > 0,
      });
      await loadMore(
        selectedDate && dates.includes(selectedDate) ? selectedDate : undefined,
      );
      const nextSelected = selectedDate && recordedEntries().some((entry) =>
          entry.date === selectedDate
        )
        ? selectedDate
        : recordedEntries()[0]?.date ?? null;
      setState("selectedDate", nextSelected);
      replaceUrlDate(nextSelected);
      if (nextSelected) await loadDetails(nextSelected);
      requestAnimationFrame(() => {
        if (feedPane) feedPane.scrollTop = scrollTop;
      });
    } catch (_error) {
      setState("notice", "The folder could not be refreshed.");
    }
  }

  async function updateSettings(value: ViewerSettings): Promise<void> {
    const settings = normalizeViewerSettings(value);
    setState("settings", settings);
    saveViewerSettings(settings);
    await refreshAll();
  }

  async function retryFeedItem(date: string): Promise<void> {
    try {
      const entry = await readEntry(date, true);
      if (entry.state === "recorded") {
        setState(
          "visibleItems",
          (item) => item.type === "error" && item.date === date,
          { type: "entry", entry },
        );
      } else {
        setState(
          "visibleItems",
          state.visibleItems.filter((item) =>
            !(item.type === "error" && item.date === date)
          ),
        );
      }
    } catch (error) {
      setState(
        "visibleItems",
        (item) => item.type === "error" && item.date === date,
        { type: "error", date, message: readableError(error) },
      );
    }
  }

  function focusSelectedEntry(date = state.selectedDate): void {
    if (!date) return;
    requestAnimationFrame(() =>
      feedPane?.querySelector<HTMLElement>(
        `[data-journal-date="${date}"]`,
      )?.focus()
    );
  }

  async function moveEntrySelection(
    currentDate: string,
    direction: -1 | 1,
  ): Promise<void> {
    let entries = recordedEntries();
    let target = entries[
      entries.findIndex((entry) => entry.date === currentDate) + direction
    ];

    if (!target && direction === 1 && state.hasMore) {
      await loadMore();
      entries = recordedEntries();
      target = entries[
        entries.findIndex((entry) => entry.date === currentDate) + direction
      ];
    }

    if (!target) return;
    void selectDate(target.date);
    focusSelectedEntry(target.date);
  }

  onMount(async () => {
    globalThis.addEventListener("focus", refreshVisible);
    if (repositoryOverride) {
      await connect(repositoryOverride);
      return;
    }
    if (typeof globalThis.showDirectoryPicker !== "function") {
      setState("connection", { type: "unsupported" });
      return;
    }
    try {
      const handle = await loadDirectoryHandle();
      if (!handle) {
        setState("connection", { type: "disconnected" });
        return;
      }
      const permission = await handle.queryPermission({ mode: "read" });
      if (permission === "granted") {
        await connect(new FileSystemJournalRepository(handle));
      } else if (permission === "prompt") {
        setState("connection", { type: "permission-required", handle });
      } else {
        setState("connection", {
          type: "disconnected",
          message: "Read permission was denied. Choose the Daily folder again.",
        });
      }
    } catch (_error) {
      setState("connection", {
        type: "disconnected",
        message: "The saved folder could not be restored.",
      });
    }
  });

  onCleanup(() => globalThis.removeEventListener("focus", refreshVisible));

  return {
    state,
    chooseDirectory,
    reconnect,
    refreshAll,
    updateSettings,
    loadMore,
    retryFeedItem,
    retryDetails: () =>
      state.selectedDate
        ? loadDetails(state.selectedDate, true)
        : Promise.resolve(),
    selectDate,
    moveEntrySelection,
    focusSelectedEntry,
    focusDetailPane: () => detailPane?.focus(),
    setFeedPane: (element: HTMLElement) => {
      feedPane = element;
    },
    setDetailPane: (element: HTMLElement) => {
      detailPane = element;
    },
  };
}

/** Public controller contract shared by the view components. */
export type JournalViewerController = ReturnType<typeof createJournalViewer>;
