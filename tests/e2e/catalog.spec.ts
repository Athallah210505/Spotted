import { expect, test } from "@playwright/test";
import {
  catalogDetailHref,
  googleMapsUrl,
} from "../../src/features/catalog/catalog-media";

test("homepage rating leads to Overview, Menu and Reviews before opening Maps", async ({
  page,
}) => {
  await page.route("https://www.google.com/maps/**", (route) =>
    route.fulfill({ contentType: "text/html", body: "Maps test destination" }),
  );
  await page.goto("/");
  await expect(page).toHaveURL(/\/explore$/);
  const section = page.getByRole("region", { name: "Tempat nyata di Jakarta" });
  const card = section.getByRole("article", {
    name: "Cafe Batavia",
    exact: true,
  });
  const image = card.getByRole("img");
  await image.scrollIntoViewIfNeeded();
  await expect(image).toBeVisible();
  await expect
    .poll(() =>
      image.evaluate((element: HTMLImageElement) => element.naturalWidth),
    )
    .toBeGreaterThan(0);
  const snapshot = await (await page.request.get("/api/catalog")).json();
  const batavia = snapshot.places.find(
    (place: { name: string }) => place.name === "Cafe Batavia",
  )!;
  await expect(
    card.getByRole("link", { name: "Lihat detail Cafe Batavia", exact: true }),
  ).toHaveAttribute("href", catalogDetailHref(batavia));
  await expect(
    card.getByLabel("4.8 dari 5 · Chope, snapshot sumber"),
  ).toBeVisible();
  await expect(
    card.getByRole("link", { name: "Buka Google Maps", exact: true }),
  ).toHaveCount(0);
  await expect(
    card.getByRole("link", { name: "Foto: Hkurniawan" }),
  ).toHaveAttribute(
    "href",
    "https://commons.wikimedia.org/wiki/File:Cafe_Batavia,_Jakarta.jpg",
  );
  await expect(card.getByRole("link", { name: "CC BY-SA 3.0" })).toBeVisible();
  await expect(section).toContainText("bukan penjual tertentu");
  for (const width of [375, 430, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await card.screenshot({
    path: `test-results/home-real-place-${test.info().project.name}.png`,
  });
  await card.getByRole("link", { name: /lihat detail$/ }).click();
  await expect(page).toHaveURL(new RegExp(`${catalogDetailHref(batavia)}$`));
  await expect(
    page.getByRole("heading", { name: "Cafe Batavia", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Overview", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(
    page.getByRole("region", { name: "Overview tempat" }),
  ).toContainText(batavia.address);
  await expect(
    page.getByRole("link", { name: "Buka Google Maps", exact: true }),
  ).toHaveAttribute("href", googleMapsUrl(batavia));
  await page.screenshot({
    path: `test-results/real-overview-${test.info().project.name}.png`,
  });
  await page.getByRole("link", { name: "Menu", exact: true }).click();
  await expect(page).toHaveURL(/tab=menu/);
  await expect(
    page.getByRole("link", { name: "Buka menu di website" }),
  ).toHaveAttribute("href", "https://cafebatavia.com/#section-menu");
  await page.reload();
  await expect(
    page.getByRole("link", { name: "Menu", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await page.getByRole("link", { name: "Reviews", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Reviews tempat" }),
  ).toContainText("4.8/5 · 38 ulasan di Chope");
  await expect(page.getByText(/Rating snapshot Chope/)).toBeVisible();
  const popupPromise = page.waitForEvent("popup");
  await page
    .getByRole("link", { name: "Buka Google Maps", exact: true })
    .click();
  const popup = await popupPromise;
  await expect(popup).toHaveURL(googleMapsUrl(batavia));
  await popup.close();
  await page.getByRole("link", { name: "Back", exact: true }).click();
  await expect(page).toHaveURL(/\/explore$/);
  await card
    .getByRole("link", { name: "Lihat detail Cafe Batavia", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Overview", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Back", exact: true }).click();
  await page
    .getByRole("link", { name: "Lihat semua 40 tempat", exact: true })
    .click();
  await expect(page).toHaveURL(/\/catalog$/);
  const links = page.getByRole("link", {
    name: "Lihat detail",
    exact: true,
  });
  await expect(links).toHaveCount(40);
  const api = await page.request.get("/api/catalog");
  const json = await api.json();
  expect(
    json.places.every((place: { googleMapsUrl: string }) =>
      place.googleMapsUrl.startsWith(
        "https://www.google.com/maps/search/?api=1&query=",
      ),
    ),
  ).toBe(true);
  expect(
    json.places.filter((place: { photo: unknown }) => place.photo),
  ).toHaveLength(2);
  expect(
    json.places.find((place: { name: string }) => place.name === "Cafe Batavia")
      .sourceRating.provider,
  ).toBe("Chope");
  await page
    .getByRole("article", { name: "Gulai Tikungan Blok M", exact: true })
    .getByRole("link", { name: "Lihat detail", exact: true })
    .click();
  await expect(
    page.getByLabel("Rating belum tersedia", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Menu", exact: true }).click();
  await expect(page.getByRole("region", { name: "Menu tempat" })).toContainText(
    "Menu belum tersedia",
  );
  await page.getByRole("link", { name: "Reviews", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Reviews tempat" }),
  ).toContainText("Rating dan ulasan belum tersedia");
  await page.getByRole("link", { name: "Back", exact: true }).click();
  await expect(page).toHaveURL(/\/catalog$/);
  const unknown = await page.request.get("/restaurant/osm-0000");
  expect(unknown.status()).toBe(404);
  await page.route("**/catalog/cafe-batavia.jpg*", (route) => route.abort());
  await page.route("**/_next/image?*", (route) => route.abort());
  await page.goto("/explore");
  const failed = page
    .getByRole("region", { name: "Tempat nyata di Jakarta" })
    .getByRole("article", { name: "Cafe Batavia", exact: true });
  await expect(
    failed.getByRole("img", { name: "Photo unavailable" }),
  ).toBeVisible();
  await expect(
    failed.getByRole("link", {
      name: "Lihat detail Cafe Batavia",
      exact: true,
    }),
  ).toHaveAttribute("href", catalogDetailHref(batavia));
});

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
