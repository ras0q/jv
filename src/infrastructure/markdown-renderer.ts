import { Marked, Renderer } from "marked";

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const renderer = new Renderer();

renderer.html = ({ text }) => escapeHtml(text);
renderer.image = ({ raw }) => escapeHtml(raw);
renderer.link = function ({ href, title, tokens }) {
  const label = this.parser.parseInline(tokens);
  const scheme = /^([a-z][a-z\d+.-]*):/i.exec(href)?.[1]?.toLowerCase();
  if (scheme && !["http", "https", "mailto"].includes(scheme)) return label;

  const titleAttribute = title ? ` title="${escapeHtml(title)}"` : "";
  const externalAttributes = /^(?:https?:)?\/\//i.test(href)
    ? ' target="_blank" rel="noopener noreferrer"'
    : "";
  return `<a href="${
    escapeHtml(href)
  }"${titleAttribute}${externalAttributes}>${label}</a>`;
};

const parser = new Marked().setOptions({
  async: false,
  gfm: true,
  renderer,
});

/** Renders Markdown with raw HTML, remote images, and dangerous link protocols disabled. */
export function renderMarkdown(markdown: string): string {
  return parser.parse(markdown, { async: false });
}
