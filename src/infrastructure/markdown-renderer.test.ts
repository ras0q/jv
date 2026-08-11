import { assertFalse, assertStringIncludes } from "@std/assert";
import { renderMarkdown } from "./markdown-renderer.ts";

Deno.test("renderMarkdown disables raw HTML and remote images", () => {
  const html = renderMarkdown(
    "<script>alert(1)</script>\n\n![remote](https://example.com/a.png)",
  );
  assertStringIncludes(html, "&lt;script&gt;");
  assertFalse(html.includes("<img"));
});

Deno.test("renderMarkdown opens external links safely and preserves wiki links", () => {
  const html = renderMarkdown("[site](https://example.com) and [[Page]]");
  assertStringIncludes(html, 'target="_blank"');
  assertStringIncludes(html, 'rel="noopener noreferrer"');
  assertStringIncludes(html, "[[Page]]");
});

Deno.test("renderMarkdown does not link dangerous protocols", () => {
  const html = renderMarkdown("[unsafe](javascript:alert(1))");
  assertStringIncludes(html, "unsafe");
  assertFalse(html.includes("href"));
});
