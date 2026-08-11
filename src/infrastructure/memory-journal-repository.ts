import { extractJournal } from "../domain/extract-journal.ts";
import {
  DailyNoteMissingError,
  type JournalEntry,
  type JournalRepository,
} from "../domain/journal.ts";

/** Deterministic repository used by automated browser tests without invoking the native picker. */
export class MemoryJournalRepository implements JournalRepository {
  readonly handle = null;

  constructor(
    private readonly files: Record<string, string>,
    readonly directoryName = "Daily",
  ) {}

  validate(): Promise<boolean> {
    return Promise.resolve(Object.keys(this.files).length > 0);
  }

  listDates(): Promise<string[]> {
    return Promise.resolve(
      Object.keys(this.files).sort((left, right) => right.localeCompare(left)),
    );
  }

  read(date: string, sectionHeading: string): Promise<JournalEntry> {
    const source = this.files[date];
    if (source === undefined) {
      return Promise.reject(new DailyNoteMissingError(date));
    }
    const extracted = extractJournal(source, sectionHeading);
    return Promise.resolve({
      date,
      path: `${date.slice(0, 4)}/${date}.md`,
      journal: extracted.journal,
      state: extracted.state,
      lastModified: 0,
    });
  }
}
