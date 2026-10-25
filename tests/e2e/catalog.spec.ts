import { expect, test } from "@playwright/test";

test("legacy catalogue opens Explore and API exposes Google fields without runtime provider calls", async ({
  page,
}) => {
  await page.goto("/catalog");
  await expect(page).toHaveURL(/\/explore$/);
  const response = await page.request.get("/api/catalog");
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toBe("no-store");
  const data = await response.json();
  expect(data.schemaVersion).toBe(2);
  expect(data.source).toBe("Google Maps");
  expect(data.places).toHaveLength(32);
  for (const p of data.places) {
    expect(p.rating).toBeGreaterThan(0);
    expect(p.reviewCount).toBeGreaterThan(0);
    expect(p.photoPath).toMatch(/^\/google-places\//);
    expect(p.reviews.length).toBe(1);
    expect(p.mapsUrl).toContain("https://www.google.com/maps/");
  }
});

test("Google Overview follows the editorial design, expands weekly hours and opens real reviews before Maps", async ({
  page,
}) => {
  await page.route("https://www.google.com/maps/**", (route) =>
    route.fulfill({ contentType: "text/html", body: "Maps target" }),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/explore?q=tuku");
  await page
    .getByRole("link", { name: "View Toko Kopi TUKU - Blok M", exact: true })
    .click();
  await expect(page).toHaveURL(/restaurant\/osm-12110042118\?q=tuku$/);
  const h = page.getByRole("heading", {
    name: "Toko Kopi TUKU - Blok M",
    level: 1,
    exact: true,
  });
  await expect(h).toBeVisible();
  await expect(h).toHaveCSS("font-size", "34px");
  const rating = page.getByLabel("4.8 Google rating from 2450 reviews");
  await expect(rating.locator("strong")).toHaveCSS("border-radius", "16px");
  await expect(rating.locator("strong")).toHaveCSS("height", "64px");
  await expect(page.getByRole("link", { name: "Menu", exact: true })).toHaveCSS(
    "background-color",
    "rgb(23, 23, 23)",
  );
  await expect(page.getByRole("main")).not.toContainText(
    /OSM|Koordinat|Foto:|arsip|snapshot|Chope|website yang tercantum/i,
  );
  const hours = page.locator("details");
  await hours.locator("summary").click();
  await expect(
    page.getByRole("table", { name: "Jam buka mingguan" }),
  ).toBeVisible();
  await expect(page.getByRole("row", { name: /Jumat/ })).toContainText(
    "07.00–11.35 12.50–21.00",
  );
  await hours.locator("summary").click();
  await page.getByRole("main").evaluate((el) => el.scrollTo(0, 0));
  await page.screenshot({
    path: `test-results/google-detail-${test.info().project.name}.png`,
  });
  await page.getByRole("link", { name: "Reviews", exact: true }).click();
  await expect(page).toHaveURL(/tab=reviews&q=tuku/);
  const review = page.getByRole("article", { name: "Review Radja Sitanggang" });
  await expect(review).toBeVisible();
  await expect(review).toContainText("Toko Kopi Tuku menyajikan minuman kopi");
  await expect(
    review.getByRole("link", { name: "Radja Sitanggang" }),
  ).toHaveAttribute("href", /google.com\/maps\/contrib\//);
  await expect(
    page.getByRole("link", { name: "Lihat semua ulasan di Google Maps" }),
  ).toHaveAttribute("href", /google.com\/maps\//);
  const popupPromise = page.waitForEvent("popup");
  await page
    .getByRole("link", { name: "Buka Google Maps", exact: true })
    .click();
  const popup = await popupPromise;
  await expect(popup).toHaveURL(/google.com\/maps\//);
  await popup.close();
  await page.getByRole("link", { name: "TikTok", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Not available yet", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Back", exact: true }).click();
  await expect(page).toHaveURL(/explore\?q=tuku$/);
  const unknown = await page.request.get("/restaurant/osm-0000");
  expect(unknown.status()).toBe(404);
});

test("Google ratings drive filter counts and sort results", async ({
  page,
}) => {
  await page.goto("/explore");
  await page.getByRole("link", { name: "Filters", exact: true }).click();
  await page
    .getByRole("group", { name: "Cuisine", exact: true })
    .getByRole("button", { name: "Coffee", exact: true })
    .click();
  await page
    .getByRole("group", { name: "Google rating", exact: true })
    .getByRole("button", { name: "4.5+", exact: true })
    .click();
  await expect(
    page.getByRole("group", { name: "Price level", exact: true }),
  ).toHaveCount(0);
  const count = Number(
    (await page.getByRole("status").innerText()).match(/^\d+/)![0],
  );
  expect(count).toBeGreaterThan(0);
  await page.getByRole("link", { name: new RegExp(`^Show ${count} `) }).click();
  await expect(page.getByRole("article")).toHaveCount(count);
  await expect(
    page.getByRole("article", { name: "Toko Kopi TUKU - Blok M", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: /^Sort places:/ }).click();
  await page.getByRole("link", { name: "Highest Rated", exact: true }).click();
  const values = await page
    .getByRole("article")
    .locator('p[aria-label*="Google rating"] strong')
    .allTextContents();
  expect(values.map(Number)).toEqual(values.map(Number).sort((a, b) => b - a));
  for (const width of [375, 430, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
