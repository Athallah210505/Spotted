import { expect, test } from "@playwright/test";

test("real data pilot is reachable from Explore and exposes provenance, missing fields and JSON", async ({
  page,
}) => {
  const providers: string[] = [];
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (
      /openstreetmap\.org|overpass|cafebatavia\.com|googleapis\.com/.test(
        request.url(),
      )
    )
      providers.push(request.url());
  });
  await page.goto("/explore");
  await page
    .getByRole("button", {
      name: "Remove Kedai Ramen Sore from wishlist",
      exact: true,
    })
    .click();
  await page
    .getByRole("link", { name: "Lihat pilot data Jakarta (OSM)" })
    .click();
  await expect(page).toHaveURL(/\/catalog$/);
  await expect(page.getByRole("article")).toHaveCount(40);
  await expect(
    page.getByRole("link", { name: "© OpenStreetMap contributors · ODbL" }),
  ).toHaveAttribute("href", "https://www.openstreetmap.org/copyright");
  await page.getByLabel("Cari nama, alamat, atau cuisine").fill("Batavia");
  await page.getByRole("button", { name: "Lihat data", exact: true }).click();
  await expect(
    page.getByRole("article", { name: "Cafe Batavia", exact: true }),
  ).toBeVisible();
  const source = page.getByRole("region", {
    name: "Ekstraksi website Cafe Batavia",
  });
  await expect(source).toContainText("Judul halaman: Batavia");
  await expect(
    source.getByRole("link", { name: "Tautan menu dari halaman sumber" }),
  ).toHaveAttribute("href", "https://cafebatavia.com/#section-menu");
  await expect(
    page.getByRole("link", { name: "Lihat titik OSM · node/4245907143" }),
  ).toHaveAttribute("href", "https://www.openstreetmap.org/node/4245907143");
  await page
    .getByRole("link", { name: "Reset pencarian", exact: true })
    .click();
  await expect(page).toHaveURL(/\/catalog$/);
  await expect(page.getByRole("article")).toHaveCount(40);
  await page.getByLabel("Area sampel", { exact: true }).selectOption("blok-m");
  await page.getByRole("button", { name: "Lihat data", exact: true }).click();
  await expect(page.getByRole("article")).toHaveCount(10);
  await page
    .getByLabel("Cari nama, alamat, atau cuisine")
    .fill("zxqv-no-such-place");
  await page.getByRole("button", { name: "Lihat data", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Tidak ada hasil" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Tampilkan semua titik" }).click();
  await expect(page.getByRole("article")).toHaveCount(40);
  const response = await page.request.get("/api/catalog");
  expect(response.status()).toBe(200);
  const json = await response.json();
  expect(json.places).toHaveLength(40);
  expect(json.license).toBe("ODbL-1.0");
  expect(json.places[0]).not.toHaveProperty("rating");
  expect(providers).toEqual([]);
  expect(errors).toEqual([]);
  await page.getByRole("link", { name: "Back", exact: true }).click();
  await expect(
    page.getByRole("button", {
      name: "Save Kedai Ramen Sore to wishlist",
      exact: true,
    }),
  ).toBeVisible();
});

test("catalogue is keyboard accessible and fits narrow, desktop, landscape and large text", async ({
  page,
}) => {
  await page.goto("/catalog?q=Batavia");
  await page.setViewportSize({ width: 390, height: 844 });
  const search = page.getByLabel("Cari nama, alamat, atau cuisine");
  await search.focus();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Area sampel", { exact: true })).toBeFocused();
  for (const viewport of [
    { width: 375, height: 812 },
    { width: 430, height: 932 },
    { width: 1280, height: 900 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    document.querySelector("main")?.scrollTo(0, 0);
  });
  await page.screenshot({
    path: `test-results/catalog-${test.info().project.name}.png`,
  });
  await page.evaluate(() => {
    const leaves = [...document.querySelectorAll<HTMLElement>("main *")].filter(
      (element) => !element.children.length && element.tagName !== "IMG",
    );
    const sizes = leaves.map((element) => ({
      element,
      size: parseFloat(getComputedStyle(element).fontSize),
      line: parseFloat(getComputedStyle(element).lineHeight),
    }));
    for (const { element, size, line } of sizes) {
      element.style.fontSize = `${size * 2}px`;
      if (Number.isFinite(line)) element.style.lineHeight = `${line * 2}px`;
    }
  });
  expect(
    await page
      .locator("main")
      .evaluate((element) => element.scrollWidth <= element.clientWidth),
  ).toBe(true);
});
