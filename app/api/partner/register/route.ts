import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { name, email, companyName, password } = await req.json();
  if (!name || !email || !companyName || !password) {
    return NextResponse.json(
      { error: "Alle Felder sind erforderlich." },
      { status: 400 }
    );
  }

  const stackUrl =
    process.env.PARTNER_STACK_URL ?? "https://license.agent-hub.app";

  try {
    const res = await fetch(`${stackUrl}/partner/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, companyName, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error ?? "Registrierung fehlgeschlagen." },
        { status: res.status }
      );
    }

    return NextResponse.json({ token: data.token, partner: data.partner });
  } catch {
    return NextResponse.json(
      { error: "Verbindung zum Server fehlgeschlagen." },
      { status: 502 }
    );
  }
}
