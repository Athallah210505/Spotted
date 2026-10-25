import { expect, test } from "@playwright/test";
import { stubMapTiles } from "./map-fixture";
test.beforeEach(async ({ page }) => {
  await stubMapTiles(page);
});

test("wishlist radius and display mode are shareable and update nearby counts", async ({
  page,
}) => {
  await page.goto("/wishlist");
  await expect(
    page.getByLabel("3 saved places", { exact: true }),
  ).toBeVisible();
  const radius = page.getByRole("navigation", { name: "Nearby radius" });
  for (const [km, count] of [
    [1, 1],
    [3, 2],
    [5, 2],
    [10, 3],
  ]) {
    await radius.getByRole("link", { name: `${km} km`, exact: true }).click();
    await expect(
      page.getByText(
        `${count} saved ${count === 1 ? "place" : "places"} within ${km} km`,
        {
          exact: true,
        },
      ),
    ).toBeVisible();
  }
  await page
    .getByRole("navigation", { name: "Display mode" })
    .getByRole("link", { name: "Map", exact: true })
    .click();
  await expect(page).toHaveURL(/view=map&radius=10/);
  await expect(page.getByText("3 saved places within 10 km")).toBeVisible();
  const map = page.getByRole("region", { name: "Illustrative restaurant map" });
  await expect(map.getByRole("button", { name: /^Preview/ })).toHaveCount(3);
  await expect(map.getByRole("button", { name: /saved nearby/ })).toHaveCount(
    3,
  );
  await page.reload();
  await expect(radius.getByRole("link", { name: "10 km" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await radius.getByRole("link", { name: "1 km", exact: true }).click();
  await expect(map.getByRole("button", { name: /saved nearby/ })).toHaveCount(
    1,
  );
  await expect(
    map.getByRole("button", { name: /Preview Kedai Ramen Sore/ }),
  ).toHaveAccessibleName(/saved, rating 4.8/);
  await page
    .getByRole("navigation", { name: "Display mode" })
    .getByRole("link", { name: "List", exact: true })
    .click();
  await expect(page).toHaveURL(/wishlist\?radius=1/);
});

test("removing places updates pins, Explore, detail and the empty wishlist", async ({
  page,
}) => {
  await page.goto("/wishlist?view=map");
  const map = page.getByRole("region", { name: "Illustrative restaurant map" });
  await map.getByRole("button", { name: /Preview Kopi Halaman/ }).click();
  await page.getByRole("link", { name: "View Details", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Remove Kopi Halaman from wishlist",
      exact: true,
    })
    .click();
  await page
    .getByRole("link", { name: "Back to Wishlist", exact: true })
    .click();
  await expect(page).toHaveURL(/wishlist\?view=map&place=kopi-halaman$/);
  await page.getByRole("link", { name: "Wishlist", exact: true }).click();
  await expect(
    page.getByLabel("2 saved places", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Remove Kedai Ramen Sore from wishlist",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", {
      name: "Remove Ruang Matcha from wishlist",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your wishlist is empty" }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Display mode" })
    .getByRole("link", { name: "Map", exact: true })
    .click();
  await expect(map.getByRole("button", { name: /^Preview/ })).toHaveCount(0);
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Map", exact: true })
    .click();
  const realMap = page.getByRole("region", { name: "Peta tempat makan" });
  await realMap
    .getByRole("button", {
      name: "Toko Kopi TUKU - Blok M, rating 4.8",
      exact: true,
    })
    .click();
  await realMap
    .getByRole("link", { name: "Lihat detail", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Save Toko Kopi TUKU - Blok M to wishlist",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Remove Toko Kopi TUKU - Blok M from wishlist",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("import entry, directions and profile have keyboard-accessible outcomes", async ({
  page,
}) => {
  await page.goto("/wishlist");
  const add = page.getByRole("link", {
    name: "Add from TikTok",
    exact: true,
  });
  await add.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/import$/);
  await expect(
    page.getByRole("textbox", { name: "TikTok video link" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Back", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await page
    .getByRole("article", { name: "Kopi Halaman", exact: true })
    .getByRole("button", { name: "Directions", exact: true })
    .click();
  await expect(
    dialog.getByRole("link", { name: "Open area in Google Maps" }),
  ).toHaveAttribute("href", /restaurants%20in%20Jakarta%20Blok%20M/);
  await dialog.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("link", { name: "Profile", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your taste. Your rules." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Wishlist", exact: true }).click();
  await page
    .getByRole("button", { name: "Choose location", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Map", exact: true })
    .click();
  await page.evaluate(() => {
    Object.defineProperty(navigator.geolocation, "getCurrentPosition", {
      value: (_success: PositionCallback, error: PositionErrorCallback) =>
        error({ code: 1 } as GeolocationPositionError),
    });
  });
  await page.getByRole("button", { name: "Gunakan lokasi saya" }).click();
  await expect(page.getByRole("status")).toContainText("Izin lokasi ditolak");
});

test("all three screens render local assets and fit phone, desktop and landscape", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const path of ["/map", "/wishlist", "/wishlist?view=map"]) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(path);
    for (const img of await page.locator("img:not(.leaflet-tile)").all()) {
      await img.scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          img.evaluate((element: HTMLImageElement) => element.naturalWidth),
        )
        .toBeGreaterThan(0);
      if (!(await img.getAttribute("src"))?.includes("/_next/image")) {
        const bounds = await img.boundingBox();
        expect(bounds?.width).toBe(Number(await img.getAttribute("width")));
        expect(bounds?.height).toBe(Number(await img.getAttribute("height")));
      }
    }
    await page
      .locator("main")
      .evaluate((element) => element.scrollTo({ top: 0 }));
    await page.screenshot({
      path: `test-results/${path.includes("wishlist") ? (path.includes("view") ? "wishlist-map" : "wishlist-list") : "map"}-${test.info().project.name}.png`,
    });
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
      await expect(
        page.getByRole("navigation", { name: "Main navigation" }),
      ).toBeInViewport();
    }
    await page.setViewportSize({ width: 375, height: 812 });
    await page.evaluate(() => {
      const sizes = [
        ...document.querySelectorAll<HTMLElement>("main *, footer *"),
      ]
        .filter(
          (element) => !element.children.length && element.tagName !== "IMG",
        )
        .map((element) => ({
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
      await page.evaluate(
        () =>
          document.querySelector("main")!.scrollWidth <=
          document.querySelector("main")!.clientWidth,
      ),
    ).toBe(true);
  }
  expect(errors).toEqual([]);
});

test("nearby motion stops after two pulses and is disabled for reduced motion", async ({
  page,
}) => {
  await page.goto("/wishlist?view=map");
  const marker = page
    .getByRole("region", { name: "Illustrative restaurant map" })
    .getByRole("button", { name: /Preview Kopi Halaman/ });
  const animation = await marker.evaluate((element) => ({
    count: getComputedStyle(element).animationIterationCount,
    duration: getComputedStyle(element).animationDuration,
  }));
  expect(animation).toEqual({ count: "2", duration: "0.6s" });
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await marker.evaluate((element) => getComputedStyle(element).animationName),
  ).toBe("none");
});
