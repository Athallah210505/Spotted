import { expect, test } from "@playwright/test";
import { stubMapTiles } from "./map-fixture";

test.beforeEach(async ({ page }) => {
  await stubMapTiles(page);
});

test("real map pans, zooms and opens matched Google places before detail", async ({
  page,
}) => {
  await page.goto("/map?radius=1");
  const map = page.getByRole("region", { name: "Peta tempat makan" });
  await expect(map).toHaveAttribute("data-zoom", "14");
  await expect(map.locator(".leaflet-marker-icon")).toHaveCount(32);
  await expect(
    page.getByRole("button", { name: "Change map area" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Search This Area" }),
  ).toHaveCount(0);
  await expect(
    map.getByRole("link", { name: "OpenStreetMap", exact: true }),
  ).toBeVisible();
  await map.getByRole("button", { name: "Perbesar peta", exact: true }).click();
  await expect(map).toHaveAttribute("data-zoom", "15");
  await map.getByRole("button", { name: "Perkecil peta", exact: true }).click();
  await expect(map).toHaveAttribute("data-zoom", "14");
  const before = await map.getAttribute("data-center");
  const bounds = (await map.boundingBox())!;
  await page.mouse.move(
    bounds.x + bounds.width / 2,
    bounds.y + bounds.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    bounds.x + bounds.width / 2 + 70,
    bounds.y + bounds.height / 2 + 50,
    { steps: 10 },
  );
  await page.mouse.up();
  await expect(map).not.toHaveAttribute("data-center", before!);
  const marker = map.getByRole("button", {
    name: "Toko Kopi TUKU - Blok M, rating 4.8",
    exact: true,
  });
  await marker.focus();
  await page.keyboard.press("Enter");
  await expect(map.locator(".leaflet-popup")).toContainText(
    "Toko Kopi TUKU - Blok M",
  );
  await map.getByRole("link", { name: "Lihat detail", exact: true }).click();
  await expect(page).toHaveURL(/restaurant\/osm-12110042118\?from=map$/);
  await page.getByRole("link", { name: "Reviews", exact: true }).click();
  await expect(page).toHaveURL(/tab=reviews&from=map/);
  await page.getByRole("link", { name: "Back", exact: true }).click();
  await expect(page).toHaveURL(/\/map$/);
  await expect(
    page.getByRole("region", { name: "Peta tempat makan" }),
  ).toHaveAttribute("data-zoom", "14");
});

test("location stays opt-in and centers on the permitted browser position", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({
    latitude: -6.1754,
    longitude: 106.8272,
    accuracy: 20,
  });
  await page.goto("/map");
  const map = page.getByRole("region", { name: "Peta tempat makan" });
  await expect(map).toHaveAttribute("data-center", "-6.24400,106.80000");
  await page.getByRole("button", { name: "Gunakan lokasi saya" }).click();
  await expect
    .poll(
      async () =>
        (await map.getAttribute("data-center"))?.split(",").map(Number)[0],
    )
    .toBeCloseTo(-6.1754, 4);
  const center = (await map.getAttribute("data-center"))!
    .split(",")
    .map(Number);
  expect(center[1]).toBeCloseTo(106.8272, 4);
  await expect(map).toHaveAttribute("data-zoom", "15");
  await expect(page.getByRole("status")).toContainText(
    "Peta mengikuti lokasi Anda",
  );
  expect(new URL(page.url()).search).toBe("");
  await page.screenshot({
    path: `test-results/interactive-map-${test.info().project.name}.png`,
  });
});

test("denied location and timeout keep the map usable and allow retry", async ({
  page,
}) => {
  await page.addInitScript(() => {
    let attempt = 0;
    Object.defineProperty(navigator.geolocation, "getCurrentPosition", {
      value: (success: PositionCallback, error: PositionErrorCallback) => {
        attempt++;
        if (attempt <= 2)
          error({ code: attempt === 1 ? 1 : 3 } as GeolocationPositionError);
        else
          success({
            coords: { latitude: -6.2, longitude: 106.8, accuracy: 30 },
          } as GeolocationPosition);
      },
    });
  });
  await page.goto("/map");
  const locate = page.getByRole("button", { name: "Gunakan lokasi saya" });
  await locate.click();
  await expect(page.getByRole("status")).toContainText("Izin lokasi ditolak");
  await locate.click();
  await expect(page.getByRole("status")).toContainText(
    "Pencarian lokasi terlalu lama",
  );
  await locate.click();
  await expect(
    page.getByRole("region", { name: "Peta tempat makan" }),
  ).toHaveAttribute("data-center", "-6.20000,106.80000");
  for (const width of [375, 430, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(
      page.getByRole("navigation", { name: "Main navigation" }),
    ).toBeInViewport();
  }
});

test("failed tiles expose retry without pretending the road map loaded", async ({
  page,
}) => {
  await page.route("https://tile.openstreetmap.org/**", (route) =>
    route.abort(),
  );
  await page.goto("/map");
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Peta jalan belum termuat",
  );
  await stubMapTiles(page);
  await page.getByRole("button", { name: "Coba lagi", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
});
