import { expect, test } from "@playwright/test";

test("Explore directly shows photographed Google places with no pilot or source metadata", async ({
  page,
}) => {
  const external: string[] = [];
  const errors: string[] = [];
  page.on("request", (request) => {
    if (!request.url().startsWith("http://127.0.0.1:3100/"))
      external.push(request.url());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page).toHaveURL(/\/explore$/);
  await expect(page.getByRole("article")).toHaveCount(37);
  for (const name of [
    "Toko Kopi TUKU - Blok M",
    "Kambing Bakar Cairo Sambas",
  ]) {
    const card = page.getByRole("article", { name, exact: true });
    const img = card.getByRole("img", { name, exact: true });
    await img.scrollIntoViewIfNeeded();
    await expect
      .poll(() => img.evaluate((el: HTMLImageElement) => el.naturalWidth))
      .toBeGreaterThan(0);
    await expect(
      card.getByRole("link", { name: `View ${name}` }),
    ).toHaveAttribute("href", /\/restaurant\/osm-\d+$/);
    const photoBounds = (await img.boundingBox())!;
    const panelBounds = (await card
      .locator('div[class*="cardContent"]')
      .boundingBox())!;
    expect(panelBounds.x).toBeCloseTo(photoBounds.x, 0);
    expect(panelBounds.width).toBeCloseTo(photoBounds.width, 0);
  }
  await expect(page.getByRole("main")).not.toContainText(
    /pilot|OSM|Koordinat|Foto:|arsip|Chope|N\/A|Illustrative/i,
  );
  await expect(
    page.getByRole("article", { name: "Kedai Ramen Sore", exact: true }),
  ).toHaveCount(0);
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("main").evaluate((el) => el.scrollTo(0, 0));
  await page.screenshot({
    path: `test-results/google-explore-${test.info().project.name}.png`,
  });
});

test("search, categories and reset operate on actual names and keep URL state", async ({
  page,
}) => {
  await page.goto("/explore");
  const categories = page.getByRole("group", {
    name: "Restaurant categories",
    exact: true,
  });
  await categories.getByRole("button", { name: "Coffee", exact: true }).click();
  await expect(page).toHaveURL(/category=Coffee/);
  await expect(
    page.getByRole("article", { name: "Toko Kopi TUKU - Blok M", exact: true }),
  ).toBeVisible();
  await categories.getByRole("button", { name: "Korean", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "No places found" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Reset filters", exact: true })
    .click();
  const search = page.getByRole("searchbox", {
    name: "Find food, places or areas",
  });
  await search.fill("cairo");
  await search.press("Enter");
  await expect(page).toHaveURL(/q=cairo/);
  await expect(page.getByRole("article")).toHaveCount(1);
  await expect(
    page.getByRole("article", {
      name: "Kambing Bakar Cairo Sambas",
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  await expect(search).toHaveValue("cairo");
  await page
    .getByRole("link", { name: "View Kambing Bakar Cairo Sambas" })
    .click();
  await expect(page).toHaveURL(/q=cairo/);
  await page.getByRole("link", { name: "Back", exact: true }).click();
  await expect(page).toHaveURL(/explore\?q=cairo/);
});

test("bookmark and Wishlist share actual place state and support remove", async ({
  page,
}) => {
  await page.goto("/explore");
  const name = "Toko Kopi TUKU - Blok M";
  await page
    .getByRole("button", { name: `Save ${name} to wishlist`, exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: `Remove ${name} from wishlist`,
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("link", { name: "Wishlist", exact: true }).click();
  const card = page.getByRole("article", { name, exact: true });
  await expect(card).toBeVisible();
  await card.getByRole("link", { name, exact: true }).click();
  await expect(
    page.getByRole("button", { name: `Unsave ${name}`, exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: `Remove ${name} from wishlist`, exact: true })
    .click();
  await page.getByRole("link", { name: "Back", exact: true }).click();
  await expect(card).toHaveCount(0);
});

test("location, keyboard focus, responsive layouts and image failure have usable states", async ({
  page,
}) => {
  await page.goto("/explore");
  const area = page
    .getByRole("button", { name: "Choose location", exact: true })
    .first();
  await area.click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("heading", { name: "Choose your area" }),
  ).toBeVisible();
  await page.keyboard.press("Tab");
  expect(
    await dialog.evaluate((el) => el.contains(document.activeElement)),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(area).toBeFocused();
  await area.click();
  await dialog
    .getByRole("button", { name: "Tangerang Selatan · Bintaro", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "No places found" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Reset filters", exact: true })
    .click();
  await expect(page.getByRole("article")).toHaveCount(37);
  for (const size of [
    { width: 375, height: 812 },
    { width: 430, height: 932 },
    { width: 1280, height: 900 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(size);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.route("**/_next/image?*", (route) => route.abort());
  await page.route("**/google-places/*.jpg", (route) => route.abort());
  await page.reload();
  await expect(
    page
      .getByRole("article", { name: "Toko Kopi TUKU - Blok M", exact: true })
      .getByRole("img", { name: "Photo unavailable" }),
  ).toBeVisible();
});
