import fs from "fs";
import path from "path";
import { createSeedData } from "./seed";
import type {
  CartItem,
  Order,
  OrderItem,
  Product,
  StoreData,
  User,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

declare global {
  // Persistent across hot reloads in development.
  var __stockroomStore: StoreData | undefined;
}

function cloneStore(data: StoreData): StoreData {
  return structuredClone(data);
}

function ensureLoaded(): StoreData {
  if (globalThis.__stockroomStore) {
    return globalThis.__stockroomStore;
  }

  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, "utf8");
      globalThis.__stockroomStore = JSON.parse(raw) as StoreData;
      return globalThis.__stockroomStore;
    }
  } catch {
    // Fall through to seed.
  }

  const seeded = createSeedData();
  globalThis.__stockroomStore = seeded;
  persist();
  return seeded;
}

function persist() {
  const store = globalThis.__stockroomStore;
  if (!store) return;
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
  } catch {
    // Read-only environments (e.g. some hosts) keep in-memory state only.
  }
}

export function getStore(): StoreData {
  return ensureLoaded();
}

export function resetStore(): StoreData {
  globalThis.__stockroomStore = createSeedData();
  persist();
  return cloneStore(globalThis.__stockroomStore);
}

export function findUserByUsername(username: string): User | undefined {
  return getStore().users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase(),
  );
}

export function findUserById(id: string): User | undefined {
  return getStore().users.find((u) => u.id === id);
}

export function listProducts(params?: {
  q?: string;
  category?: string;
  sort?: "name" | "price_asc" | "price_desc" | "stock";
}): Product[] {
  let items = [...getStore().products];

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
    case "name":
    default:
      items.sort((a, b) => a.name.localeCompare(b.name));
  }

  return items;
}

export function getProduct(id: string): Product | undefined {
  return getStore().products.find((p) => p.id === id);
}

export function createProduct(
  input: Omit<Product, "id">,
): Product {
  const store = getStore();
  const product: Product = {
    ...input,
    id: `prod-${Date.now()}`,
  };
  store.products.push(product);
  persist();
  return product;
}

export function updateProduct(
  id: string,
  patch: Partial<Omit<Product, "id">>,
): Product | undefined {
  const store = getStore();
  const idx = store.products.findIndex((p) => p.id === id);
  if (idx === -1) return undefined;
  store.products[idx] = { ...store.products[idx], ...patch, id };
  persist();
  return store.products[idx];
}

export function deleteProduct(id: string): boolean {
  const store = getStore();
  const before = store.products.length;
  store.products = store.products.filter((p) => p.id !== id);
  for (const userId of Object.keys(store.carts)) {
    store.carts[userId] = store.carts[userId].filter((c) => c.productId !== id);
  }
  persist();
  return store.products.length < before;
}

export function getCart(userId: string): CartItem[] {
  return [...(getStore().carts[userId] ?? [])];
}

export function setCartItem(
  userId: string,
  productId: string,
  quantity: number,
): CartItem[] {
  const store = getStore();
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

  persist();
  return getCart(userId);
}

export function clearCart(userId: string) {
  const store = getStore();
  store.carts[userId] = [];
  persist();
}

export function listOrders(userId?: string, role?: string): Order[] {
  const orders = getStore().orders;
  if (role === "admin") {
    return [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  return orders
    .filter((o) => o.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function placeOrder(userId: string): Order | { error: string } {
  const store = getStore();
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
  persist();
  return order;
}

export function categories(): string[] {
  return [...new Set(getStore().products.map((p) => p.category))].sort();
}
