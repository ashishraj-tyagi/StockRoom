"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch, isStaticHost } from "@/lib/api-client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/products";
  const [username, setUsername] = useState(isStaticHost ? "" : "standard");
  const [password, setPassword] = useState(isStaticHost ? "" : "password123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError("Unable to reach the server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-shell">
      <section className="login-panel" data-testid="login-panel">
        <h1 data-testid="login-heading">Sign in</h1>
        <p className="helper">
          {isStaticHost
            ? "Sign in to use the catalog, cart, and admin flows."
            : "Use a seeded account from the README to exercise auth, catalog, cart, and admin flows."}
        </p>

        <form className="form-stack" onSubmit={onSubmit} data-testid="login-form">
          <label>
            Username
            <input
              data-testid="login-username"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              data-testid="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error ? (
            <div className="alert alert-error" data-testid="login-error" role="alert">
              {error}
            </div>
          ) : null}

          <button
            className="btn btn-accent"
            type="submit"
            data-testid="login-submit"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="login-shell">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
