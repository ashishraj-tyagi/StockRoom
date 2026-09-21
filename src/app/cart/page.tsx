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

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartLine[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    const res = await apiFetch("/api/cart");
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      setError(data.error ?? "Failed to load cart");
      setLoading(false);
      return;
    }
    setItems(data.items);
    setTotal(data.total);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function updateQty(productId: string, quantity: number) {
    setError(null);
    const res = await apiFetch("/api/cart", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not update cart");
      return;
    }
    setItems(data.items);
    setTotal(data.total);
    router.refresh();
  }

  async function clear() {
    await apiFetch("/api/cart", { method: "DELETE" });
    await load();
    router.refresh();
  }

  if (loading) {
    return (
      <p className="muted" data-testid="cart-loading">
        Loading cart…
      </p>
    );
  }

  return (
    <section data-testid="cart-page">
      <h1 className="page-title">Cart</h1>
      <p className="page-lead">Adjust quantities or continue to checkout.</p>

      {error ? (
        <div className="alert alert-error" data-testid="cart-error">
          {error}
        </div>
      ) : null}

      {items.length === 0 ? (
        <div className="empty-state panel" data-testid="cart-empty">
          Your cart is empty.{" "}
          <Link href="/products" data-testid="cart-empty-catalog-link">
            Browse the catalog
          </Link>
          .
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="data" data-testid="cart-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th>Line</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.productId}
                    data-testid={`cart-row-${item.productId}`}
                  >
                    <td>
                      <strong>{item.product.name}</strong>
                      <div className="muted">{item.product.sku}</div>
                    </td>
                    <td>{formatMoney(item.product.price)}</td>
                    <td>
                      <div className="qty-control">
                        <input
                          data-testid={`cart-qty-${item.productId}`}
                          type="number"
                          min={0}
                          max={item.product.stock + item.quantity}
                          value={item.quantity}
                          onChange={(e) =>
                            updateQty(item.productId, Number(e.target.value))
                          }
                        />
                      </div>
                    </td>
                    <td data-testid={`cart-line-total-${item.productId}`}>
                      {formatMoney(item.lineTotal)}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        data-testid={`cart-remove-${item.productId}`}
                        onClick={() => updateQty(item.productId, 0)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel" style={{ marginTop: "1rem" }}>
            <p>
              Total:{" "}
              <strong data-testid="cart-total">{formatMoney(total)}</strong>
            </p>
            <div className="btn-row">
              <Link
                href="/checkout"
                className="btn btn-accent"
                data-testid="checkout-link"
              >
                Checkout
              </Link>
              <button
                type="button"
                className="btn btn-ghost"
                data-testid="clear-cart"
                onClick={clear}
              >
                Clear cart
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
