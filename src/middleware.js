import { NextResponse } from "next/server";

export const config = {
  matcher: "/integrations/:path*",
};

export function middleware(request) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-createxyz-project-id", "87f6997e-a603-40f0-ba4f-6fd3601882cd");
  requestHeaders.set("x-createxyz-project-group-id", "8cd259be-13eb-45a6-838f-94b9fafb9783");


  request.nextUrl.href = `https://www.create.xyz/${request.nextUrl.pathname}`;

  return NextResponse.rewrite(request.nextUrl, {
    request: {
      headers: requestHeaders,
    },
  });
}