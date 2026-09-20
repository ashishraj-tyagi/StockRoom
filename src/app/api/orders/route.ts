import { getSessionFromRequest } from "@/lib/auth";
import { listOrders, placeOrder } from "@/lib/store";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return jsonError("Authentication required", 401);
    }
    const orders = listOrders(session.id, session.role);
    return jsonOk({ orders });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return jsonError("Authentication required", 401);
    }
    const result = placeOrder(session.id);
    if ("error" in result) {
      return jsonError(result.error, 400);
    }
    return jsonOk({ order: result }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
