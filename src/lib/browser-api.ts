import bcrypt from "bcryptjs";
import {
  categories,
  clearCart,
  clearSession,
  createProduct,
  deleteProduct,
  enrichCart,
  findUserById,
  findUserByUsername,
  getProduct,
  getSessionUser,
  listOrders,
  listProducts,
  placeOrder,
  resetBrowserStore,
  setCartItem,
  setSessionUser,
  toPublicUser,
  updateProduct,
} from "./browser-store";

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status);
}

async function readJson(init?: RequestInit): Promise<Record<string, unknown>> {
  if (!init?.body) return {};
  if (typeof init.body === "string") {
    return JSON.parse(init.body) as Record<string, unknown>;
  }
  return {};
}

function requireSession() {
  const session = getSessionUser();
  if (!session) {
    return { session: null, error: errorResponse("Authentication required", 401) };
  }
  const user = findUserById(session.id);
  if (!user || user.locked) {
    clearSession();
    return { session: null, error: errorResponse("Authentication required", 401) };
  }
  return { session: toPublicUser(user), error: null };
}

export async function handleBrowserApi(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const method = (init?.method ?? "GET").toUpperCase();
  const url = new URL(path, "https://stockroom.local");
  const pathname = url.pathname.replace(/\/$/, "") || "/";

  if (pathname === "/api/health") {
    return jsonResponse({
      status: "ok",
      service: "StockRoom",
      version: "1.0.0",
      mode: "static",
      timestamp: new Date().toISOString(),
    });
  }

  if (pathname === "/api/test/reset" && method === "POST") {
    resetBrowserStore();
    return jsonResponse({ ok: true });
  }

  if (pathname === "/api/auth" && method === "POST") {
    const body = await readJson(init);
    const username = String(body.username ?? "").trim();
    const password = String(body.password ?? "");
    const user = findUserByUsername(username);
    if (!user) {
      return errorResponse("Invalid username or password", 401);
    }
    if (user.locked) {
      return errorResponse("Account is locked. Contact an administrator.", 403);
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return errorResponse("Invalid username or password", 401);
    }
    const publicUser = toPublicUser(user);
    setSessionUser(publicUser);
    return jsonResponse({ user: publicUser, token: publicUser.id });
  }

  if (pathname === "/api/auth" && method === "GET") {
    const { session, error } = requireSession();
    if (error) return error;
    return jsonResponse({ user: session });
  }

  if (pathname === "/api/auth" && method === "DELETE") {
    clearSession();
    return jsonResponse({ ok: true });
  }

  if (pathname === "/api/products" && method === "GET") {
    const { error } = requireSession();
    if (error) return error;
    const products = listProducts({
      q: url.searchParams.get("q") ?? undefined,
      category: url.searchParams.get("category") ?? undefined,
      sort: (url.searchParams.get("sort") as
        | "name"
        | "price_asc"
        | "price_desc"
        | "stock"
        | null) ?? "name",
    });
    return jsonResponse({ products, categories: categories() });
  }

  if (pathname === "/api/products" && method === "POST") {
    const { session, error } = requireSession();
    if (error) return error;
    if (session!.role !== "admin") {
      return errorResponse("Admin role required", 403);
    }
    const body = await readJson(init);
    const product = createProduct({
      sku: String(body.sku ?? ""),
      name: String(body.name ?? ""),
      description: String(body.description ?? ""),
      category: String(body.category ?? ""),
      price: Number(body.price ?? 0),
      stock: Number(body.stock ?? 0),
      imageHue:
        typeof body.imageHue === "number"
          ? body.imageHue
          : Math.floor(Math.random() * 360),
    });
    return jsonResponse({ product }, 201);
  }

  const productMatch = pathname.match(/^\/api\/products\/([^/]+)$/);
  if (productMatch) {
    const id = decodeURIComponent(productMatch[1]);
    const { session, error } = requireSession();
    if (error) return error;

    if (method === "GET") {
      const product = getProduct(id);
      if (!product) return errorResponse("Product not found", 404);
      return jsonResponse({ product });
    }

    if (session!.role !== "admin") {
      return errorResponse("Admin role required", 403);
    }

    if (method === "PATCH") {
      const body = await readJson(init);
      const product = updateProduct(id, {
        sku: body.sku as string | undefined,
        name: body.name as string | undefined,
        description: body.description as string | undefined,
        category: body.category as string | undefined,
        price: typeof body.price === "number" ? body.price : undefined,
        stock: typeof body.stock === "number" ? body.stock : undefined,
        imageHue: typeof body.imageHue === "number" ? body.imageHue : undefined,
      });
      if (!product) return errorResponse("Product not found", 404);
      return jsonResponse({ product });
    }

    if (method === "DELETE") {
      const deleted = deleteProduct(id);
      if (!deleted) return errorResponse("Product not found", 404);
      return jsonResponse({ ok: true });
    }
  }

  if (pathname === "/api/cart") {
    const { session, error } = requireSession();
    if (error) return error;

    if (method === "GET") {
      return jsonResponse(enrichCart(session!.id));
    }

    if (method === "PUT") {
      const body = await readJson(init);
      const productId = String(body.productId ?? "");
      const quantity = Number(body.quantity ?? 0);
      const product = getProduct(productId);
      if (!product) return errorResponse("Product not found", 404);
      if (quantity > product.stock) {
        return errorResponse(
          `Only ${product.stock} units available for ${product.name}`,
          400,
        );
      }
      setCartItem(session!.id, productId, quantity);
      return jsonResponse(enrichCart(session!.id));
    }

    if (method === "DELETE") {
      clearCart(session!.id);
      return jsonResponse(enrichCart(session!.id));
    }
  }

  if (pathname === "/api/orders") {
    const { session, error } = requireSession();
    if (error) return error;

    if (method === "GET") {
      return jsonResponse({
        orders: listOrders(session!.id, session!.role),
      });
    }

    if (method === "POST") {
      const result = placeOrder(session!.id);
      if ("error" in result) return errorResponse(result.error, 400);
      return jsonResponse({ order: result }, 201);
    }
  }

  return errorResponse("Not found", 404);
}
