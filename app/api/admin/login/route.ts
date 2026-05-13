import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { timingSafeEqual } from "crypto";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const { secret } = await req.json();
  if (!secret) {
    return NextResponse.json({ error: "Schlüssel erforderlich." }, { status: 400 });
  }

  const adminSecret = process.env.ADMIN_SECRET;
  const jwtSecret = process.env.JWT_SECRET;

  if (!adminSecret || !jwtSecret) {
    return NextResponse.json({ error: "Server nicht konfiguriert." }, { status: 503 });
  }

  // Constant-time comparison to prevent timing attacks
  let valid = false;
  try {
    const a = Buffer.from(secret);
    const b = Buffer.from(adminSecret);
    valid = a.length === b.length && timingSafeEqual(a, b);
  } catch { /* length mismatch handled above */ }

  if (!valid) {
    return NextResponse.json({ error: "Ungültiger Admin-Schlüssel." }, { status: 403 });
  }

  const token = jwt.sign({ role: "admin", jti: randomUUID() }, jwtSecret, { expiresIn: "24h" });

  const isSecure = process.env.NODE_ENV === "production";
  const response = NextResponse.json({ ok: true });
  response.cookies.set("admin_token", token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
    maxAge: 86400,
  });
  return response;
}
