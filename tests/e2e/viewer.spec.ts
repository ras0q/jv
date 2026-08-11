import { expect, test } from "@playwright/test";

test("shows guidance when the File System Access API is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(globalThis, "showDirectoryPicker", {
      configurable: true,
      value: undefined,
    });
  });
  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText(
    "This browser cannot read folders",
  );
});

test("loads, restores URL selection, and supports keyboard selection", async ({ page }) => {
  await page.addInitScript(() => {
    const files: Record<string, string> = {};
    for (let day = 1; day <= 25; day += 1) {
      const date = `2026-08-${String(day).padStart(2, "0")}`;
      files[date] = `## Journal\nEntry ${day}`;
    }
    globalThis.__JOURNAL_VIEWER_TEST_DATA__ = {
      ...files,
      "2026-08-25": "## Journal\n### 09:00\nToday **recorded**",
    };
  });

  await page.goto("/?date=2026-08-01");
  await expect(
    page.getByText("j/k or ↑/↓: entries · h/l or ←/→: panes"),
  ).toBeVisible();
  const directoryButton = page.getByRole("button", {
    name: "Choose another folder; current folder: Daily",
  });
  await expect(directoryButton).toHaveText("Daily");
  const selected = page.locator('[aria-current="true"]');
  await expect(selected).toContainText("2026-08-01");
  await expect(page.locator("#feed-title, #detail-title")).toHaveCount(0);

  const latest = page.locator('[data-journal-date="2026-08-25"]');
  await expect(latest.getByRole("heading", { level: 2 })).toHaveText(
    "2026-08-25",
  );
  await expect(latest.getByRole("heading", { level: 3 })).toHaveText("09:00");
  const [dateHeadingSize, timeHeadingSize] = await latest.locator("h2, h3")
    .evaluateAll((headings) =>
      headings.map((heading) =>
        Number.parseFloat(getComputedStyle(heading).fontSize)
      )
    );
  expect(dateHeadingSize).toBeGreaterThan(timeHeadingSize);
  await expect(page.locator("header")).toHaveCSS("border-bottom-width", "1px");
  await latest.focus();
  await latest.press("j");
  const previous = page.locator('[data-journal-date="2026-08-24"]');
  await expect(previous).toHaveCSS("border-top-width", "1px");
  await expect(previous).toBeFocused();
  await expect(previous).toHaveAttribute("aria-current", "true");
  await expect(page).toHaveURL(/date=2026-08-24/);

  await previous.press("k");
  await expect(latest).toBeFocused();
  await expect(page).toHaveURL(/date=2026-08-25/);

  await latest.press("ArrowDown");
  await expect(previous).toBeFocused();
  await previous.press("ArrowUp");
  await expect(latest).toBeFocused();

  const detail = page.getByLabel("Three-year journal");
  await expect(detail).toHaveCSS("border-left-width", "0px");
  await expect(detail.getByRole("heading", { level: 2 })).toHaveCount(3);
  await expect(detail.locator(":scope > section").nth(1)).toHaveCSS(
    "border-top-width",
    "1px",
  );
  await expect(detail.getByText("No Daily Note")).toHaveCount(2);
  await latest.press("l");
  await expect(detail).toBeFocused();
  await detail.press("h");
  await expect(latest).toBeFocused();
  await latest.press("ArrowRight");
  await expect(detail).toBeFocused();
  await detail.press("ArrowLeft");
  await expect(latest).toBeFocused();
});

test("updates and restores viewer settings", async ({ page }) => {
  await page.addInitScript(() => {
    globalThis.__JOURNAL_VIEWER_TEST_DATA__ = {
      "2024-08-11": "## Notes\nEntry 2024",
      "2025-08-11": "## Notes\nEntry 2025",
      "2026-08-11": "## Notes\nEntry 2026",
    };
  });

  await page.goto("/");
  await expect(page.getByText("No recorded journals.")).toBeVisible();
  await page.getByRole("button", { name: "Settings" }).click();

  const dialog = page.getByRole("dialog", { name: "Settings" });
  await dialog.getByLabel("Section heading").fill("Notes");
  await dialog.getByLabel("Comparison years").fill("2");
  await dialog.getByRole("button", { name: "Save" }).click();

  await expect(page.locator('[data-journal-date="2026-08-11"]')).toBeVisible();
  await expect(
    page.getByLabel("Three-year journal").getByRole("heading", { level: 2 }),
  ).toHaveCount(2);

  await page.reload();
  await page.getByRole("button", { name: "Settings" }).click();
  await expect(dialog.getByLabel("Section heading")).toHaveValue("Notes");
  await expect(dialog.getByLabel("Comparison years")).toHaveValue("2");
});
