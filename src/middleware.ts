import { jwtVerify } from "jose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE = "ar_session";

function getSecret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) return null;
  return new TextEncoder().encode(s);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const secret = getSecret();
  const token = req.cookies.get(COOKIE)?.value;

  if (pathname === "/login") {
    if (token && secret) {
      try {
        await jwtVerify(token, secret);
        return NextResponse.redirect(new URL("/", req.url));
      } catch {
        /* token invalid */
      }
    }
    return NextResponse.next();
  }

  if (!secret) {
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    const role = payload.role as string;

    if (pathname === "/") {
      if (role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      return NextResponse.redirect(new URL("/employee", req.url));
    }

    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/employee", req.url));
    }

    if (pathname.startsWith("/employee") && role !== "EMPLOYEE") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/admin/:path*", "/employee/:path*"],
};
