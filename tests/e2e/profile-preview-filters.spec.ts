import { expect, test } from "@playwright/test";
import { stubMapTiles } from "./map-fixture";
test.beforeEach(async ({ page }) => {
  await stubMapTiles(page);
});

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
    for (const img of await page.locator("img:not(.leaflet-tile)").all()) {
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
