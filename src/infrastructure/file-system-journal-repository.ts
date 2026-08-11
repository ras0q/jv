import { isValidDate } from "../domain/date.ts";
import { extractJournal } from "../domain/extract-journal.ts";
import {
  DailyNoteMissingError,
  type JournalEntry,
  type JournalRepository,
} from "../domain/journal.ts";

const YEAR_PATTERN = /^\d{4}$/;
const FILE_PATTERN = /^(\d{4}-\d{2}-\d{2})\.md$/;

function isMissing(error: unknown): boolean {
  return error instanceof DOMException && error.name === "NotFoundError";
}

/** Reads valid Daily Notes from the selected directory without accessing its parent vault. */
export class FileSystemJournalRepository implements JournalRepository {
  readonly directoryName: string;

  constructor(readonly handle: FileSystemDirectoryHandle) {
    this.directoryName = handle.name;
  }

  async validate(): Promise<boolean> {
    for await (const [name, entry] of this.handle.entries()) {
      if (entry.kind === "directory" && YEAR_PATTERN.test(name)) return true;
    }
    return false;
  }

  async listDates(): Promise<string[]> {
    const dates: string[] = [];
    for await (const [yearName, entry] of this.handle.entries()) {
      if (entry.kind !== "directory" || !YEAR_PATTERN.test(yearName)) continue;
      const year = entry as FileSystemDirectoryHandle;
      for await (const [fileName, child] of year.entries()) {
        const match = child.kind === "file"
          ? FILE_PATTERN.exec(fileName)
          : null;
        const date = match?.[1];
        if (date && date.startsWith(`${yearName}-`) && isValidDate(date)) {
          dates.push(date);
        }
      }
    }
    return [...new Set(dates)].sort((left, right) => right.localeCompare(left));
  }

  async read(date: string): Promise<JournalEntry> {
    if (!isValidDate(date)) throw new DailyNoteMissingError(date);
    try {
      const year = await this.handle.getDirectoryHandle(date.slice(0, 4));
      const fileHandle = await year.getFileHandle(`${date}.md`);
      const file = await fileHandle.getFile();
      const extracted = extractJournal(await file.text());
      return {
        date,
        path: `${date.slice(0, 4)}/${date}.md`,
        journal: extracted.journal,
        state: extracted.state,
        lastModified: file.lastModified,
      };
    } catch (error) {
      if (isMissing(error)) throw new DailyNoteMissingError(date);
      throw error;
    }
  }
}
