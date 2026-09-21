"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/types";
import { formatMoney } from "@/lib/money";
import { apiFetch } from "@/lib/api-client";

const emptyForm = {
  sku: "",
  name: "",
  description: "",
  category: "Electronics",
  price: "0",
  stock: "0",
};

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await apiFetch("/api/products");
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      setError(data.error ?? "Failed to load products");
      setLoading(false);
      return;
    }
    setProducts(data.products);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startEdit(product: Product) {
    setEditingId(product.id);
    setForm({
      sku: product.sku,
      name: product.name,
      description: product.description,
      category: product.category,
      price: String(product.price),
      stock: String(product.stock),
    });
    setSuccess(null);
    setError(null);
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const payload = {
      sku: form.sku.trim(),
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      price: Number(form.price),
      stock: Number(form.stock),
    };

    const res = await apiFetch(
      editingId ? `/api/products/${editingId}` : "/api/products",
      {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Save failed");
      return;
    }
    setSuccess(editingId ? "Product updated" : "Product created");
    resetForm();
    await load();
    router.refresh();
  }

  async function remove(id: string) {
    setError(null);
    const res = await apiFetch(`/api/products/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Delete failed");
      return;
    }
    setSuccess("Product deleted");
    if (editingId === id) resetForm();
    await load();
    router.refresh();
  }

  return (
    <section data-testid="admin-products-page">
      <h1 className="page-title">Admin · Products</h1>
      <p className="page-lead">
        Create, edit, and delete catalog items. Requires the admin role.
      </p>

      {error ? (
        <div className="alert alert-error" data-testid="admin-error">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="alert alert-success" data-testid="admin-success">
          {success}
        </div>
      ) : null}

      <div className="admin-grid">
        <form className="panel form-stack" onSubmit={onSubmit} data-testid="admin-product-form">
          <h2>{editingId ? "Edit product" : "New product"}</h2>
          <label>
            SKU
            <input
              data-testid="admin-sku"
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              required
            />
          </label>
          <label>
            Name
            <input
              data-testid="admin-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </label>
          <label>
            Description
            <textarea
              data-testid="admin-description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              required
            />
          </label>
          <label>
            Category
            <input
              data-testid="admin-category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              required
            />
          </label>
          <label>
            Price
            <input
              data-testid="admin-price"
              type="number"
              min={0}
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
          </label>
          <label>
            Stock
            <input
              data-testid="admin-stock"
              type="number"
              min={0}
              step={1}
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              required
            />
          </label>
          <div className="btn-row">
            <button
              type="submit"
              className="btn btn-accent"
              data-testid="admin-save"
            >
              {editingId ? "Update" : "Create"}
            </button>
            {editingId ? (
              <button
                type="button"
                className="btn btn-ghost"
                data-testid="admin-cancel-edit"
                onClick={resetForm}
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>

        <div className="table-wrap">
          {loading ? (
            <p className="muted" data-testid="admin-loading">
              Loading…
            </p>
          ) : (
            <table className="data" data-testid="admin-products-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.id}
                    data-testid={`admin-row-${product.id}`}
                  >
                    <td>{product.sku}</td>
                    <td>{product.name}</td>
                    <td>{formatMoney(product.price)}</td>
                    <td>{product.stock}</td>
                    <td>
                      <div className="btn-row" style={{ marginTop: 0 }}>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          data-testid={`admin-edit-${product.id}`}
                          onClick={() => startEdit(product)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger"
                          data-testid={`admin-delete-${product.id}`}
                          onClick={() => remove(product.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
}
