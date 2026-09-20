import {
  getSessionFromRequest,
  requireAdmin,
  AuthError,
} from "@/lib/auth";
import {
  categories,
  createProduct,
  listProducts,
} from "@/lib/store";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { z } from "zod";

export async function GET(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return jsonError("Authentication required", 401);
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") ?? undefined;
    const category = searchParams.get("category") ?? undefined;
    const sort = (searchParams.get("sort") as
      | "name"
      | "price_asc"
      | "price_desc"
      | "stock"
      | null) ?? "name";

    const products = listProducts({ q, category, sort });
    return jsonOk({ products, categories: categories() });
  } catch (error) {
    return handleRouteError(error);
  }
}

const productSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  price: z.number().nonnegative(),
  stock: z.number().int().nonnegative(),
  imageHue: z.number().int().min(0).max(360).optional(),
});

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const body = productSchema.parse(await request.json());
    const product = createProduct({
      ...body,
      imageHue: body.imageHue ?? Math.floor(Math.random() * 360),
    });
    return jsonOk({ product }, { status: 201 });
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
