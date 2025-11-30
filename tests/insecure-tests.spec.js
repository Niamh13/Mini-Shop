import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3000";

//
// BASIC PAGE
//
test("Insecure: products page loads", async ({ page }) => {
  await page.goto(`${BASE}/products`);
  await expect(page.getByRole("heading", { name: "Products" })).toBeVisible();
});

//
// SQL Injection SHOULD expose all products
//
test("Insecure: SQL Injection exposes all products", async ({ page }) => {
  await page.goto(`${BASE}/products?search=%25' OR '1'='1`);

  // count View links instead of <li>
  const count = await page.getByText("View").count();

  expect(count).toBeGreaterThan(2);
});

//
// Stored XSS should NOT be sanitized
//
test("Insecure: Stored XSS is NOT sanitized", async ({ page }) => {
  await page.goto(`${BASE}/products`);

  // Click "View"
  await page.getByText("View").first().click();

  // Use a safe but executing payload
  const payload = "<script>window.XSS_TEST=true;</script>";

  await page.fill("textarea[name='content']", payload);
  await page.click("button[type=submit]");

  // Fetch raw HTML from the reviews list
  const html = await page.locator("ul li").last().innerHTML();

  // It should contain the actual <script> tag
  expect(html).toContain("<script>");
  expect(html).toContain("window.XSS_TEST");
});



//
// Admin should be public
//
test("Insecure: Admin page is publicly accessible", async ({ page }) => {
  await page.goto(`${BASE}/admin`);
  await expect(page.locator("h1")).toContainText("Admin Panel");
});

//
// Orders should expose full card numbers (insecure leakage)
//
test("Insecure: Orders expose full card numbers", async ({ page }) => {
  // Submit an insecure order
  await page.request.post(`${BASE}/cart/pay`, {
    form: { card: "9999 8888 7777 6666" }
  });

  await page.goto(`${BASE}/admin`);
  const text = await page.locator("body").innerText();

  // Looks for ANY card number (insecure)
  expect(text).toMatch(/Card:\s*\d/);
});

//
// Payment should NOT require CSRF
//
test("Insecure: Payment works without CSRF token", async ({ request }) => {
  const response = await request.post(`${BASE}/cart/pay`, {
    form: { card: "5555 4444 3333 2222" }
  });

  // Should NOT block — insecure behaviour
  expect(response.status()).toBe(200);
});

//
// Product detail page works
//
test("Insecure: Product detail page loads correctly", async ({ page }) => {
  await page.goto(`${BASE}/products`);

  await page.getByText("View").first().click();
  await expect(page.locator("h1")).toBeVisible();
});
