import { createSeedData } from "./seed";
import type {
  CartItem,
  Order,
  OrderItem,
  Product,
  PublicUser,
  StoreData,
  User,
} from "./types";

const STORE_KEY = "stockroom.store";
const SESSION_KEY = "stockroom.session";

function clone<T>(value: T): T {
  return structuredClone(value);
}

export function loadStore(): StoreData {
  if (typeof window === "undefined") {
    return createSeedData();
  }
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw) as StoreData;
  } catch {
    // Fall through to seed.
  }
  const seeded = createSeedData();
  persistStore(seeded);
  return seeded;
}

function persistStore(store: StoreData) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
  window.dispatchEvent(new Event("stockroom:changed"));
}

export function resetBrowserStore(): StoreData {
  const seeded = createSeedData();
  persistStore(seeded);
  clearSession();
  return clone(seeded);
}

export function getSessionUser(): PublicUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PublicUser;
  } catch {
    return null;
  }
}

export function setSessionUser(user: PublicUser | null) {
  if (typeof window === "undefined") return;
  if (!user) {
    window.localStorage.removeItem(SESSION_KEY);
  } else {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  }
  window.dispatchEvent(new Event("stockroom:changed"));
}

export function clearSession() {
  setSessionUser(null);
}

export function findUserByUsername(username: string): User | undefined {
  return loadStore().users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase(),
  );
}

export function findUserById(id: string): User | undefined {
  return loadStore().users.find((u) => u.id === id);
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
  };
}

export function listProducts(params?: {
  q?: string;
  category?: string;
  sort?: "name" | "price_asc" | "price_desc" | "stock";
}): Product[] {
  let items = [...loadStore().products];

  if (params?.q) {
    const q = params.q.toLowerCase();
    items = items.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q),
    );
  }

  if (params?.category && params.category !== "all") {
    items = items.filter((p) => p.category === params.category);
  }

  switch (params?.sort) {
    case "price_asc":
      items.sort((a, b) => a.price - b.price);
      break;
    case "price_desc":
      items.sort((a, b) => b.price - a.price);
      break;
    case "stock":
      items.sort((a, b) => b.stock - a.stock);
      break;
    default:
      items.sort((a, b) => a.name.localeCompare(b.name));
  }

  return items;
}

export function getProduct(id: string): Product | undefined {
  return loadStore().products.find((p) => p.id === id);
}

export function createProduct(input: Omit<Product, "id">): Product {
  const store = loadStore();
  const product: Product = { ...input, id: `prod-${Date.now()}` };
  store.products.push(product);
  persistStore(store);
  return product;
}

export function updateProduct(
  id: string,
  patch: Partial<Omit<Product, "id">>,
): Product | undefined {
  const store = loadStore();
  const idx = store.products.findIndex((p) => p.id === id);
  if (idx === -1) return undefined;
  store.products[idx] = { ...store.products[idx], ...patch, id };
  persistStore(store);
  return store.products[idx];
}

export function deleteProduct(id: string): boolean {
  const store = loadStore();
  const before = store.products.length;
  store.products = store.products.filter((p) => p.id !== id);
  for (const userId of Object.keys(store.carts)) {
    store.carts[userId] = store.carts[userId].filter((c) => c.productId !== id);
  }
  persistStore(store);
  return store.products.length < before;
}

export function getCart(userId: string): CartItem[] {
  return [...(loadStore().carts[userId] ?? [])];
}

export function setCartItem(
  userId: string,
  productId: string,
  quantity: number,
): CartItem[] {
  const store = loadStore();
  const cart = store.carts[userId] ?? [];
  const existing = cart.find((c) => c.productId === productId);

  if (quantity <= 0) {
    store.carts[userId] = cart.filter((c) => c.productId !== productId);
  } else if (existing) {
    existing.quantity = quantity;
    store.carts[userId] = cart;
  } else {
    store.carts[userId] = [...cart, { productId, quantity }];
  }

  persistStore(store);
  return getCart(userId);
}

export function clearCart(userId: string) {
  const store = loadStore();
  store.carts[userId] = [];
  persistStore(store);
}

export function listOrders(userId?: string, role?: string): Order[] {
  const orders = loadStore().orders;
  if (role === "admin") {
    return [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  return orders
    .filter((o) => o.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function placeOrder(userId: string): Order | { error: string } {
  const store = loadStore();
  const cart = store.carts[userId] ?? [];
  if (cart.length === 0) {
    return { error: "Cart is empty" };
  }

  const items: OrderItem[] = [];
  let total = 0;

  for (const line of cart) {
    const product = store.products.find((p) => p.id === line.productId);
    if (!product) {
      return { error: `Product ${line.productId} no longer exists` };
    }
    if (product.stock < line.quantity) {
      return {
        error: `Insufficient stock for ${product.name} (available: ${product.stock})`,
      };
    }
    items.push({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      unitPrice: product.price,
      quantity: line.quantity,
    });
    total += product.price * line.quantity;
  }

  for (const line of cart) {
    const product = store.products.find((p) => p.id === line.productId)!;
    product.stock -= line.quantity;
  }

  const order: Order = {
    id: `ord-${Date.now()}`,
    userId,
    items,
    total: Math.round(total * 100) / 100,
    status: "placed",
    createdAt: new Date().toISOString(),
  };

  store.orders.unshift(order);
  store.carts[userId] = [];
  persistStore(store);
  return order;
}

export function categories(): string[] {
  return [...new Set(loadStore().products.map((p) => p.category))].sort();
}

export function enrichCart(userId: string) {
  const items = getCart(userId)
    .map((item) => {
      const product = getProduct(item.productId);
      if (!product) return null;
      return {
        productId: item.productId,
        quantity: item.quantity,
        product,
        lineTotal: Math.round(product.price * item.quantity * 100) / 100,
      };
    })
    .filter(Boolean);

  const total = items.reduce((sum, item) => sum + (item?.lineTotal ?? 0), 0);
  return {
    items,
    total: Math.round(total * 100) / 100,
    itemCount: items.reduce((sum, item) => sum + (item?.quantity ?? 0), 0),
  };
}
