import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// Login sessions = signed JWT in an httpOnly cookie.
// - httpOnly: browser JS can't read it (XSS can't steal it).
// - SameSite=Lax + Secure-in-prod: CSRF-safe.
// jose only (no bcryptjs) so middleware.ts can import this on the Edge.
const COOKIE_NAME = "pcms_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface SessionPayload {
  username: string;
  slug: string; // which portfolio this owner may edit
  [key: string]: unknown; // index signature required by jose SignJWT (JWTPayload)
}

function secretKey(): Uint8Array {
  // Falls back to a dev secret so `npm run dev` works with no .env,
  // but production MUST set SESSION_SECRET (see .env.example).
  return new TextEncoder().encode(
    process.env.SESSION_SECRET ?? "dev-secret-change-me"
  );
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secretKey());
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE_SECONDS,
    path: "/",
  });
}

export async function verifySession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const username = payload.username;
    const slug = payload.slug;
    if (typeof username !== "string" || typeof slug !== "string") return null;
    return { username, slug };
  } catch {
    return null; // expired / tampered / wrong secret -> logged out
  }
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
