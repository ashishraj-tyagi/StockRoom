"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { apiFetch } from "@/lib/api-client";
import type { PublicUser } from "@/lib/types";

const PUBLIC_PATHS = ["/login"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [ready, setReady] = useState(false);

  async function refresh() {
    const auth = await apiFetch("/api/auth");
    if (!auth.ok) {
      setUser(null);
      setCartCount(0);
      return null;
    }
    const data = (await auth.json()) as { user: PublicUser };
    setUser(data.user);
    const cart = await apiFetch("/api/cart");
    if (cart.ok) {
      const cartData = (await cart.json()) as { itemCount?: number };
      setCartCount(cartData.itemCount ?? 0);
    }
    return data.user;
  }

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      const session = await refresh();
      if (cancelled) return;

      const isPublic = PUBLIC_PATHS.some(
        (path) => pathname === path || pathname.startsWith(`${path}/`),
      );

      if (!session && !isPublic && pathname !== "/login") {
        router.replace(`/login?next=${encodeURIComponent(pathname || "/")}`);
      } else if (session && pathname === "/login") {
        router.replace("/products");
      } else if (session && pathname.startsWith("/admin") && session.role !== "admin") {
        router.replace("/products");
      } else if (pathname === "/") {
        router.replace(session ? "/products" : "/login");
      }

      setReady(true);
    }
    boot();
    const onChange = () => {
      void refresh();
    };
    window.addEventListener("stockroom:changed", onChange);
    return () => {
      cancelled = true;
      window.removeEventListener("stockroom:changed", onChange);
    };
  }, [pathname, router]);

  return (
    <>
      <AppHeader user={user} cartCount={cartCount} />
      <main>{ready || pathname === "/login" ? children : null}</main>
    </>
  );
}
