export const SEED_CREDENTIALS = [
  {
    username: "standard",
    password: "password123",
    role: "user",
    notes: "Browse products, manage cart, place orders",
  },
  {
    username: "admin",
    password: "admin123",
    role: "admin",
    notes: "All user abilities plus product CRUD",
  },
  {
    username: "locked",
    password: "password123",
    role: "user",
    notes: "Login always rejected (negative auth tests)",
  },
] as const;
