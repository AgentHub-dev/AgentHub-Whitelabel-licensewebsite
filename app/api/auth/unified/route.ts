import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

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
    const isAdmin =
      !!adminEmail && email.toLowerCase() === adminEmail.toLowerCase();

    let adminToken: string | undefined;
    if (isAdmin) {
      const jwtSecret = process.env.JWT_SECRET;
      if (jwtSecret) {
        adminToken = jwt.sign({ role: "admin" }, jwtSecret, {
          expiresIn: "24h",
        });
      }
    }

    return NextResponse.json({
      token: data.token,
      partner: data.partner,
      isAdmin,
      adminToken,
    });
  } catch {
    return NextResponse.json(
      { error: "Verbindung zum Server fehlgeschlagen." },
      { status: 502 }
    );
  }
}
