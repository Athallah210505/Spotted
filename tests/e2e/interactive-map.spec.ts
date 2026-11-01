import { expect, test } from "@playwright/test";
import { stubMapTiles } from "./map-fixture";

test.beforeEach(async ({ page }) => {
  await stubMapTiles(page);
});

test("database map pans, zooms and loads grouped places", async ({ page }) => {
  await page.goto("/map?radius=1");
  const map = page.getByRole("region", { name: "Peta tempat makan" });
  await expect(map).toHaveAttribute("data-zoom", "14");
  await expect
    .poll(async () => Number(await map.getAttribute("data-places")))
    .toBeGreaterThan(104);
  expect(await map.locator(".leaflet-marker-icon").count()).toBeLessThan(100);
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
    .toBeCloseTo(-6.1754, 3);
  const center = (await map.getAttribute("data-center"))!
    .split(",")
    .map(Number);
  expect(center[1]).toBeCloseTo(106.8272, 3);
  await expect(
    map.getByRole("button", { name: "Lokasi Anda", exact: true }),
  ).toBeVisible();
  await expect(
    map.getByRole("img", { name: "Radius 1 km", exact: true }),
  ).toHaveAttribute("data-radius-meters", "1000");
  await expect(page.getByRole("status")).toContainText("Lokasi Anda ditemukan");
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
    Object.defineProperty(navigator.geolocation, "clearWatch", {
      value: () => {},
    });
    Object.defineProperty(navigator.geolocation, "watchPosition", {
      value: (success: PositionCallback, error: PositionErrorCallback) => {
        const id = ++attempt;
        queueMicrotask(() => {
          if (id <= 3)
            error({ code: id === 1 ? 1 : 3 } as GeolocationPositionError);
          else
            success({
              coords: { latitude: -6.2, longitude: 106.8, accuracy: 30 },
            } as GeolocationPosition);
        });
        return id;
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
  await expect
    .poll(
      async () =>
        (
          await page
            .getByRole("region", { name: "Peta tempat makan" })
            .getAttribute("data-center")
        )
          ?.split(",")
          .map(Number)[0],
    )
    .toBeCloseTo(-6.2, 3);
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

test("manual pin and radius work without location permission and survive pin dragging", async ({
  page,
}) => {
  await page.goto("/map");
  const map = page.getByRole("region", { name: "Peta tempat makan" });
  const radii = page.getByRole("group", { name: "Radius dari titik Anda" });
  await page.getByRole("button", { name: "Pilih titik", exact: true }).click();
  await map.click({ position: { x: 80, y: 100 } });
  const pin = map.getByRole("button", {
    name: "Titik pilihan Anda",
    exact: true,
  });
  await expect(pin).toBeVisible();
  await expect(map).toHaveClass(/leaflet-container/);
  await expect(
    map.getByRole("img", { name: "Radius 1 km", exact: true }),
  ).toHaveAttribute("data-radius-meters", "1000");
  const before = await map.getAttribute("data-center");
  const bounds = (await pin.boundingBox())!;
  await page.mouse.move(
    bounds.x + bounds.width / 2,
    bounds.y + bounds.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    bounds.x + bounds.width / 2 + 55,
    bounds.y + bounds.height / 2 + 35,
    { steps: 10 },
  );
  await page.mouse.up();
  await expect(map).not.toHaveAttribute("data-center", before!);
  for (const radius of [3, 5, 10, 1]) {
    const button = radii.getByRole("button", {
      name: `${radius} km`,
      exact: true,
    });
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(
      map.getByRole("img", { name: `Radius ${radius} km`, exact: true }),
    ).toHaveAttribute("data-radius-meters", String(radius * 1000));
    await expect(
      page.getByText(new RegExp(`^[\\d.]+ tempat dalam radius ${radius} km$`)),
    ).toBeVisible();
  }
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }),
  ).toBeInViewport();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("keyboard center placement takes precedence over a late GPS response", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator.geolocation, "clearWatch", {
      value: () => {},
    });
    Object.defineProperty(navigator.geolocation, "watchPosition", {
      value: (success: PositionCallback) => {
        (window as unknown as { resolveLocation: () => void }).resolveLocation =
          () =>
            success({
              coords: { latitude: -6.1, longitude: 106.9, accuracy: 20 },
            } as GeolocationPosition);
        return 1;
      },
    });
  });
  await page.goto("/map");
  await page.getByRole("button", { name: "Gunakan lokasi saya" }).click();
  await page.getByRole("button", { name: "Pilih titik", exact: true }).click();
  const center = page.getByRole("button", {
    name: "Gunakan titik tengah peta",
    exact: true,
  });
  await center.focus();
  await page.keyboard.press("Enter");
  const map = page.getByRole("region", { name: "Peta tempat makan" });
  await expect(
    map.getByRole("button", { name: "Titik pilihan Anda", exact: true }),
  ).toBeVisible();
  const position = await map.getAttribute("data-center");
  await page.evaluate(() =>
    (window as unknown as { resolveLocation: () => void }).resolveLocation(),
  );
  await expect(map).toHaveAttribute("data-center", position!);
  await expect(
    map.getByRole("button", { name: "Lokasi Anda", exact: true }),
  ).toHaveCount(0);
  await map.focus();
  await page.keyboard.press("ArrowRight");
  await expect(map).not.toHaveAttribute("data-center", position!);
  await map
    .getByRole("button", { name: "Titik pilihan Anda", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(map).toHaveAttribute("data-center", position!);
  await page.screenshot({
    path: `test-results/map-personal-radius-${test.info().project.name}.png`,
  });
});

test("live GPS updates the pin, preserves manual panning and stops on leaving Map", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({
    latitude: -6.244,
    longitude: 106.8,
    accuracy: 20,
  });
  await page.addInitScript(() => {
    const clear = navigator.geolocation.clearWatch.bind(navigator.geolocation);
    Object.defineProperty(navigator.geolocation, "clearWatch", {
      value: (id: number) => {
        document.documentElement.dataset.watchCleared = "true";
        clear(id);
      },
    });
  });
  await page.goto("/map");
  const map = page.getByRole("region", { name: "Peta tempat makan" });
  const locate = page.getByRole("button", { name: "Gunakan lokasi saya" });
  await locate.click();
  await expect(locate).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByText("Akurasi lokasi ±20 m", { exact: true }),
  ).toBeVisible();
  await context.setGeolocation({
    latitude: -6.239,
    longitude: 106.805,
    accuracy: 10,
  });
  await expect
    .poll(async () =>
      Number((await map.getAttribute("data-center"))?.split(",")[0]),
    )
    .toBeCloseTo(-6.239, 3);
  const box = (await map.boundingBox())!;
  await page.mouse.move(box.x + 15, box.y + 30);
  await page.mouse.down();
  await page.mouse.move(box.x + 80, box.y + 75, { steps: 10 });
  await page.mouse.up();
  await expect
    .poll(async () =>
      Number((await map.getAttribute("data-center"))?.split(",")[0]),
    )
    .not.toBeCloseTo(-6.239, 4);
  // Let Leaflet finish inertial panning before checking that GPS preserves the view.
  await page.waitForTimeout(400);
  const panned = await map.getAttribute("data-center");
  await context.setGeolocation({
    latitude: -6.238,
    longitude: 106.806,
    accuracy: 15,
  });
  await expect(
    page.getByText("Akurasi lokasi ±15 m", { exact: true }),
  ).toBeVisible();
  await expect(map).toHaveAttribute("data-center", panned!);
  await page
    .getByRole("button", { name: "Hentikan pelacakan", exact: true })
    .click();
  await expect(locate).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("html")).toHaveAttribute(
    "data-watch-cleared",
    "true",
  );
  await expect(page.getByRole("status")).toContainText("Pelacakan dihentikan");
  await context.setGeolocation({
    latitude: -6.23,
    longitude: 106.81,
    accuracy: 5,
  });
  await expect(
    page.getByText("Akurasi lokasi ±15 m", { exact: true }),
  ).toBeVisible();
  await page.evaluate(
    () => delete document.documentElement.dataset.watchCleared,
  );
  await locate.click();
  await expect(
    page.getByText("Akurasi lokasi ±5 m", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Explore", exact: true }).click();
  await expect(page).toHaveURL(/\/explore$/);
  await expect(page.locator("html")).toHaveAttribute(
    "data-watch-cleared",
    "true",
  );
});

test("GPS failure retries network positioning and manual selection cancels tracking", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator.geolocation, "clearWatch", {
      value: () => {},
    });
    Object.defineProperty(navigator.geolocation, "watchPosition", {
      value: (
        success: PositionCallback,
        error: PositionErrorCallback,
        options: PositionOptions,
      ) => {
        queueMicrotask(() => {
          if (options.enableHighAccuracy)
            error({ code: 3 } as GeolocationPositionError);
          else
            success({
              coords: { latitude: -6.24, longitude: 106.8, accuracy: 150 },
            } as GeolocationPosition);
        });
        return options.enableHighAccuracy ? 1 : 2;
      },
    });
  });
  await page.goto("/map");
  await page.getByRole("button", { name: "Gunakan lokasi saya" }).click();
  await expect(
    page.getByText("Akurasi lokasi ±150 m", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Hentikan pelacakan", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Pilih titik", exact: true }).click();
  await page
    .getByRole("button", { name: "Gunakan titik tengah peta", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Titik pilihan Anda", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Hentikan pelacakan", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText(/Akurasi lokasi/)).toHaveCount(0);
});
