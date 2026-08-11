import { lexer } from "marked";
import type { JournalState } from "./journal.ts";

export type ExtractedJournal = { journal: string; state: JournalState };

/** Extracts a named root-level h2 section from source spans retained by block tokens. */
export function extractJournal(
  source: string,
  sectionHeading = "Journal",
): ExtractedJournal {
  const tokens = lexer(source, { gfm: true });
  const startIndex = tokens.findIndex((token) =>
    token.type === "heading" && token.depth === 2 &&
    token.text.trim() === sectionHeading
  );

  if (startIndex < 0) return { journal: "", state: "missing-section" };

  const followingTokens = tokens.slice(startIndex + 1);
  const endIndex = followingTokens.findIndex((token) =>
    token.type === "heading" && token.depth <= 2
  );
  const sectionTokens = endIndex < 0
    ? followingTokens
    : followingTokens.slice(0, endIndex);
  const journal = sectionTokens.map((token) => token.raw).join("").trim();
  return { journal, state: journal ? "recorded" : "empty" };
}
