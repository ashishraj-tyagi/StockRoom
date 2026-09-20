import { resetStore } from "@/lib/store";
import { jsonOk } from "@/lib/api";

/** Reset seed data for deterministic automation runs. */
export async function POST() {
  const store = resetStore();
  return jsonOk({
    ok: true,
    message: "Store reset to seed data",
    counts: {
      users: store.users.length,
      products: store.products.length,
      orders: store.orders.length,
    },
  });
}
