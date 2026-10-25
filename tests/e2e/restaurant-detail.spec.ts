import { expect, test } from "@playwright/test";

const detail = "/restaurant/kedai-ramen-sore";

test("legacy detail navigation retains filters and shared saves", async ({
  page,
}) => {
  await page.goto("/restaurant/kedai-ramen-sore?q=ramen&category=Japanese");
  await expect(page).toHaveURL(
    /restaurant\/kedai-ramen-sore\?q=ramen&category=Japanese/,
  );
  await page
    .getByRole("button", { name: "Remove Kedai Ramen Sore from wishlist" })
    .click();
  await expect(
    page.getByRole("button", { name: "Save Kedai Ramen Sore to wishlist" }),
  ).toHaveAttribute("aria-pressed", "false");
  await page
    .getByRole("link", { name: "Back to Explore", exact: true })
    .click();
  await expect(page).toHaveURL(/explore\?q=ramen&category=Japanese/);
  await expect(
    page.getByRole("heading", { name: "No places found" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Wishlist", exact: true }).click();
  await page.getByRole("link", { name: "Kopi Halaman", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Kopi Halaman" }),
  ).toBeVisible();
  await expect(
    page.getByText("No verified menu is available for this preview."),
  ).toBeAttached();
});

test("gallery cycles all original photos and wraps in both directions", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(detail);
  const hero = page.getByRole("img", {
    name: "Illustrative ramen bowl with egg and vegetables",
  });
  await expect(hero).toBeVisible();
  const bounds = await hero.boundingBox();
  expect(bounds?.width).toBe(390);
  expect(bounds?.height).toBe(318);
  await page.getByRole("button", { name: "Next photo" }).click();
  await expect(page.getByRole("status")).toHaveText("2 / 3");
  await expect(
    page
      .getByRole("img", {
        name: "Illustrative sushi platter from the Figma gallery",
      })
      .first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next photo" }).click();
  await expect(
    page
      .getByRole("img", {
        name: "Illustrative dessert from the Figma gallery",
      })
      .first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next photo" }).click();
  await expect(page.getByRole("status")).toHaveText("1 / 3");
  await page.getByRole("button", { name: "Previous", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("3 / 3");
});

test("Menu, Reviews and TikTok links retain URL state and expose honest provider fallbacks", async ({
  page,
}) => {
  await page.goto(detail);
  await expect(page.getByText("Shoyu ramen", { exact: true })).toBeAttached();
  await page.getByRole("button", { name: "Open official menu" }).click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("heading", { name: "Official menu unavailable" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Open official menu" }),
  ).toBeFocused();
  await page.getByRole("link", { name: "Google Reviews", exact: true }).click();
  await expect(page).toHaveURL(/tab=reviews/);
  await expect(
    page.getByRole("link", { name: "Google Reviews", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(page.getByText("Alya · 4 / 5", { exact: true })).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Illustrative review · not live Google data"),
  ).toBeVisible();
  await page.getByRole("button", { name: "See all on Google Maps" }).click();
  await expect(
    dialog.getByRole("heading", { name: "Live reviews unavailable" }),
  ).toBeVisible();
  await expect(
    dialog.getByRole("link", { name: "Explore Blok M in Google Maps" }),
  ).toHaveAttribute("href", /restaurants%20in%20Blok%20M/);
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press("Tab");
    expect(
      await dialog.evaluate((element) =>
        element.contains(document.activeElement),
      ),
    ).toBe(true);
  }
  await dialog.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("link", { name: "TikTok", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "From your saved links" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Watch on TikTok" }).click();
  await expect(
    dialog.getByRole("heading", { name: "Video link unavailable" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page
    .getByRole("link", { name: "Back to restaurant", exact: true })
    .last()
    .click();
  await expect(page).toHaveURL(new RegExp(`${detail}$`));
  await page.getByRole("button", { name: "Get Directions" }).click();
  await expect(
    dialog.getByRole("heading", { name: "Directions unavailable" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("link", { name: "Change area in Explore" }).click();
  await expect(page).toHaveURL(/\/explore$/);
});

test("all detail sections fit narrow, desktop, landscape and larger text layouts", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const tab of ["menu", "reviews", "tiktok"]) {
    await page.goto(`${detail}?tab=${tab}`);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: `test-results/detail-${tab}-initial-${test.info().project.name}.png`,
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
        page.getByText("Illustrative data", { exact: true }),
      ).toBeInViewport();
    }
    await page.setViewportSize({ width: 390, height: 844 });
    for (const img of await page.locator("main img").all()) {
      await img.scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          img.evaluate((element: HTMLImageElement) => element.naturalWidth),
        )
        .toBeGreaterThan(0);
    }
    await page.screenshot({
      path: `test-results/detail-${tab}-${test.info().project.name}.png`,
    });
    await page.evaluate(() => {
      const leaves = [
        ...document.querySelectorAll<HTMLElement>("main *, footer *"),
      ].filter(
        (element) => element.children.length === 0 && element.tagName !== "IMG",
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
      await page.evaluate(
        () =>
          document.querySelector("main")!.scrollWidth <=
          document.querySelector("main")!.clientWidth,
      ),
    ).toBe(true);
  }
  expect(errors).toEqual([]);
});

test("missing photos, absent restaurant data and unknown routes have recovery states", async ({
  page,
}) => {
  await page.route("**/_next/image?*", (route) =>
    route.fulfill({ status: 503, body: "Unavailable" }),
  );
  await page.goto(detail);
  await expect(
    page.getByRole("img", { name: "Photo unavailable" }).first(),
  ).toBeVisible();
  await page.goto("/restaurant/kopi-halaman?tab=reviews");
  await expect(
    page.getByText("No verified reviews are available for this preview."),
  ).toBeVisible();
  await page.getByRole("link", { name: "TikTok", exact: true }).click();
  await expect(
    page.getByText("No saved video links in this preview."),
  ).toBeVisible();
  await page.getByRole("link", { name: "Menu", exact: true }).click();
  await expect(page.getByRole("button", { name: "Next photo" })).toBeDisabled();
  await page.goto(`${detail}?tab=invalid`);
  await expect(
    page.getByRole("link", { name: "Menu", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  const response = await page.goto("/restaurant/does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("link", { name: "Return to Explore" }),
  ).toBeVisible();
});
