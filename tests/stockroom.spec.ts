import { test, expect } from "@playwright/test";

test.describe("StockRoom UI", () => {
  test.beforeEach(async ({ request }) => {
    await request.post("/api/test/reset");
  });

  test("rejects locked user login", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("login-username").fill("locked");
    await page.getByTestId("login-password").fill("password123");
    await page.getByTestId("login-submit").click();
    await expect(page.getByTestId("login-error")).toContainText(/locked/i);
  });

  test("standard user can order a product", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("login-username").fill("standard");
    await page.getByTestId("login-password").fill("password123");
    await page.getByTestId("login-submit").click();
    await expect(page.getByTestId("products-page")).toBeVisible();

    await page.getByTestId("product-link-prod-1").click();
    await expect(page.getByTestId("product-detail-page")).toBeVisible();
    await page.getByTestId("add-to-cart").click();
    await expect(page.getByTestId("add-cart-success")).toBeVisible();

    await page.getByTestId("nav-cart").click();
    await expect(page.getByTestId("cart-table")).toBeVisible();
    await page.getByTestId("checkout-link").click();
    await page.getByTestId("place-order").click();
    await expect(page.getByTestId("order-placed-banner")).toBeVisible();
    await expect(page.getByTestId("orders-table")).toBeVisible();
  });
});

test.describe("StockRoom API", () => {
  test.beforeEach(async ({ request }) => {
    await request.post("/api/test/reset");
  });

  test("health and openapi are public", async ({ request }) => {
    const health = await request.get("/api/health");
    expect(health.ok()).toBeTruthy();
    const openapi = await request.get("/api/openapi");
    expect(openapi.ok()).toBeTruthy();
    const body = await openapi.json();
    expect(body.openapi).toMatch(/^3\./);
  });

  test("admin can create a product via API", async ({ request }) => {
    const login = await request.post("/api/auth", {
      data: { username: "admin", password: "admin123" },
    });
    expect(login.ok()).toBeTruthy();
    const { token } = await login.json();

    const create = await request.post("/api/products", {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        sku: "SR-TEST-1",
        name: "Automation Widget",
        description: "Created by API test",
        category: "Electronics",
        price: 9.99,
        stock: 5,
      },
    });
    expect(create.status()).toBe(201);
    const { product } = await create.json();
    expect(product.sku).toBe("SR-TEST-1");
  });

  test("standard user cannot create products", async ({ request }) => {
    const login = await request.post("/api/auth", {
      data: { username: "standard", password: "password123" },
    });
    const { token } = await login.json();
    const create = await request.post("/api/products", {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        sku: "SR-FAIL",
        name: "Should Fail",
        description: "Nope",
        category: "Electronics",
        price: 1,
        stock: 1,
      },
    });
    expect(create.status()).toBe(403);
  });
});
