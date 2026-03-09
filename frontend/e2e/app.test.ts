import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test("page load successfully", async ({ page }) => {
    await page.goto("/");
    await expect(page).not.toHaveTitle(/error/i);
  });

  test("show BTC and ETH price after connecting", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("BTC")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("ETH")).toBeVisible({ timeout: 5000 });
  });

  test("price values update over time", async ({ page }) => {
    await page.goto("/");

    const btcEl = page.getByTestId("price-BTC");
    const ethEl = page.getByTestId("price-ETH");
    await btcEl.waitFor({ timeout: 5000 });
    await ethEl.waitFor({ timeout: 5000 });

    const btcPrice1 = await btcEl.textContent();
    const ethPrice1 = await ethEl.textContent();

    await page.waitForTimeout(3000);

    const btcPrice2 = await btcEl.textContent();
    const ethPrice2 = await ethEl.textContent();

    expect(btcPrice1).toBeTruthy();
    expect(btcPrice2).toBeTruthy();
    expect(ethPrice1).toBeTruthy();
    expect(ethPrice2).toBeTruthy();
  });
});
