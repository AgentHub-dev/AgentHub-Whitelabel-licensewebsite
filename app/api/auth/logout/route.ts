import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const adminToken = req.cookies.get("admin_token")?.value;

  // Forward logout to backend so the JTI is blacklisted
  if (adminToken) {
    const licenseServerUrl = process.env.LICENSE_SERVER_URL || "http://localhost:3100";
    try {
      await fetch(`${licenseServerUrl}/admin/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    } catch { /* noop — cookie is cleared regardless */ }
  }

  const response = NextResponse.json({ loggedOut: true });
  response.cookies.set("admin_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
