"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Order } from "@/lib/types";
import { formatMoney } from "@/lib/money";

function OrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const placed = searchParams.get("placed");
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        setError(data.error ?? "Failed to load orders");
        setLoading(false);
        return;
      }
      setOrders(data.orders);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <p className="muted" data-testid="orders-loading">
        Loading orders…
      </p>
    );
  }

  return (
    <section data-testid="orders-page">
      <h1 className="page-title">Orders</h1>
      <p className="page-lead">Placed orders for the signed-in account.</p>

      {placed ? (
        <div className="alert alert-success" data-testid="order-placed-banner">
          Order {placed} placed successfully.
        </div>
      ) : null}

      {error ? (
        <div className="alert alert-error" data-testid="orders-error">
          {error}
        </div>
      ) : null}

      {orders.length === 0 ? (
        <div className="empty-state panel" data-testid="orders-empty">
          No orders yet.
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data" data-testid="orders-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Date</th>
                <th>Status</th>
                <th>Items</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} data-testid={`order-row-${order.id}`}>
                  <td data-testid={`order-id-${order.id}`}>{order.id}</td>
                  <td>{new Date(order.createdAt).toLocaleString()}</td>
                  <td data-testid={`order-status-${order.id}`}>{order.status}</td>
                  <td>
                    {order.items
                      .map((i) => `${i.quantity}× ${i.name}`)
                      .join(", ")}
                  </td>
                  <td data-testid={`order-total-${order.id}`}>
                    {formatMoney(order.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <p className="muted" data-testid="orders-loading">
          Loading orders…
        </p>
      }
    >
      <OrdersContent />
    </Suspense>
  );
}
