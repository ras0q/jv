export type JournalState = "recorded" | "empty" | "missing-section";

export type JournalEntry = {
  date: string;
  path: string;
  journal: string;
  state: JournalState;
  lastModified: number;
};

export type ConnectionState =
  | { type: "unsupported" }
  | { type: "disconnected"; message?: string }
  | { type: "permission-required"; handle: FileSystemDirectoryHandle }
  | { type: "loading" }
  | {
    type: "connected";
    handle: FileSystemDirectoryHandle | null;
    directoryName: string;
  }
  | { type: "error"; message: string };

export type FeedItem =
  | { type: "entry"; entry: JournalEntry }
  | { type: "error"; date: string; message: string };

export type DetailItem =
  | { type: "entry"; date: string; entry: JournalEntry }
  | { type: "missing"; date: string }
  | { type: "invalid-date"; year: number }
  | { type: "error"; date: string; message: string }
  | { type: "loading"; date: string };

export type ViewerState = {
  connection: ConnectionState;
  selectedDate: string | null;
  availableDates: string[];
  visibleItems: FeedItem[];
  detailItems: DetailItem[];
  journalCache: Map<string, JournalEntry>;
  nextCandidateIndex: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  notice: string;
};

export interface JournalRepository {
  readonly directoryName: string;
  readonly handle: FileSystemDirectoryHandle | null;
  validate(): Promise<boolean>;
  listDates(): Promise<string[]>;
  read(date: string): Promise<JournalEntry>;
}

export class DailyNoteMissingError extends Error {
  constructor(date: string) {
    super(`Daily Note not found: ${date}`);
    this.name = "DailyNoteMissingError";
  }
}
