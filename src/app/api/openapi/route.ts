import { jsonOk } from "@/lib/api";

const openApi = {
  openapi: "3.0.3",
  info: {
    title: "StockRoom API",
    version: "1.0.0",
    description:
      "Inventory and order desk API for UI/API automation practice. Authenticate via cookie session or Bearer token from POST /api/auth.",
  },
  servers: [{ url: "/" }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "stockroom_session",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: { error: { type: "string" } },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string" },
          username: { type: "string" },
          displayName: { type: "string" },
          role: { type: "string", enum: ["user", "admin"] },
        },
      },
      Product: {
        type: "object",
        properties: {
          id: { type: "string" },
          sku: { type: "string" },
          name: { type: "string" },
          description: { type: "string" },
          category: { type: "string" },
          price: { type: "number" },
          stock: { type: "integer" },
          imageHue: { type: "integer" },
        },
      },
      Order: {
        type: "object",
        properties: {
          id: { type: "string" },
          userId: { type: "string" },
          total: { type: "number" },
          status: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          items: { type: "array", items: { type: "object" } },
        },
      },
    },
  },
  paths: {
    "/api/health": {
      get: {
        summary: "Health check",
        responses: { "200": { description: "Service is healthy" } },
      },
    },
    "/api/auth": {
      post: {
        summary: "Login",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "password"],
                properties: {
                  username: { type: "string" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Authenticated; returns user + token" },
          "401": { description: "Invalid credentials" },
          "403": { description: "Locked account" },
        },
      },
      get: {
        summary: "Current session",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          "200": { description: "Current user" },
          "401": { description: "Not authenticated" },
        },
      },
      delete: {
        summary: "Logout",
        responses: { "200": { description: "Session cleared" } },
      },
    },
    "/api/products": {
      get: {
        summary: "List products",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: "q", in: "query", schema: { type: "string" } },
          { name: "category", in: "query", schema: { type: "string" } },
          {
            name: "sort",
            in: "query",
            schema: {
              type: "string",
              enum: ["name", "price_asc", "price_desc", "stock"],
            },
          },
        ],
        responses: { "200": { description: "Product list" } },
      },
      post: {
        summary: "Create product (admin)",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          "201": { description: "Created" },
          "403": { description: "Forbidden" },
        },
      },
    },
    "/api/products/{id}": {
      get: {
        summary: "Get product",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Product" },
          "404": { description: "Not found" },
        },
      },
      patch: {
        summary: "Update product (admin)",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: { "200": { description: "Updated" } },
      },
      delete: {
        summary: "Delete product (admin)",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: { "200": { description: "Deleted" } },
      },
    },
    "/api/cart": {
      get: {
        summary: "Get cart",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { "200": { description: "Cart contents" } },
      },
      put: {
        summary: "Upsert cart line",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["productId", "quantity"],
                properties: {
                  productId: { type: "string" },
                  quantity: { type: "integer" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Updated cart" } },
      },
      delete: {
        summary: "Clear cart",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { "200": { description: "Empty cart" } },
      },
    },
    "/api/orders": {
      get: {
        summary: "List orders",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { "200": { description: "Orders for user (or all if admin)" } },
      },
      post: {
        summary: "Place order from cart",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          "201": { description: "Order created" },
          "400": { description: "Empty cart or stock issue" },
        },
      },
    },
    "/api/test/reset": {
      post: {
        summary: "Reset store to seed data",
        description: "Use between automation suites for deterministic state.",
        responses: { "200": { description: "Reset complete" } },
      },
    },
  },
};

export async function GET() {
  return jsonOk(openApi);
}
