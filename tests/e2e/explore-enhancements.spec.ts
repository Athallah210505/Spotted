import { expect, test } from "@playwright/test";
import published from "../../src/features/catalog/data/google-places.json" with { type: "json" };

test("quick filters keep search state and react to saved places", async ({
  page,
}) => {
  await page.goto("/explore?q=tuku");
  const quick = page.getByRole("group", { name: "Quick filters", exact: true });
  const rating = quick.getByRole("button", { name: "4.5+ rated", exact: true });
  const saved = quick.getByRole("button", { name: /^Saved places/ });
  await rating.click();
  await expect(page).toHaveURL(/q=tuku.*rating=4.5/);
  await expect(rating).toHaveAttribute("aria-pressed", "true");
  await saved.click();
  await expect(page).toHaveURL(/saved=1/);
  await expect(
    page.getByRole("heading", { name: "No places found" }),
  ).toBeVisible();
  await expect(page.getByRole("main")).toContainText(
    "Belum ada tempat tersimpan",
  );
  await saved.click();
  const card = page.getByRole("article", {
    name: "Toko Kopi TUKU - Blok M",
    exact: true,
  });
  await card.getByRole("button", { name: /^Save / }).click();
  await expect(saved).toHaveText("Saved places 1");
  await saved.click();
  await expect(page).toHaveURL(/saved=1/);
  await expect(saved).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("article")).toHaveCount(1);
  await card.getByRole("link", { name: /^View / }).click();
  await page.getByRole("link", { name: "Back", exact: true }).click();
  await expect(saved).toHaveAttribute("aria-pressed", "true");
  await expect(rating).toHaveAttribute("aria-pressed", "true");
  await card.getByRole("button", { name: /^Remove / }).click();
  await expect(
    page.getByRole("heading", { name: "No places found" }),
  ).toBeVisible();
  await expect(saved).toHaveText("Saved places 0");
});

test("visitor photo rail opens real menu details and fits narrow screens", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/explore");
  await expect(page.getByRole("article")).toHaveCount(published.length);
  const first = page.getByRole("article").first();
  await expect(first).toContainText("reviews");
  await expect(
    page.getByRole("link", { name: "Filters", exact: true }),
  ).toBeInViewport();
  await page.screenshot({
    path: `test-results/explore-enhanced-${test.info().project.name}.png`,
  });
  const rail = page.getByRole("group", {
    name: "Visitor menu photos",
    exact: true,
  });
  await rail.scrollIntoViewIfNeeded();
  await expect(rail.getByRole("link")).toHaveCount(12);
  const photo = rail.getByRole("img", {
    name: "Kopi Susu Tetangga",
    exact: true,
  });
  await expect
    .poll(() => photo.evaluate((el: HTMLImageElement) => el.naturalWidth))
    .toBeGreaterThan(0);
  await rail.getByRole("link").first().focus();
  await expect(rail.getByRole("link").first()).toBeFocused();
  await page.screenshot({
    path: `test-results/explore-menu-rail-${test.info().project.name}.png`,
  });
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/restaurant\/osm-12110042118\?tab=menu$/);
  await expect(
    page.getByRole("region", { name: "Menu dari Google reviews", exact: true }),
  ).toContainText("Kopi Susu Tetangga");
  await page.getByRole("link", { name: "Back", exact: true }).click();
  for (const width of [320, 375, 430, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(await rail.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(
      true,
    );
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(first).toHaveCSS("animation-name", "none");
});
