import { AuthError, getSessionFromRequest, requireAdmin } from "@/lib/auth";
import {
  deleteProduct,
  getProduct,
  updateProduct,
} from "@/lib/store";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return jsonError("Authentication required", 401);
    }
    const { id } = await params;
    const product = getProduct(id);
    if (!product) {
      return jsonError("Product not found", 404);
    }
    return jsonOk({ product });
  } catch (error) {
    return handleRouteError(error);
  }
}

const patchSchema = z.object({
  sku: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  price: z.number().nonnegative().optional(),
  stock: z.number().int().nonnegative().optional(),
  imageHue: z.number().int().min(0).max(360).optional(),
});

export async function PATCH(request: Request, { params }: Params) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const body = patchSchema.parse(await request.json());
    const product = updateProduct(id, body);
    if (!product) {
      return jsonError("Product not found", 404);
    }
    return jsonOk({ product });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError("Invalid product payload", 400);
    }
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status);
    }
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const deleted = deleteProduct(id);
    if (!deleted) {
      return jsonError("Product not found", 404);
    }
    return jsonOk({ ok: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status);
    }
    return handleRouteError(error);
  }
}
