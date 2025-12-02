import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3000";


// hoem page loads
test("Home page loads", async ({ page }) => {
  await page.goto(BASE, { waitUntil: "load" });
  await expect(page.locator("a[href='/products']")).toBeVisible();
});

// add to cart
test("User can add product to cart", async ({ page }) => {
  await page.goto(`${BASE}/products`, { waitUntil: "load" });

  // wait for redirect
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load" }),
    page.locator("text=Add to cart").first().click()
  ]);

  // visit cart
  await page.goto(`${BASE}/cart`, { waitUntil: "load" });

  // should contain at least one <li>
  await expect(page.locator("ul li").first()).toBeVisible();
});

// XSS blocking - sanitization (stored)
test("Secure: Stored XSS is sanitized", async ({ page }) => {
  await page.goto(`${BASE}/products`, { waitUntil: "load" });
  await page.locator("text=View").first().click();

  // form is present
  await expect(page.locator("textarea[name='content']")).toBeVisible();

  // submit sanitized review
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load" }),
    page.fill("textarea[name='content']", "<script>alert(1)</script>").then(() =>
      page.click("button[type=submit]")
    )
  ]);

  const text = await page.locator("ul li").last().innerText();

  expect(text).not.toContain("<script>");
  expect(text).not.toContain("alert");
});

// SQL Injection blocking
test("Secure: SQL Injection does NOT expose all products", async ({ page }) => {
  await page.goto(`${BASE}/products?search=%25' OR '1'='1`, {
    waitUntil: "load"
  });

  const count = await page.locator("ul li").count();
  expect(count).toBeLessThan(5);
});

// admin login is required to access panel
test("Secure: Admin cannot access panel without login", async ({ page }) => {
  const response = await page.goto(`${BASE}/admin`, {
    waitUntil: "load"
  });

  await expect(page.locator("body")).toContainText("Access denied");
  expect(response.status()).toBe(403);
});

// admin can login
test("Secure: Admin can login", async ({ page }) => {
  // visit login with load (CSRF & cookie load)
  await page.goto(`${BASE}/admin/login`, { waitUntil: "load" });

  await page.fill("input[name='username']", "admin");
  await page.fill("input[name='password']", "admin123");

  // login submit
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load" }),
    page.click("button[type=submit]")
  ]);

  await expect(page.locator("h1")).toHaveText("Admin Panel");
});

// CSRF protection on payment
test("Secure: Payment requires CSRF token", async ({ request }) => {
  const response = await request.post(`${BASE}/cart/pay`, {
    form: { card: "1234123412341234" }
  });

  expect(response.status()).toBe(403);
});

// Security headers present (helmet)
test("Secure: Security headers present", async ({ page }) => {
  const response = await page.goto(`${BASE}`, { waitUntil: "load" });
  const headers = response.headers();

  expect(headers).toHaveProperty("x-content-type-options");
  expect(headers).toHaveProperty("x-frame-options");
  expect(headers).toHaveProperty("x-xss-protection");
});
