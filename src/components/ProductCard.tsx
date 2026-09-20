import Link from "next/link";
import type { Product } from "@/lib/types";
import { formatMoney } from "@/lib/money";

export function ProductCard({ product }: { product: Product }) {
  const outOfStock = product.stock <= 0;
  return (
    <article
      className="product-card"
      data-testid={`product-card-${product.id}`}
      style={
        {
          "--hue": product.imageHue,
        } as React.CSSProperties
      }
    >
      <div className="product-swatch" aria-hidden />
      <div className="product-body">
        <p className="sku" data-testid={`product-sku-${product.id}`}>
          {product.sku}
        </p>
        <h2>
          <Link
            href={`/products/${product.id}`}
            data-testid={`product-link-${product.id}`}
          >
            {product.name}
          </Link>
        </h2>
        <p className="meta">
          <span data-testid={`product-category-${product.id}`}>
            {product.category}
          </span>
          <span data-testid={`product-price-${product.id}`}>
            {formatMoney(product.price)}
          </span>
        </p>
        <p
          className={outOfStock ? "stock out" : "stock"}
          data-testid={`product-stock-${product.id}`}
        >
          {outOfStock ? "Out of stock" : `${product.stock} in stock`}
        </p>
      </div>
    </article>
  );
}
