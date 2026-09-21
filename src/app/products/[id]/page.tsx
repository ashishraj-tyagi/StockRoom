import { createSeedData } from "@/lib/seed";
import ProductDetailPage from "./detail-client";

export function generateStaticParams() {
  return createSeedData().products.map((product) => ({ id: product.id }));
}

export default function Page() {
  return <ProductDetailPage />;
}
