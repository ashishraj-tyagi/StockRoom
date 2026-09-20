export type Role = "user" | "admin";

export type User = {
  id: string;
  username: string;
  displayName: string;
  passwordHash: string;
  role: Role;
  locked: boolean;
};

export type Product = {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  imageHue: number;
};

export type CartItem = {
  productId: string;
  quantity: number;
};

export type OrderItem = {
  productId: string;
  name: string;
  sku: string;
  unitPrice: number;
  quantity: number;
};

export type OrderStatus = "placed" | "fulfilled" | "cancelled";

export type Order = {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
};

export type StoreData = {
  users: User[];
  products: Product[];
  carts: Record<string, CartItem[]>;
  orders: Order[];
};

export type PublicUser = {
  id: string;
  username: string;
  displayName: string;
  role: Role;
};

export type SessionPayload = {
  sub: string;
  username: string;
  role: Role;
};
