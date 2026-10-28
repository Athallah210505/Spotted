import { expect, test } from "@playwright/test";
import published from "../../src/features/catalog/data/google-places.json" with { type: "json" };

test("Explore controls stay before full-width cards across navigation and reduced motion", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/explore");
  const filters = page.getByRole("link", { name: "Filters", exact: true });
  await expect(filters).toBeInViewport();
  const card = page.getByRole("article").first();
  const photo = card.getByRole("img", {
    name: "Toko Kopi TUKU - Blok M",
    exact: true,
  });
  await expect(photo).toBeVisible();
  expect((await filters.boundingBox())!.y).toBeLessThan(
    (await photo.boundingBox())!.y,
  );
  await filters.click();
  await expect(
    page.getByRole("heading", { name: "Filter your cravings" }),
  ).toBeVisible();
  const rating = page.getByRole("group", {
    name: "Google rating",
    exact: true,
  });
  await rating.getByRole("button", { name: "4.5+", exact: true }).click();
  await expect(
    rating.getByRole("button", { name: "4.5+", exact: true }),
  ).toHaveCSS("background-color", "rgb(255, 226, 136)");
  const apply = page.getByRole("link", { name: /^Show \d+ places?$/ });
  await expect(apply).toBeInViewport();
  await page
    .getByRole("main")
    .evaluate((el) => el.scrollTo(0, el.scrollHeight));
  await expect(apply).toBeInViewport();
  await page
    .getByRole("button", { name: "Reset filters", exact: true })
    .click();
  await expect(
    page.getByRole("link", {
      name: `Show ${published.length} places`,
      exact: true,
    }),
  ).toBeInViewport();
  await page
    .getByRole("link", { name: `Show ${published.length} places`, exact: true })
    .click();
  for (const width of [375, 390, 430, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    const photoBounds = (await photo.boundingBox())!;
    const panelBounds = (await card
      .locator('div[class*="cardContent"]')
      .boundingBox())!;
    expect(panelBounds.x).toBeCloseTo(photoBounds.x, 0);
    expect(panelBounds.width).toBeCloseTo(photoBounds.width, 0);
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(card).toHaveCSS("animation-name", "none");
});

test("Menu shows an actual Google review dish photo and a factual Overview", async ({
  page,
}) => {
  await page.goto("/restaurant/osm-12110042118?tab=menu");
  await expect(
    page.getByRole("region", { name: "Tentang tempat", exact: true }),
  ).toContainText("nonkopi, serta kue dan donat");
  const menu = page.getByRole("region", {
    name: "Menu dari Google reviews",
    exact: true,
  });
  const image = menu.getByRole("img", {
    name: "Kopi Susu Tetangga",
    exact: true,
  });
  await image.scrollIntoViewIfNeeded();
  await expect
    .poll(() => image.evaluate((el: HTMLImageElement) => el.naturalWidth))
    .toBeGreaterThan(0);
  await expect(
    menu.getByRole("link", {
      name: "Lihat foto Kopi Susu Tetangga",
      exact: true,
    }),
  ).toHaveAttribute("href", /^\/google-menus\//);
  await expect(menu).toContainText("Pilihan dari foto pengunjung di Google");
  await expect(menu).not.toContainText(/Rp\d/);
  await page.screenshot({
    path: `test-results/menu-polish-${test.info().project.name}.png`,
  });
});
