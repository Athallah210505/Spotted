import { expect, test } from "@playwright/test";

test("search, categories and empty results share URL state", async ({
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
    page.getByRole("article", { name: "Kopi Halaman", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("article", { name: "Kedai Ramen Sore", exact: true }),
  ).toHaveCount(0);
  await categories.getByRole("button", { name: "Korean", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "No places found" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Reset filters", exact: true })
    .click();
  await expect(page).toHaveURL(/\/explore$/);
  const search = page.getByRole("searchbox", {
    name: "Find food, places or areas",
  });
  await search.fill("ramen");
  await search.press("Enter");
  await expect(page).toHaveURL(/q=ramen/);
  await expect(
    page.getByRole("article", { name: "Kedai Ramen Sore", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(search).toHaveValue("ramen");
  await expect(
    page.getByRole("article", { name: "Kopi Halaman", exact: true }),
  ).toHaveCount(0);
});

test("saving and removing synchronize the card, nearby count and preview wishlist", async ({
  page,
}) => {
  await page.goto("/explore");
  await page
    .getByRole("button", {
      name: "Remove Kedai Ramen Sore from wishlist",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Save Kedai Ramen Sore to wishlist",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("link", { name: "Wishlist", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "My next food stops." }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Kedai Ramen Sore", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", {
      name: "Remove Kopi Halaman from wishlist",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Remove Ruang Matcha from wishlist" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your wishlist is empty" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Explore", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "No saved places nearby" }),
  ).toBeAttached();
  await page
    .getByRole("button", {
      name: "Save Kedai Ramen Sore to wishlist",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", { name: "1 saved place within 5 km" }),
  ).toBeAttached();
});

test("location, restaurant preview, map and profile controls have working outcomes", async ({
  page,
}) => {
  await page.goto("/explore");
  await page
    .getByRole("link", { name: "View Kedai Ramen Sore", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(
    page.getByRole("heading", { name: "Kedai Ramen Sore" }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Remove Kedai Ramen Sore from wishlist",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Save Kedai Ramen Sore to wishlist",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Back to Explore", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Choose location", exact: true })
    .click();
  await dialog
    .getByRole("button", { name: "Tangerang Selatan · Bintaro", exact: true })
    .click();
  await expect(page).toHaveURL(/city=tangsel/);
  await expect(
    page.getByRole("article", { name: "Ruang Matcha", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Distance unavailable", { exact: false }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Map", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Illustrative restaurant map" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Explore", exact: true }).click();
  await page.getByRole("link", { name: "Profile", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your taste. Your rules." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Edit preferred city" }).click();
  await expect(
    dialog.getByRole("heading", { name: "Preferred city", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("link", { name: "Explore", exact: true }).click();
  await expect(page).toHaveURL(/\/explore$/);
});

test("original assets render in their Figma slots and layout fits phone and desktop", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/explore");
  const photo = page.getByRole("img", {
    name: "Illustrative ramen bowl with egg and vegetables",
    exact: true,
  });
  await expect(photo).toBeVisible();
  const bounds = await photo.boundingBox();
  expect(bounds?.width).toBe(342);
  expect(bounds?.height).toBe(280);
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }),
  ).toBeVisible();
  const images = page.locator("main img");
  for (const image of await images.all()) {
    await image.scrollIntoViewIfNeeded();
    await expect(image).toHaveJSProperty("complete", true);
    await expect
      .poll(() =>
        image.evaluate((element: HTMLImageElement) => element.naturalWidth),
      )
      .toBeGreaterThan(0);
  }
  for (const viewport of [
    { width: 375, height: 812 },
    { width: 430, height: 932 },
    { width: 1280, height: 900 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await expect(
      page.getByRole("navigation", { name: "Main navigation" }),
    ).toBeInViewport();
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  const navTransition = await page
    .getByRole("link", { name: "Wishlist", exact: true })
    .evaluate((button) => getComputedStyle(button).transitionDuration);
  expect(navTransition).toBe("0s");
});

test("unavailable photos have a visible fallback", async ({ page }) => {
  await page.route("**/_next/image?*", (route) =>
    route.fulfill({ status: 503, body: "Unavailable" }),
  );
  await page.goto("/explore");
  await expect(
    page
      .getByRole("article", { name: "Kedai Ramen Sore", exact: true })
      .getByRole("img", { name: "Photo unavailable" }),
  ).toBeVisible();
});

test("category rails, nearby actions and both map links are operable", async ({
  page,
}) => {
  await page.goto("/explore");
  const rail = page.getByRole("group", {
    name: "Restaurant categories",
    exact: true,
  });
  for (const name of [
    "All",
    "Coffee",
    "Matcha",
    "Japanese",
    "Korean",
    "Indonesian",
    "Western",
    "Dessert",
    "Brunch",
  ]) {
    const chip = rail.getByRole("button", { name, exact: true });
    await chip.click();
    await expect(chip).toHaveAttribute("aria-pressed", "true");
  }
  await page.getByRole("button", { name: "Explore", exact: true }).click();
  const lowerRail = page.getByRole("group", {
    name: "Explore by category",
    exact: true,
  });
  for (const name of ["Japanese", "Coffee", "Matcha", "Dessert"]) {
    await lowerRail.getByRole("button", { name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`category=${name}`));
    await page.getByRole("button", { name: "Explore", exact: true }).click();
    await expect(lowerRail).toBeAttached();
  }
  for (let index = 0; index < 2; index++) {
    await page
      .getByRole("link", { name: "View map", exact: true })
      .nth(index)
      .click();
    await expect(
      page.getByRole("region", { name: "Illustrative restaurant map" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Explore", exact: true }).click();
  }
  const compact = page.getByRole("article", {
    name: "Nearby Kopi Halaman",
    exact: true,
  });
  await compact
    .getByRole("link", { name: "View Kopi Halaman", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Kopi Halaman", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Back to Explore", exact: true })
    .click();
  await compact
    .getByRole("button", { name: "Directions", exact: true })
    .click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("heading", { name: "Explore this area" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await compact.getByRole("button", { name: "Remove", exact: true }).click();
  await expect(compact).toHaveCount(0);
});

test("larger text keeps the page inside the viewport and dialog focus contained", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/explore");
  await page.evaluate(() => {
    const elements = [
      ...document.querySelectorAll<HTMLElement>("main *, footer *"),
    ];
    const sizes = elements.map((element) => ({
      element,
      size: parseFloat(getComputedStyle(element).fontSize),
      line: parseFloat(getComputedStyle(element).lineHeight),
    }));
    for (const { element, size, line } of sizes) {
      if (element.children.length === 0 && element.tagName !== "IMG") {
        element.style.fontSize = `${size * 2}px`;
        if (Number.isFinite(line)) element.style.lineHeight = `${line * 2}px`;
      }
    }
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Choose location", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Tab");
    expect(
      await dialog.evaluate((element) =>
        element.contains(document.activeElement),
      ),
    ).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Choose location", exact: true }),
  ).toBeFocused();
});
