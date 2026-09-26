import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "ehrj-madrasa-digital-campus-secure-production-jwt-secret-key-2026"
);

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

  const isAdminPath = pathname.startsWith("/admin");
  const isTeacherPath = pathname.startsWith("/teacher");
  const isPrincipalPath = pathname.startsWith("/principal");

  if (!isAdminPath && !isTeacherPath && !isPrincipalPath) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userRole = (payload as unknown as TokenPayload).role;

    if (isAdminPath && userRole !== "ADMIN") {
      return new NextResponse(
        "অননুমোদিত অ্যাক্সেস: আপনার এই পেজে প্রবেশের অনুমতি নেই (403 Forbidden)",
        {
          status: 403,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        }
      );
    }

    if (isTeacherPath && userRole !== "TEACHER" && userRole !== "ADMIN") {
      return new NextResponse(
        "অননুমোদিত অ্যাক্সেস: কেবলমাত্র শিক্ষকগণের জন্য প্রযোজ্য (403 Forbidden)",
        {
          status: 403,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        }
      );
    }

    if (isPrincipalPath && userRole !== "PRINCIPAL" && userRole !== "ADMIN") {
      return new NextResponse(
        "অননুমোদিত অ্যাক্সেস: অধ্যক্ষ তদারকি প্যানেল (403 Forbidden)",
        {
          status: 403,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        }
      );
    }

    return NextResponse.next();
  } catch {
    // Invalid or expired token
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }
}

export const config = {
  matcher: ["/admin/:path*", "/teacher/:path*", "/principal/:path*"],
};
