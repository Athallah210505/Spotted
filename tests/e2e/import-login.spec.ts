import { expect, test, type Page } from "@playwright/test";

const video = "https://www.tiktok.com/@food.creator/video/123456789";

async function prepare(
  page: Page,
  restaurant = "kedai-ramen-sore",
  navigate = true,
) {
  if (navigate) await page.goto("/import");
  await page
    .getByRole("textbox", { name: "TikTok video link" })
    .fill(`${video}?tracking=private`);
  await page.getByLabel("Restaurant", { exact: true }).selectOption(restaurant);
  await page.getByRole("button", { name: "Confirm recommendation" }).click();
  await expect(page).toHaveURL(/step=confirm/);
}
async function signIn(page: Page) {
  await page
    .getByLabel("Email address", { exact: true })
    .fill("preview@example.com");
  await page.getByRole("button", { name: "Email me a sign-in link" }).click();
  await expect(page.getByRole("status")).toHaveText(
    "Preview link ready. No email was sent.",
  );
  await page.getByRole("button", { name: "Simulate verified sign-in" }).click();
}

test("import validates links, preserves the selected restaurant and resumes after explicit simulated sign-in", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const posted: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST") posted.push(request.url());
  });
  await page.goto("/wishlist");
  await page.getByRole("link", { name: "Add from TikTok" }).click();
  await page.getByRole("button", { name: "Confirm recommendation" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Enter an HTTPS TikTok",
  );
  await page
    .getByRole("textbox", { name: "TikTok video link" })
    .fill("https://tiktok.com.evil.com/@food/video/123");
  await page.getByRole("button", { name: "Confirm recommendation" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toBeVisible();
  await page.getByRole("textbox", { name: "TikTok video link" }).fill(video);
  await page.getByRole("button", { name: "Confirm recommendation" }).click();
  await page
    .getByRole("button", { name: "Change restaurant", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await page.keyboard.press("Tab");
  expect(
    await dialog.evaluate((element) =>
      element.contains(document.activeElement),
    ),
  ).toBe(true);
  await dialog.getByRole("button", { name: "Kopi Halaman · Blok M" }).click();
  await expect(
    page.getByRole("button", { name: "Change restaurant", exact: true }),
  ).toBeFocused();
  await expect(
    page.getByText("Restaurant selected: Kopi Halaman"),
  ).toBeVisible();
  const watch = page.getByRole("link", { name: "Watch on TikTok" });
  await expect(watch).toHaveAttribute("href", video);
  await expect(watch).toHaveAttribute("rel", "noopener noreferrer");
  await page
    .getByRole("button", { name: "Save to Wishlist", exact: true })
    .click();
  await expect(page).toHaveURL(/login\?from=import/);
  await page.getByRole("button", { name: "Email me a sign-in link" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText(
    "Enter a valid email address.",
  );
  await signIn(page);
  await expect(page).toHaveURL(/\/import\/success$/);
  await expect(
    page.getByRole("heading", { name: "Craving remembered." }),
  ).toBeVisible();
  await expect(
    page.getByText(/Kopi Halaman and your TikTok link/),
  ).toContainText("this visit only");
  await page.getByRole("link", { name: "Find it on the map" }).click();
  await expect(page).toHaveURL(/city=jakarta&place=kopi-halaman/);
  await page.getByRole("link", { name: "View Details", exact: true }).click();
  await page.getByRole("link", { name: "TikTok", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "Watch on TikTok" }),
  ).toHaveAttribute("href", video);
  expect(posted).toEqual([]);
});

test("saving the same import is idempotent, removal clears its link and reload has honest recovery", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await prepare(page);
  await page
    .getByRole("button", { name: "Save to Wishlist", exact: true })
    .click();
  await signIn(page);
  await page.getByRole("link", { name: "Open Wishlist" }).click();
  await expect(
    page.getByRole("article", { name: "Kedai Ramen Sore", exact: true }),
  ).toHaveCount(1);
  await page.getByRole("link", { name: "Add from TikTok" }).click();
  await prepare(page, "kedai-ramen-sore", false);
  await page
    .getByRole("button", { name: "Save to Wishlist", exact: true })
    .click();
  await expect(page).toHaveURL(/\/import\/success$/);
  await page.getByRole("link", { name: "Open Wishlist" }).click();
  await expect(
    page.getByRole("article", { name: "Kedai Ramen Sore", exact: true }),
  ).toHaveCount(1);
  await page.getByRole("link", { name: "Add from TikTok" }).click();
  await prepare(page, "kopi-halaman", false);
  await page
    .getByRole("button", { name: "Save to Wishlist", exact: true })
    .click();
  await page.getByRole("link", { name: "Open Wishlist" }).click();
  await page
    .getByRole("article", { name: "Kopi Halaman", exact: true })
    .getByRole("button", { name: /Remove Kopi Halaman/ })
    .click();
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "No saved import in this visit." }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Add a TikTok link", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "TikTok video link" }),
  ).toHaveValue(video);
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "TikTok video link" }),
  ).toHaveValue("");
  await page.goto("/import?step=confirm");
  await expect(
    page.getByText("Add your link before saving.", { exact: false }),
  ).toBeVisible();
});

