"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Product } from "@/lib/types";
import { formatMoney } from "@/lib/money";
import { apiFetch } from "@/lib/api-client";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await apiFetch(`/api/products/${id}`);
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error(data.error ?? "Product not found");
        }
        if (!cancelled) setProduct(data.product);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  async function addToCart() {
    setError(null);
    setSuccess(null);
    const res = await apiFetch("/api/cart", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: id, quantity }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not update cart");
      return;
    }
    setSuccess(`Added ${quantity} to cart`);
    router.refresh();
  }

  if (loading) {
    return (
      <p className="muted" data-testid="product-detail-loading">
        Loading product…
      </p>
    );
  }

  if (!product) {
    return (
      <div className="alert alert-error" data-testid="product-detail-error">
        {error ?? "Product not found"}
      </div>
    );
  }

  const outOfStock = product.stock <= 0;

  return (
    <section data-testid="product-detail-page">
      <h1 className="page-title" data-testid="product-detail-name">
        {product.name}
      </h1>
      <p className="page-lead" data-testid="product-detail-sku">
        {product.sku} · {product.category}
      </p>

      <div className="detail-layout">
        <div
          className="detail-visual"
          data-testid="product-detail-visual"
          style={{
            background: `linear-gradient(135deg, hsl(${product.imageHue} 42% 70%), hsl(${product.imageHue} 55% 38%))`,
          }}
        />
        <div className="panel">
          <p data-testid="product-detail-description">{product.description}</p>
          <p className="meta" style={{ marginTop: "1rem" }}>
            <strong data-testid="product-detail-price">
              {formatMoney(product.price)}
            </strong>
            <span
              className={outOfStock ? "stock out" : "stock"}
              data-testid="product-detail-stock"
            >
              {outOfStock ? "Out of stock" : `${product.stock} in stock`}
            </span>
          </p>

          <div className="qty-control" style={{ marginTop: "1rem" }}>
            <label htmlFor="qty">Qty</label>
            <input
              id="qty"
              data-testid="add-qty"
              type="number"
              min={1}
              max={Math.max(product.stock, 1)}
              value={quantity}
              disabled={outOfStock}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </div>

          {error ? (
            <div className="alert alert-error" data-testid="add-cart-error">
              {error}
            </div>
          ) : null}
          {success ? (
            <div className="alert alert-success" data-testid="add-cart-success">
              {success}
            </div>
          ) : null}

          <div className="btn-row">
            <button
              type="button"
              className="btn btn-accent"
              data-testid="add-to-cart"
              disabled={outOfStock}
              onClick={addToCart}
            >
              Add to cart
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              data-testid="back-to-catalog"
              onClick={() => router.push("/products")}
            >
              Back to catalog
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
