import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";

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

    const jwtSecret = process.env.JWT_SECRET;

    // Trust the licenseserver's admin claim — it verified both bcrypt + ADMIN_EMAIL match
    const isAdmin = data.partner?.isAdmin === true || data.partner?.role === 'admin';

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
