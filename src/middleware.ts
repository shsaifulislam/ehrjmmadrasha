import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

import { getJwtSecretBytes } from "@/lib/jwtSecret";

const JWT_SECRET = getJwtSecretBytes();


const SESSION_COOKIE_NAME = "ehrj_session_token";

interface TokenPayload {
  userId: string;
  username: string;
  role: string;
  email: string;
  name: string;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permanent redirect legacy /guardian paths to canonical /portal
  if (pathname === "/guardian" || pathname.startsWith("/guardian/")) {
    return NextResponse.redirect(new URL("/portal", request.url), 308);
  }

  const isApiRoute = pathname.startsWith("/api/");

  // Support CORS preflight for mobile and web API clients
  if (request.method === "OPTIONS" && isApiRoute) {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
        "Access-Control-Max-Age": "86400",
      },
    });
  }
  const isAdminPath = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  const isTeacherPath = pathname.startsWith("/teacher") || pathname.startsWith("/api/teacher");
  const isPrincipalPath = pathname.startsWith("/principal") || pathname.startsWith("/api/principal");
  const isPortalPath = pathname.startsWith("/portal") || pathname.startsWith("/api/portal");

  if (!isAdminPath && !isTeacherPath && !isPrincipalPath && !isPortalPath) {
    const res = NextResponse.next();
    res.headers.set("X-Content-Type-Options", "nosniff");
    res.headers.set("X-Frame-Options", "SAMEORIGIN");
    return res;
  }

  let token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }
  }

  if (!token) {
    if (isApiRoute) {
      return NextResponse.json(
        { error: "অননুমোদিত: অনুগ্রহ করে লগইন করুন (401 Unauthorized)" },
        { status: 401, headers: { "X-Content-Type-Options": "nosniff" } }
      );
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    if (isPortalPath) {
      loginUrl.searchParams.set("tab", "guardian");
    } else {
      loginUrl.searchParams.set("tab", "institutional");
    }
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { clockTolerance: 30 });
    const userRole = (payload as unknown as TokenPayload).role;

    if (isAdminPath && userRole !== "ADMIN" && userRole !== "PRINCIPAL") {
      if (isApiRoute) {
        return NextResponse.json(
          { error: "অননুমোদিত অ্যাক্সেস: কেবলমাত্র অ্যাডমিন বা অধ্যক্ষের জন্য প্রযোজ্য (403 Forbidden)" },
          { status: 403, headers: { "X-Content-Type-Options": "nosniff" } }
        );
      }
      return new NextResponse(
        "অননুমোদিত অ্যাক্সেস: আপনার এই পেজে প্রবেশের অনুমতি নেই (403 Forbidden)",
        {
          status: 403,
          headers: { "Content-Type": "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff" },
        }
      );
    }

    if (isTeacherPath && userRole !== "TEACHER" && userRole !== "ADMIN" && userRole !== "PRINCIPAL") {
      if (isApiRoute) {
        return NextResponse.json(
          { error: "অননুমোদিত অ্যাক্সেস: কেবলমাত্র শিক্ষকগণের জন্য প্রযোজ্য (403 Forbidden)" },
          { status: 403, headers: { "X-Content-Type-Options": "nosniff" } }
        );
      }
      return new NextResponse(
        "অননুমোদিত অ্যাক্সেস: কেবলমাত্র শিক্ষকগণের জন্য প্রযোজ্য (403 Forbidden)",
        {
          status: 403,
          headers: { "Content-Type": "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff" },
        }
      );
    }

    if (isPrincipalPath && userRole !== "PRINCIPAL" && userRole !== "ADMIN") {
      if (isApiRoute) {
        return NextResponse.json(
          { error: "অননুমোদিত অ্যাক্সেস: কেবলমাত্র অধ্যক্ষের জন্য প্রযোজ্য (403 Forbidden)" },
          { status: 403, headers: { "X-Content-Type-Options": "nosniff" } }
        );
      }
      return new NextResponse(
        "অননুমোদিত অ্যাক্সেস: অধ্যক্ষ তদারকি প্যানেল (403 Forbidden)",
        {
          status: 403,
          headers: { "Content-Type": "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff" },
        }
      );
    }

    if (isPortalPath && userRole !== "GUARDIAN" && userRole !== "ADMIN" && userRole !== "PRINCIPAL") {
      if (isApiRoute) {
        return NextResponse.json(
          { error: "অননুমোদিত অ্যাক্সেস: কেবলমাত্র অভিভাবকের জন্য প্রযোজ্য (403 Forbidden)" },
          { status: 403, headers: { "X-Content-Type-Options": "nosniff" } }
        );
      }
      return new NextResponse(
        "অননুমোদিত অ্যাক্সেস: অভিভাবক পোর্টাল কেবল নিবন্ধিত অভিভাবকের জন্য (403 Forbidden)",
        {
          status: 403,
          headers: { "Content-Type": "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff" },
        }
      );
    }

    const res = NextResponse.next();
    res.headers.set("X-Content-Type-Options", "nosniff");
    res.headers.set("X-Frame-Options", "SAMEORIGIN");
    return res;
  } catch {
    // Invalid or expired token
    if (isApiRoute) {
      return NextResponse.json(
        { error: "অবৈধ বা মেয়াদোত্তীর্ণ সেশন (401 Unauthorized)" },
        { status: 401, headers: { "X-Content-Type-Options": "nosniff" } }
      );
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }
}

export const config = {
  matcher: [
    "/guardian",
    "/guardian/:path*",
    "/admin",
    "/admin/:path*",
    "/teacher",
    "/teacher/:path*",
    "/principal",
    "/principal/:path*",
    "/portal",
    "/portal/:path*",
    "/api/admin/:path*",
    "/api/teacher/:path*",
    "/api/principal/:path*",
    "/api/portal/:path*",
  ],
};
