"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/lib/types";
import { Suspense } from "react";

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const q = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "all";
  const sort = searchParams.get("sort") ?? "name";

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category && category !== "all") params.set("category", category);
    if (sort) params.set("sort", sort);
    return params.toString();
  }, [q, category, sort]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/products?${queryString}`);
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error(data.error ?? "Failed to load products");
        }
        if (!cancelled) {
          setProducts(data.products);
          setCategories(data.categories);
        }
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
  }, [queryString, router]);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") params.delete(key);
    else params.set(key, value);
    router.push(`/products?${params.toString()}`);
  }

  return (
    <section data-testid="products-page">
      <h1 className="page-title">Catalog</h1>
      <p className="page-lead">
        Search, filter, and open products. Out-of-stock items stay visible for
        negative path tests.
      </p>

      <div className="filters" data-testid="product-filters">
        <input
          data-testid="search-input"
          placeholder="Search name, SKU, or description"
          defaultValue={q}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              updateParam("q", (e.target as HTMLInputElement).value.trim());
            }
          }}
          onBlur={(e) => updateParam("q", e.target.value.trim())}
        />
        <select
          data-testid="category-filter"
          value={category}
          onChange={(e) => updateParam("category", e.target.value)}
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          data-testid="sort-filter"
          value={sort}
          onChange={(e) => updateParam("sort", e.target.value)}
        >
          <option value="name">Name</option>
          <option value="price_asc">Price ↑</option>
          <option value="price_desc">Price ↓</option>
          <option value="stock">Stock</option>
        </select>
        <button
          type="button"
          className="btn btn-ghost"
          data-testid="clear-filters"
          onClick={() => router.push("/products")}
        >
          Clear
        </button>
      </div>

      {error ? (
        <div className="alert alert-error" data-testid="products-error">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="muted" data-testid="products-loading">
          Loading catalog…
        </p>
      ) : products.length === 0 ? (
        <div className="empty-state panel" data-testid="products-empty">
          No products match your filters.
        </div>
      ) : (
        <div className="product-grid" data-testid="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <p className="muted" data-testid="products-loading">
          Loading catalog…
        </p>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
