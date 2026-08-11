import { assertEquals } from "@std/assert";
import { extractJournal } from "./extract-journal.ts";

Deno.test("extractJournal extracts Journal until the next root h1 or h2", () => {
  const source =
    "# Daily\n\n## Journal\n\nFirst\n\n### Detail\n\nSecond\n\n## Tasks\n\nNope";
  assertEquals(extractJournal(source), {
    journal: "First\n\n### Detail\n\nSecond",
    state: "recorded",
  });
});

Deno.test("extractJournal distinguishes empty and missing sections", () => {
  assertEquals(extractJournal("## Journal\n\n## Next"), {
    journal: "",
    state: "empty",
  });
  assertEquals(extractJournal("## Notes\nText"), {
    journal: "",
    state: "missing-section",
  });
});

Deno.test("extractJournal ignores headings inside code fences and quotes", () => {
  const source =
    "```md\n## Journal\nwrong\n```\n\n> ## Journal\n> wrong\n\n## Journal\nright";
  assertEquals(extractJournal(source), {
    journal: "right",
    state: "recorded",
  });
});
