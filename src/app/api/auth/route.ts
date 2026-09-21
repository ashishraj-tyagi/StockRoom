import {
  SESSION_COOKIE,
  getSessionFromRequest,
  login,
  sessionCookieOptions,
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
    const response = jsonOk({ user: result.user, token: result.token });
    response.cookies.set(SESSION_COOKIE, result.token, sessionCookieOptions());
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError("Username and password are required", 400);
    }
    return handleRouteError(error);
  }
}

export async function DELETE() {
  const response = jsonOk({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", {
    ...sessionCookieOptions(),
    maxAge: 0,
  });
  return response;
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
