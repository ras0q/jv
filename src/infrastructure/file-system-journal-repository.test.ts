import { assertEquals, assertObjectMatch, assertRejects } from "@std/assert";
import { DailyNoteMissingError } from "../domain/journal.ts";
import { FileSystemJournalRepository } from "./file-system-journal-repository.ts";

type FakeNode = { kind: "file"; content: string; lastModified?: number } | {
  kind: "directory";
  children: Record<string, FakeNode>;
};

function fakeDirectory(
  name: string,
  children: Record<string, FakeNode>,
): FileSystemDirectoryHandle {
  const handle = {
    kind: "directory",
    name,
    async *entries() {
      for (const [childName, node] of Object.entries(children)) {
        yield [
          childName,
          node.kind === "directory"
            ? fakeDirectory(childName, node.children)
            : {
              kind: "file",
              name: childName,
              getFile: () => ({
                text: () => node.content,
                lastModified: node.lastModified ?? 0,
              }),
            },
        ];
      }
    },
    getDirectoryHandle(childName: string) {
      const node = children[childName];
      if (!node || node.kind !== "directory") {
        throw new DOMException("Missing", "NotFoundError");
      }
      return fakeDirectory(childName, node.children);
    },
    getFileHandle(fileName: string) {
      const node = children[fileName];
      if (!node || node.kind !== "file") {
        throw new DOMException("Missing", "NotFoundError");
      }
      return {
        kind: "file",
        name: fileName,
        getFile: () => ({
          text: () => node.content,
          lastModified: node.lastModified ?? 0,
        }),
      };
    },
  };
  return handle as unknown as FileSystemDirectoryHandle;
}

const repository = new FileSystemJournalRepository(fakeDirectory("Daily", {
  "2024": {
    kind: "directory",
    children: {
      "2024-02-29.md": { kind: "file", content: "## Journal\nLeap day" },
      "2024-02-30.md": { kind: "file", content: "## Journal\nInvalid date" },
      "2023-12-31.md": { kind: "file", content: "## Journal\nWrong year" },
      "note.md": { kind: "file", content: "## Journal\nWrong name" },
    },
  },
}));

Deno.test("repository lists valid files whose filename year matches the parent", async () => {
  assertEquals(await repository.validate(), true);
  assertEquals(await repository.listDates(), ["2024-02-29"]);
});

Deno.test("repository extracts an entry from a known path", async () => {
  assertObjectMatch(await repository.read("2024-02-29", "Journal"), {
    date: "2024-02-29",
    path: "2024/2024-02-29.md",
    journal: "Leap day",
    state: "recorded",
  });
});

Deno.test("repository distinguishes a missing file", async () => {
  await assertRejects(
    () => repository.read("2024-08-11", "Journal"),
    DailyNoteMissingError,
  );
});
