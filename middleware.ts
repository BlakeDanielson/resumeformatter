import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get("auth_token");
  const isAuthenticated = authToken?.value === "authenticated";

  // Allow access to login API route
  if (request.nextUrl.pathname.startsWith("/api/auth/login")) {
    return NextResponse.next();
  }

  // Protect API routes (except auth routes)
  if (request.nextUrl.pathname.startsWith("/api/") && !request.nextUrl.pathname.startsWith("/api/auth/")) {
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // Allow access to auth routes
  if (request.nextUrl.pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  // For all other routes, let Next.js handle them
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/:path*",
  ],
};
