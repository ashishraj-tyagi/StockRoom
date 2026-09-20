import { getSessionFromRequest } from "@/lib/auth";
import {
  clearCart,
  getCart,
  getProduct,
  setCartItem,
} from "@/lib/store";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { z } from "zod";

function enrichCart(userId: string) {
  const items = getCart(userId)
    .map((item) => {
      const product = getProduct(item.productId);
      if (!product) return null;
      return {
        productId: item.productId,
        quantity: item.quantity,
        product,
        lineTotal: Math.round(product.price * item.quantity * 100) / 100,
      };
    })
    .filter(Boolean);

  const total = items.reduce((sum, item) => sum + (item?.lineTotal ?? 0), 0);
  return {
    items,
    total: Math.round(total * 100) / 100,
    itemCount: items.reduce((sum, item) => sum + (item?.quantity ?? 0), 0),
  };
}

export async function GET(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return jsonError("Authentication required", 401);
    }
    return jsonOk(enrichCart(session.id));
  } catch (error) {
    return handleRouteError(error);
  }
}

const upsertSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int(),
});

export async function PUT(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return jsonError("Authentication required", 401);
    }
    const body = upsertSchema.parse(await request.json());
    const product = getProduct(body.productId);
    if (!product) {
      return jsonError("Product not found", 404);
    }
    if (body.quantity > product.stock) {
      return jsonError(
        `Only ${product.stock} units available for ${product.name}`,
        400,
      );
    }
    setCartItem(session.id, body.productId, body.quantity);
    return jsonOk(enrichCart(session.id));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError("productId and quantity are required", 400);
    }
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return jsonError("Authentication required", 401);
    }
    clearCart(session.id);
    return jsonOk(enrichCart(session.id));
  } catch (error) {
    return handleRouteError(error);
  }
}
