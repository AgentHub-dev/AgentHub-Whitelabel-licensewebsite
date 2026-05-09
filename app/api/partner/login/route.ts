import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "E-Mail und Passwort erforderlich." }, { status: 400 });
  }

  const stackUrl = process.env.PARTNER_STACK_URL ?? "https://138.2.173.221";

  try {
    const res = await fetch(`${stackUrl}/api/partner/auth/login`, {
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

    return NextResponse.json({ token: data.token, partner: data.partner });
  } catch {
    return NextResponse.json({ error: "Verbindung zum Partner-Server fehlgeschlagen." }, { status: 502 });
  }
}
