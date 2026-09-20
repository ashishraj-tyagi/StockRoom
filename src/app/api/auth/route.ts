import {
  clearSessionCookie,
  getSessionFromRequest,
  login,
  setSessionCookie,
  toPublicUser,
} from "@/lib/auth";
import { findUserById } from "@/lib/store";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { z } from "zod";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = loginSchema.parse(await request.json());
    const result = await login(body.username, body.password);
    if (!result.ok) {
      return jsonError(result.error, result.status);
    }
    await setSessionCookie(result.token);
    return jsonOk({ user: result.user, token: result.token });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError("Username and password are required", 400);
    }
    return handleRouteError(error);
  }
}

export async function DELETE() {
  await clearSessionCookie();
  return jsonOk({ ok: true });
}

export async function GET(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return jsonError("Not authenticated", 401);
    }
    const user = findUserById(session.id);
    if (!user) {
      return jsonError("Not authenticated", 401);
    }
    return jsonOk({ user: toPublicUser(user) });
  } catch (error) {
    return handleRouteError(error);
  }
}
