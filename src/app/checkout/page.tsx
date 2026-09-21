"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/types";
import { formatMoney } from "@/lib/money";
import { apiFetch } from "@/lib/api-client";

type CartLine = {
  productId: string;
  quantity: number;
  product: Product;
  lineTotal: number;
};

export default function CheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartLine[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await apiFetch("/api/cart");
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        setError(data.error ?? "Failed to load cart");
        return;
      }
      setItems(data.items);
      setTotal(data.total);
    }
    load();
  }, [router]);

  async function placeOrder() {
    setPlacing(true);
    setError(null);
    const res = await apiFetch("/api/orders", { method: "POST" });
    const data = await res.json();
    setPlacing(false);
    if (!res.ok) {
      setError(data.error ?? "Could not place order");
      return;
    }
    router.push(`/orders?placed=${data.order.id}`);
    router.refresh();
  }

  return (
    <section data-testid="checkout-page">
      <h1 className="page-title">Checkout</h1>
      <p className="page-lead">Confirm your cart and place the order.</p>

      {error ? (
        <div className="alert alert-error" data-testid="checkout-error">
          {error}
        </div>
      ) : null}

      {items.length === 0 ? (
        <div className="empty-state panel" data-testid="checkout-empty">
          Nothing to check out.{" "}
          <Link href="/products">Return to catalog</Link>.
        </div>
      ) : (
        <div className="panel">
          <ul data-testid="checkout-summary">
            {items.map((item) => (
              <li key={item.productId}>
                {item.quantity} × {item.product.name} —{" "}
                {formatMoney(item.lineTotal)}
              </li>
            ))}
          </ul>
          <p style={{ marginTop: "1rem" }}>
            Total:{" "}
            <strong data-testid="checkout-total">{formatMoney(total)}</strong>
          </p>
          <div className="btn-row">
            <button
              type="button"
              className="btn btn-accent"
              data-testid="place-order"
              disabled={placing}
              onClick={placeOrder}
            >
              {placing ? "Placing…" : "Place order"}
            </button>
            <Link href="/cart" className="btn btn-ghost" data-testid="back-to-cart">
              Back to cart
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
