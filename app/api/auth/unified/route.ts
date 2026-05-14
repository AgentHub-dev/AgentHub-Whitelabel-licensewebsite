import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { randomUUID, timingSafeEqual } from "crypto";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json(
      { error: "E-Mail und Passwort erforderlich." },
      { status: 400 }
    );
  }

  const stackUrl =
    process.env.PARTNER_STACK_URL ?? "https://license.agent-hub.app";

  try {
    const res = await fetch(`${stackUrl}/partner/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error ?? "Ungültige Anmeldedaten." },
        { status: res.status }
      );
    }

    const adminEmail = process.env.ADMIN_EMAIL ?? "";
    const adminSecret = process.env.ADMIN_SECRET ?? "";
    const jwtSecret = process.env.JWT_SECRET;

    // Email match alone is insufficient — also verify password against ADMIN_SECRET
    // to prevent an attacker who registered with the admin email from getting admin JWT.
    let isAdmin = false;
    if (adminEmail && email.toLowerCase() === adminEmail.toLowerCase() && adminSecret && jwtSecret) {
      try {
        const a = Buffer.from(password);
        const b = Buffer.from(adminSecret);
        isAdmin = a.length === b.length && timingSafeEqual(a, b);
      } catch { /* length mismatch → not admin */ }
    }

    const response = NextResponse.json({
      token: data.token,
      partner: data.partner,
      isAdmin,
    });

    if (isAdmin && jwtSecret) {
      const adminToken = jwt.sign(
        { role: "admin", jti: randomUUID() },
        jwtSecret,
        { expiresIn: "24h" }
      );
      const isSecure = process.env.NODE_ENV === "production";
      response.cookies.set("admin_token", adminToken, {
        httpOnly: true,
        secure: isSecure,
        sameSite: "lax",
        path: "/",
        maxAge: 86400,
      });
    }

    return response;
  } catch {
    return NextResponse.json(
      { error: "Verbindung zum Server fehlgeschlagen." },
      { status: 502 }
    );
  }
}
