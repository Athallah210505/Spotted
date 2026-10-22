import { expect, test } from "@playwright/test";

test("profile validates display name and applies city/radius defaults for this visit", async ({
  page,
}) => {
  await page.goto("/profile");
  await page.getByRole("button", { name: "Edit display name" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox", { name: "Display name" }).fill("   ");
  await dialog.getByRole("button", { name: "Save name" }).click();
  await expect(dialog.getByRole("alert")).toHaveText(
    "Enter a display name between 1 and 50 characters.",
  );
  await dialog.getByRole("textbox", { name: "Display name" }).fill("Nadhif");
  await dialog.getByRole("button", { name: "Save name" }).click();
  await expect(
    page.getByRole("heading", { name: "Nadhif", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Edit display name" }),
  ).toBeFocused();
  await page
    .getByRole("group", { name: "Default nearby radius" })
    .getByRole("button", { name: "1 km", exact: true })
    .click();
  await page.getByRole("button", { name: "Edit preferred city" }).click();
  await dialog
    .getByRole("button", { name: "Tangerang Selatan · Bintaro", exact: true })
    .click();
  await page.getByRole("link", { name: "Wishlist", exact: true }).click();
  await expect(page).toHaveURL(/city=tangsel&radius=1/);
  await expect(
    page.getByText("0 saved places within 1 km", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Choose location" }).click();
  await dialog
    .getByRole("button", { name: "Jakarta · Blok M", exact: true })
    .click();
  await expect(
    page.getByText("1 saved place within 1 km", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Nearby radius" })
    .getByRole("link", { name: "5 km", exact: true })
    .click();
  await expect(
    page.getByText("2 saved places within 5 km", { exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(/city=jakarta&radius=5/);
  await page.getByRole("link", { name: "Profile", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Nadhif", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Athallah", exact: true }),
  ).toBeVisible();
});

test("profile privacy and account actions explain preview availability and restore focus", async ({
  page,
}) => {
  await page.goto("/profile");
  const dialog = page.getByRole("dialog");
  for (const [action, heading] of [
    ["Privacy settings", "Your privacy"],
    ["Account settings", "Account settings"],
    ["Sign out", "Sign out unavailable"],
    ["Delete account", "No account to delete"],
  ]) {
    const button = page.getByRole("button", { name: action!, exact: true });
    await button.click();
    await expect(
      dialog.getByRole("heading", { name: heading!, exact: true }),
    ).toBeVisible();
    for (let index = 0; index < 3; index++) {
      await page.keyboard.press("Tab");
      expect(
        await dialog.evaluate((element) =>
          element.contains(document.activeElement),
        ),
      ).toBe(true);
    }
    await page.keyboard.press("Escape");
    await expect(button).toBeFocused();
  }
  await page.getByRole("button", { name: "Choose preferred city" }).click();
  await dialog.getByRole("button", { name: "Close dialog" }).click();
});

test("selecting a map pin opens an accessible preview before detail and preserves its return path", async ({
  page,
}) => {
  await page.goto("/map");
  const pin = page.getByRole("button", { name: /Preview Kedai Ramen Sore/ });
  await pin.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/place=kedai-ramen-sore/);
  const sheet = page.getByRole("region", {
    name: "Selected restaurant preview",
  });
  await expect(
    sheet.getByRole("heading", { name: "Kedai Ramen Sore", exact: true }),
  ).toBeFocused();
  await expect(pin).toHaveAttribute("aria-pressed", "true");
  await expect(pin).toHaveCSS("background-color", "rgb(255, 226, 136)");
  await sheet.getByRole("link", { name: "View Details", exact: true }).click();
  await page.getByRole("link", { name: "Back to Map", exact: true }).click();
  await expect(sheet).toBeVisible();
  await page.reload();
  await expect(sheet).toBeVisible();
  await sheet.getByRole("heading").focus();
  await page.keyboard.press("Escape");
  await expect(sheet).toHaveCount(0);
  await expect(pin).toBeFocused();
  await pin.click();
  await page.getByRole("button", { name: "Close restaurant preview" }).click();
  await expect(sheet).toHaveCount(0);
  await page.goto("/map?category=Coffee&place=kedai-ramen-sore");
  await expect(sheet).toHaveCount(0);
});

test("nearby preview preserves radius and recovers when the selected save is removed", async ({
  page,
}) => {
  await page.goto("/wishlist?view=map&place=kopi-halaman");
  await expect(
    page.getByRole("heading", { name: "Saved. Now nearby." }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Nearby radius" })
    .getByRole("link", { name: "3 km", exact: true })
    .click();
  await expect(page).toHaveURL(/radius=3&place=kopi-halaman/);
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
  await expect(
    page.getByRole("region", { name: "Selected restaurant preview" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /Preview Kopi Halaman/ }),
  ).toHaveCount(0);
  await expect(
    page
      .getByRole("navigation", { name: "Nearby radius" })
      .getByRole("link", { name: "3 km", exact: true }),
  ).toHaveAttribute("aria-current", "page");
});

test("filters calculate real fixture counts, apply across List/Map and reset without claiming unknown metadata", async ({
  page,
}) => {
  await page.goto("/explore");
  await page.getByRole("link", { name: "Filters", exact: true }).click();
  await page
    .getByRole("group", { name: "Cuisine", exact: true })
    .getByRole("button", { name: "Japanese", exact: true })
    .click();
  await page
    .getByRole("group", { name: "Google rating", exact: true })
    .getByRole("button", { name: "4.5+", exact: true })
    .click();
  await page
    .getByRole("group", { name: "Distance", exact: true })
    .getByRole("button", { name: "3 km", exact: true })
    .click();
  await page
    .getByRole("group", { name: "Price level", exact: true })
    .getByRole("button", { name: "RpRp", exact: true })
    .click();
  await page.getByRole("checkbox", { name: "Open Now", exact: true }).check();
  await page.getByRole("checkbox", { name: "Saved Only", exact: true }).check();
  await expect(page.getByRole("status")).toHaveText(
    "1 matching place · Illustrative",
  );
  await page
    .getByRole("checkbox", { name: "Verified halal only", exact: true })
    .check();
  await expect(page.getByRole("status")).toHaveText(
    "0 matching places · Illustrative",
  );
  await page
    .getByRole("checkbox", { name: "Verified halal only", exact: true })
    .uncheck();
  await page.getByRole("link", { name: "Show 1 place", exact: true }).click();
  await expect(page).toHaveURL(
    /category=Japanese&rating=4.5&distance=3&price=2&open=1&saved=1/,
  );
  await expect(
    page.getByRole("article", { name: "Kedai Ramen Sore", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Map", exact: true }).click();
  await expect(page.getByRole("button", { name: /^Preview/ })).toHaveCount(1);
  await page.getByText("Search & filters", { exact: true }).click();
  await page.getByRole("link", { name: "Filters", exact: true }).click();
  await expect(
    page.getByRole("checkbox", { name: "Open Now", exact: true }),
  ).toBeChecked();
  await page
    .getByRole("button", { name: "Reset filters", exact: true })
    .click();
  await expect(page.getByRole("status")).toHaveText(
    "2 matching places · Illustrative",
  );
  await expect(
    page.getByRole("checkbox", { name: "Open Now", exact: true }),
  ).not.toBeChecked();
  await page.getByRole("link", { name: "Show 2 places", exact: true }).click();
  await expect(page).toHaveURL(/\/map\?distance=5$/);
  await expect(page.getByRole("button", { name: /^Preview/ })).toHaveCount(2);
});

test("four new screen states fit all viewports with original icon dimensions and larger text", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  const paths = [
    "/profile",
    "/map?place=kedai-ramen-sore",
    "/wishlist?view=map&place=kopi-halaman",
    "/filters?category=Japanese&rating=4.5&distance=5",
  ];
  for (const [index, path] of paths.entries()) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(path);
    if (path.startsWith("/map"))
      await page.getByText("Search & filters", { exact: true }).click();
    for (const img of await page.locator("img").all()) {
      await img.scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          img.evaluate((element: HTMLImageElement) => element.naturalWidth),
        )
        .toBeGreaterThan(0);
      const bounds = await img.boundingBox();
      const width = Number(await img.getAttribute("width"));
      const height = Number(await img.getAttribute("height"));
      if (width && height) {
        expect(bounds?.width).toBe(width);
        expect(bounds?.height).toBe(height);
      }
    }
    await page
      .locator("main")
      .evaluate((element) => element.scrollTo({ top: 0 }));
    await page.screenshot({
      path: `test-results/phase3-${index}-${test.info().project.name}.png`,
    });
    const skip = page.getByRole("link", { name: /^Skip to/ });
    await skip.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("main")).toBeFocused();
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
    await page.setViewportSize({ width: 375, height: 812 });
    await page.evaluate(() => {
      const sizes = [
        ...document.querySelectorAll<HTMLElement>("main *,footer *"),
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
