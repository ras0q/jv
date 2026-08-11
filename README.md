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

## Deploy

Authenticate Wrangler once:

```bash
deno run -A wrangler login
```

Build and deploy the static assets to `https://jv.ras0q.com` through Cloudflare
Workers:

```bash
deno task deploy
```

Every push also runs checks, builds the application, and deploys it through
GitHub Actions. Configure these repository secrets before enabling the workflow:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

The API token should be limited to the account and zone used by this Worker.
