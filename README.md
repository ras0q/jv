# Journal Viewer

Journal Viewer reads only the `## Journal` sections from the `Daily` folder in
an Obsidian vault. It presents them as a chronological feed alongside entries
from the same month and day across three years.

Journal content is processed entirely in the browser and is never sent
elsewhere.

## Settings

Open `Settings` in the viewer header to change:

- The root-level h2 section to read, entered without the `##` prefix
- The number of same-date years shown in the detail pane

Settings are stored in the current browser's local storage.

## Running

Deno 2.0.0 or later and a Chromium-based desktop browser with File System Access
API support are required.

Start a dev server:

```bash
deno task dev
```

## Verify

```bash
deno task check
deno task build
deno task test:e2e
```

## Build

Build production assets:

```bash
deno task build
```
