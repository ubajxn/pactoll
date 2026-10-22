import { type NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    return NextResponse.rewrite(new URL("/suite.html", request.url));
  }

  if (pathname === "/site" || pathname === "/site/") {
    return NextResponse.rewrite(new URL("/site/index.html", request.url));
  }

  const headers = new Headers(request.headers);
  headers.set(
    "x-crm-return-to",
    pathname + request.nextUrl.search,
  );
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
