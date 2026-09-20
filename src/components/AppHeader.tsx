"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { PublicUser } from "@/lib/types";

const links = [
  { href: "/products", label: "Catalog", testId: "nav-products" },
  { href: "/cart", label: "Cart", testId: "nav-cart" },
  { href: "/orders", label: "Orders", testId: "nav-orders" },
  { href: "/admin/products", label: "Admin", testId: "nav-admin", adminOnly: true },
];

export function AppHeader({
  user,
  cartCount = 0,
}: {
  user: PublicUser | null;
  cartCount?: number;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  if (!user || pathname === "/login") {
    return (
      <header className="site-header" data-testid="site-header-public">
        <Link href="/login" className="brand" data-testid="brand-link">
          StockRoom
        </Link>
        <p className="tagline">Inventory desk under test</p>
      </header>
    );
  }

  return (
    <header className="site-header" data-testid="site-header">
      <div className="header-top">
        <Link href="/products" className="brand" data-testid="brand-link">
          StockRoom
        </Link>
        <div className="header-user">
          <span data-testid="user-display">
            {user.displayName}
            <em data-testid="user-role"> ({user.role})</em>
          </span>
          <button
            type="button"
            className="btn btn-ghost"
            data-testid="logout-button"
            onClick={logout}
          >
            Log out
          </button>
        </div>
      </div>
      <nav className="site-nav" data-testid="site-nav" aria-label="Main">
        {links
          .filter((l) => !l.adminOnly || user.role === "admin")
          .map((link) => (
            <Link
              key={link.href}
              href={link.href}
              data-testid={link.testId}
              className={pathname.startsWith(link.href) ? "active" : undefined}
            >
              {link.label}
              {link.href === "/cart" && cartCount > 0 ? (
                <span className="badge" data-testid="cart-badge">
                  {cartCount}
                </span>
              ) : null}
            </Link>
          ))}
      </nav>
    </header>
  );
}
