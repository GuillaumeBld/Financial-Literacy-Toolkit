import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

const publicRoutes = ["/start", "/api/auth", "/api/health", "/"];

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;

    if (publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
      return NextResponse.next();
    }

    if (!req.nextauth.token) {
      const signInUrl = req.nextUrl.clone();
      signInUrl.pathname = "/start";
      signInUrl.search = "";
      return NextResponse.redirect(signInUrl);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => Boolean(token)
    }
  }
);

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|assets|manifest.json).*)"]
};
