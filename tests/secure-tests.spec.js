import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3000";

//
// HOMEPAGE
//
test("Home page loads", async ({ page }) => {
  await page.goto(BASE, { waitUntil: "load" });
  await expect(page.locator("a[href='/products']")).toBeVisible();
});

//
// ADD TO CART (WebKit-safe)
//
test("User can add product to cart", async ({ page }) => {
  await page.goto(`${BASE}/products`, { waitUntil: "load" });

  // Click without waiting for navigation (Safari doesn't emit nav events)
  await page.locator("text=Add to cart").first().click();

  // Manually open /cart
  await page.goto(`${BASE}/cart`, { waitUntil: "load" });

  await expect(page.locator("ul li").first()).toBeVisible();
});

//
// XSS BLOCKING
//
test("Secure: Stored XSS is sanitized", async ({ page }) => {
  await page.goto(`${BASE}/products`, { waitUntil: "load" });
  await page.locator("text=View").first().click();

  // Ensure form exists
  await expect(page.locator("textarea[name='content']")).toBeVisible();

  // Submit form (no navigation wait)
  await page.fill("textarea[name='content']", "<script>alert(1)</script>");
  await page.click("button[type=submit]");

  // Reload detail page to ensure data saved
  await page.reload({ waitUntil: "load" });

  const text = await page.locator("ul li").last().innerText();
  expect(text).not.toContain("<script>");
  expect(text).not.toContain("alert");
});

//
// SQL Injection BLOCKED
//
test("Secure: SQL Injection does NOT expose all products", async ({ page }) => {
  await page.goto(`${BASE}/products?search=%25' OR '1'='1`, {
    waitUntil: "load"
  });

  const count = await page.locator("ul li").count();
  expect(count).toBeLessThan(5);
});

//
// ADMIN LOGIN REQUIRED
//
test("Secure: Admin cannot access panel without login", async ({ page }) => {
  const response = await page.goto(`${BASE}/admin`, { waitUntil: "load" });

  await expect(page.locator("body")).toContainText("Access denied");
  expect(response.status()).toBe(403);
});

//
// ADMIN LOGIN (WebKit-safe)
//
test("Secure: Admin can login", async ({ page }) => {
  await page.goto(`${BASE}/admin/login`, { waitUntil: "load" });

  await page.fill("input[name='username']", "admin");
  await page.fill("input[name='password']", "admin123");

  // Click login (no navigation wait)
  await page.click("button[type=submit]");

  // Now manually wait until admin panel loaded
  await page.waitForURL(`${BASE}/admin`);

  await expect(page.locator("h1")).toHaveText("Admin Panel");
});

//
// CSRF PROTECTION
//
test("Secure: Payment requires CSRF token", async ({ request }) => {
  const response = await request.post(`${BASE}/cart/pay`, {
    form: { card: "1234123412341234" }
  });

  expect(response.status()).toBe(403);
});

//
// SECURITY HEADERS VIA HELMET
//
test("Secure: Security headers present", async ({ page }) => {
  const response = await page.goto(`${BASE}`, { waitUntil: "load" });
  const headers = response.headers();

  expect(headers).toHaveProperty("x-content-type-options");
  expect(headers).toHaveProperty("x-frame-options");
  expect(headers).toHaveProperty("x-xss-protection");
});
