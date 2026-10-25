import { expect, test } from "@playwright/test";

test("the root opens Explore without provider requests", async ({ page }) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    if (!request.url().startsWith("http://127.0.0.1:3100/")) {
      externalRequests.push(request.url());
    }
  });

  await page.goto("/");
  await expect(page).toHaveURL(/\/explore$/);
  await expect(
    page.getByRole("heading", { name: "Follow your cravings." }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Google Maps", exact: true }),
  ).toBeVisible();
  await expect(page).toHaveTitle("SPOTTED");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(hasOverflow).toBe(false);
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
  await page.getByRole("link", { name: "Skip to restaurants" }).focus();
  await expect(
    page.getByRole("link", { name: "Skip to restaurants" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
});

test("the health endpoint is application-only and not cached", async ({
  request,
}) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBe(true);
  expect(response.headers()["cache-control"]).toBe("no-store");
  expect(await response.json()).toEqual({
    data: { status: "ok", service: "spotted", scope: "application" },
  });
});

test("unknown routes offer a working, keyboard-accessible return link", async ({
  page,
}) => {
  const response = await page.goto("/not-a-real-page");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "Page not found" }),
  ).toBeVisible();
  const returnLink = page.getByRole("link", { name: "Return to Explore" });
  await returnLink.focus();
  await expect(returnLink).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/explore$/);
});
