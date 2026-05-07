import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "session_id fehlt." }, { status: 400 });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const licenseServerUrl = process.env.LICENSE_SERVER_URL || "http://localhost:3100";
  const adminSecret = process.env.ADMIN_SECRET;

  if (!secretKey) {
    return NextResponse.json({ error: "Stripe nicht konfiguriert." }, { status: 503 });
  }

  try {
    const stripe = new Stripe(secretKey, { apiVersion: "2024-04-10" });
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const email = session.customer_details?.email || session.customer_email;

    if (!email) {
      return NextResponse.json({ error: "E-Mail nicht in Session gefunden." }, { status: 404 });
    }

    const res = await fetch(`${licenseServerUrl}/admin/licenses`, {
      headers: { Authorization: `Bearer ${adminSecret}` },
    });

    if (!res.ok) throw new Error("License server unreachable");

    const data = await res.json();
    const licenses: Array<{ tenant_email: string; key: string; status: string }> =
      data.licenses || [];

    const license = licenses.find(
      (l) => l.tenant_email?.toLowerCase() === email.toLowerCase()
    );

    if (!license) {
      return NextResponse.json(
        { error: "Keine Lizenz für diese Session gefunden." },
        { status: 404 }
      );
    }

    return NextResponse.json({ key: license.key, email });
  } catch (err) {
    console.error("Key lookup error:", err);
    return NextResponse.json({ error: "Fehler beim Abrufen des Keys." }, { status: 500 });
  }
}
