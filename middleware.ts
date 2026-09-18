import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession } from "@/lib/session";

// Gatekeeper for private pages. Runs on the Edge before any page loads:
// logged-out visitors hitting /dashboard* are bounced to /login.
// NOTE: only jose (Edge-safe) is imported here — never bcryptjs.
export async function middleware(request: NextRequest) {
  const session = await verifySession();
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

// Only these paths trigger the check (public pages stay fast + open).
export const config = {
  matcher: ["/dashboard/:path*"],
};
