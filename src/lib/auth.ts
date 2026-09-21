import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { findUserByUsername, findUserById } from "./store";
import type { PublicUser, SessionPayload } from "./types";

export const SESSION_COOKIE = "stockroom_session";
const SESSION_TTL = "8h";

function secretKey() {
  const secret =
    process.env.STOCKROOM_SESSION_SECRET?.trim() ||
    "stockroom-dev-secret-change-me";
  return new TextEncoder().encode(secret);
}

export function toPublicUser(user: {
  id: string;
  username: string;
  displayName: string;
  role: "user" | "admin";
}): PublicUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
  };
}

export async function createSessionToken(
  payload: SessionPayload,
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(SESSION_TTL)
    .sign(secretKey());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (
      typeof payload.sub !== "string" ||
      typeof payload.username !== "string" ||
      (payload.role !== "user" && payload.role !== "admin")
    ) {
      return null;
    }
    return {
      sub: payload.sub,
      username: payload.username,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export async function login(
  username: string,
  password: string,
): Promise<
  | { ok: true; user: PublicUser; token: string }
  | { ok: false; error: string; status: number }
> {
  const user = findUserByUsername(username.trim());
  if (!user) {
    return { ok: false, error: "Invalid username or password", status: 401 };
  }
  if (user.locked) {
    return {
      ok: false,
      error: "Account is locked. Contact an administrator.",
      status: 403,
    };
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { ok: false, error: "Invalid username or password", status: 401 };
  }

  const token = await createSessionToken({
    sub: user.id,
    username: user.username,
    role: user.role,
  });

  return { ok: true, user: toPublicUser(user), token };
}

export async function getSession(): Promise<PublicUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifySessionToken(token);
  if (!payload) return null;
  const user = findUserById(payload.sub);
  if (!user || user.locked) return null;
  return toPublicUser(user);
}

export async function requireSession(request?: Request): Promise<PublicUser> {
  const session = request
    ? await getSessionFromRequest(request)
    : await getSession();
  if (!session) {
    throw new AuthError("Authentication required", 401);
  }
  return session;
}

export async function requireAdmin(request?: Request): Promise<PublicUser> {
  const session = await requireSession(request);
  if (session.role !== "admin") {
    throw new AuthError("Admin role required", 403);
  }
  return session;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8,
  };
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, sessionCookieOptions());
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export function bearerFromHeader(header: string | null): string | null {
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

export async function getSessionFromRequest(
  request: Request,
): Promise<PublicUser | null> {
  const auth = bearerFromHeader(request.headers.get("authorization"));
  if (auth) {
    const payload = await verifySessionToken(auth);
    if (!payload) return null;
    const user = findUserById(payload.sub);
    if (!user || user.locked) return null;
    return toPublicUser(user);
  }
  return getSession();
}
