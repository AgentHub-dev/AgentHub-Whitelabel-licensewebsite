import { NextRequest, NextResponse } from "next/server";

// Coach-Ready-Plan Phase 8: analog zu /api/partner/register, aber gegen den
// eigenen /coach/register-Endpunkt im License-Server (nicht /partner/register
// -- das erzeugt einen unabhaengigen Tier-1-Partner im alten Modell).
export async function POST(req: NextRequest) {
  const { name, email, companyName, password, ref } = await req.json();
  if (!name || !email || !companyName || !password) {
    return NextResponse.json(
      { error: "Alle Felder sind erforderlich." },
      { status: 400 }
    );
  }

  const stackUrl =
    process.env.PARTNER_STACK_URL ?? "https://license.agent-hub.app";

  try {
    const res = await fetch(`${stackUrl}/coach/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, companyName, password, ref }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error ?? "Registrierung fehlgeschlagen." },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Verbindung zum Server fehlgeschlagen." },
      { status: 502 }
    );
  }
}
