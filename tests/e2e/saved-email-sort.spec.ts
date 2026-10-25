import { expect, test, type Page } from "@playwright/test";

test("email preview supports resend, edit, simulated completion and reload recovery without POST", async ({
  page,
}) => {
  const posts: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST") posts.push(request.url());
  });
  await page.goto("/login/sent?from=https://evil.example");
  await expect(
    page.getByRole("heading", { name: "Request a preview sign-in link." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Enter email address" }).click();
  await requestEmail(page);
  await expect(page).toHaveURL(/\/login\/sent$/);
  await page.getByRole("button", { name: "Resend sign-in link" }).click();
  await expect(page.getByRole("status")).toHaveText(
    "Preview link refreshed (1). No email was sent.",
  );
  await page.getByRole("button", { name: "Resend sign-in link" }).click();
  await expect(page.getByRole("status")).toHaveText(
    "Preview link refreshed (2). No email was sent.",
  );
  await page.getByRole("link", { name: "Change email address" }).click();
  await expect(page.getByLabel("Email address", { exact: true })).toHaveValue(
    "",
  );
  await requestEmail(page);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Request a preview sign-in link." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Enter email address" }).click();
  await requestEmail(page);
  await page.getByRole("button", { name: "Simulate verified sign-in" }).click();
  await expect(page).toHaveURL(/\/profile$/);
  expect(posts).toEqual([]);
});

test("new detail save opens confirmation with safe return state and recovers after removal", async ({
  page,
}) => {
  await page.goto(
    "/restaurant/kedai-ramen-sore?category=Japanese&sort=most_reviewed&from=map&place=kedai-ramen-sore",
  );
  await page
    .getByRole("button", { name: "Remove Kedai Ramen Sore from wishlist" })
    .click();
  await page
    .getByRole("button", { name: "Save Kedai Ramen Sore to wishlist" })
    .click();
  await expect(page).toHaveURL(
    /\/saved\/kedai-ramen-sore\?category=Japanese&sort=most_reviewed/,
  );
  await expect(page.getByRole("status")).toHaveText("Saved to your wishlist");
  await expect(
    page.getByRole("link", { name: "Back to restaurant", exact: true }),
  ).toHaveAttribute("href", /sort=most_reviewed.*from=map/);
  await page
    .getByRole("link", { name: "Back to restaurant", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Remove Kedai Ramen Sore from wishlist" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "Remove Kedai Ramen Sore from wishlist" })
    .click();
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "This spot is no longer saved." }),
  ).toBeVisible();
  const response = await page.goto("/saved/unknown");
  await expect(
    page.getByRole("link", { name: "Return to Explore" }),
  ).toBeVisible();
  expect(response?.status()).toBe(404);
});

test("Google sorting survives filter and detail navigation", async ({
  page,
}) => {
  await page.goto("/explore");
  await page
    .getByRole("button", {
      name: "Save Toko Kopi TUKU - Blok M to wishlist",
      exact: true,
    })
    .click();
  await page.getByRole("link", { name: "Filters", exact: true }).click();
  await page
    .getByRole("group", { name: "Google rating", exact: true })
    .getByRole("button", { name: "4.5+", exact: true })
    .click();
  await page.getByRole("checkbox", { name: "Saved Only", exact: true }).check();
  await page.getByRole("link", { name: "Show 1 place", exact: true }).click();
  await page.getByRole("link", { name: /^Sort places:/ }).click();
  await expect(
    page.getByRole("link", { name: "Recommended", exact: true }),
  ).toHaveAttribute("aria-current", "true");
  await page.getByRole("link", { name: "Nearest", exact: true }).click();
  await expect(page).toHaveURL(/rating=4.5.*saved=1&sort=nearest/);
  await expect(page.getByRole("article").first()).toHaveAccessibleName(
    "Toko Kopi TUKU - Blok M",
  );
  await page.getByRole("link", { name: "Filters", exact: true }).click();
  await page.getByRole("link", { name: /^Show / }).click();
  await expect(page).toHaveURL(/sort=nearest/);
  await page
    .getByRole("link", { name: "View Toko Kopi TUKU - Blok M", exact: true })
    .click();
  await page.getByRole("link", { name: "Back", exact: true }).click();
  await expect(page).toHaveURL(/sort=nearest/);
  await page.goto("/sort?city=tangsel&sort=nearest");
  await expect(
    page.getByRole("button", { name: "Nearest", exact: true }),
  ).toBeDisabled();
  await page.getByRole("link", { name: "Highest Rated", exact: true }).click();
  await expect(page).toHaveURL(/city=tangsel&sort=highest_rated/);
});

test("four reference states retain original assets and fit responsive and large-text layouts", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/restaurant/kedai-ramen-sore?tab=tiktok");
  await capture("videos");
  await page.goto("/login");
  await requestEmail(page);
  await expect(
    page.getByRole("heading", { name: "Check your inbox." }),
  ).toBeVisible();
  await capture("email");
  await page.goto("/saved/kedai-ramen-sore");
  await capture("saved");
  await page.goto("/sort");
  await capture("sort");
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
      await img.evaluate((element: HTMLImageElement) => element.decode());
      await expect(img).toBeVisible();
      const width = Number(await img.getAttribute("width"));
      if (width) expect((await img.boundingBox())?.width).toBe(width);
    }
    await page.evaluate(() => {
      window.scrollTo(0, 0);
      document.querySelector("main")?.scrollTo(0, 0);
    });
    const locate = page.locator('img[src="/figma/detail/locate.svg"]');
    await expect(locate).toBeInViewport();
    await locate.screenshot({
      path: `test-results/final-${name}-locate-${test.info().project.name}.png`,
    });
    await page.screenshot({
      path: `test-results/final-${name}-${test.info().project.name}.png`,
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
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => {
      const leaves = [
        ...document.querySelectorAll<HTMLElement>("main *"),
      ].filter(
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
  }
});

async function requestEmail(page: Page) {
  await page
    .getByLabel("Email address", { exact: true })
    .fill("preview@example.com");
  await page.getByRole("button", { name: "Email me a sign-in link" }).click();
  await expect(page.getByRole("status")).toHaveText(
    "Preview link ready. No email was sent.",
  );
}