test("login keeps browsing available and ignores untrusted return destinations", async ({
  page,
}) => {
  await page.goto("/login?from=https://evil.example");
  await page.getByLabel("Email address", { exact: true }).fill("invalid");
  await page.getByRole("button", { name: "Email me a sign-in link" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toBeVisible();
  await page
    .getByLabel("Email address", { exact: true })
    .fill("preview@example.com");
  await page.getByRole("button", { name: "Email me a sign-in link" }).click();
  await page.getByRole("link", { name: "Change email address" }).click();
  await expect(page.getByLabel("Email address", { exact: true })).toHaveValue(
    "",
  );
  await page.getByRole("link", { name: "Keep browsing" }).click();
  await expect(page).toHaveURL(/\/explore$/);
  await page.getByRole("link", { name: "Profile", exact: true }).click();
  await page.getByRole("link", { name: "Try preview sign-in" }).click();
  await signIn(page);
  await expect(page).toHaveURL(/\/profile$/);
});

test("reference screens keep assets, keyboard access and large text within their containers", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/login");
  await capture("login");
  await prepare(page);
  await expect(
    page.getByRole("heading", { name: "Right place. Saved inspiration." }),
  ).toBeVisible();
  await capture("confirm");
  await page
    .getByRole("button", { name: "Save to Wishlist", exact: true })
    .click();
  await signIn(page);
  await expect(
    page.getByRole("heading", { name: "Craving remembered." }),
  ).toBeVisible();
  await capture("success");
  await page.getByRole("link", { name: /Kedai Ramen Sore/ }).click();
  await page.getByRole("link", { name: "Google Reviews", exact: true }).click();
  await expect(page).toHaveURL(/tab=reviews/);
  await expect(
    page.getByRole("button", { name: "See all on Google Maps" }),
  ).toBeVisible();
  await capture("reviews");
  expect(errors).toEqual([]);

  async function capture(name: string) {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const img of await page.locator("img").all()) {
      await img.scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          img.evaluate((element: HTMLImageElement) => element.naturalWidth),
        )
        .toBeGreaterThan(0);
      const width = Number(await img.getAttribute("width"));
      const height = Number(await img.getAttribute("height"));
      if (width && height) {
        const box = await img.boundingBox();
        expect(box?.width).toBe(width);
        expect(box?.height).toBe(height);
      }
    }
    await page.evaluate(() => {
      window.scrollTo(0, 0);
      document.querySelector("main")?.scrollTo(0, 0);
    });
    await page.screenshot({
      path: `test-results/journey-${name}-${test.info().project.name}.png`,
    });
    for (const width of [375, 430, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => {
      for (const element of document.querySelectorAll<HTMLElement>("main *")) {
        if (element.children.length || element.tagName === "IMG") continue;
        const style = getComputedStyle(element);
        const size = parseFloat(style.fontSize);
        const line = parseFloat(style.lineHeight);
        element.style.fontSize = `${size * 2}px`;
        if (Number.isFinite(line)) element.style.lineHeight = `${line * 2}px`;
      }
    });
    expect(
      await page
        .locator("main")
        .evaluate((element) => element.scrollWidth <= element.clientWidth),
    ).toBe(true);
  }
});
