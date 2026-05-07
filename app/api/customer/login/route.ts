import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "E-Mail erforderlich." }, { status: 400 });
  }

  const licenseServerUrl = process.env.LICENSE_SERVER_URL || "http://localhost:3100";
  const adminSecret = process.env.ADMIN_SECRET;
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    return NextResponse.json({ error: "Server nicht konfiguriert." }, { status: 503 });
  }

  try {
    const res = await fetch(`${licenseServerUrl}/admin/licenses`, {
      headers: { Authorization: `Bearer ${adminSecret}` },
    });

    if (!res.ok) throw new Error("License server unreachable");

    const data = await res.json();
    const licenses: Array<{ tenant_email: string; key: string }> = data.licenses || [];
    const license = licenses.find(
      (l) => l.tenant_email?.toLowerCase() === email.toLowerCase()
    );

    if (!license) {
      return NextResponse.json(
        { error: "Kein Konto mit dieser E-Mail gefunden." },
        { status: 404 }
      );
    }

    const token = jwt.sign(
      { email: email.toLowerCase(), licenseKey: license.key },
      jwtSecret,
      { expiresIn: "7d" }
    );

    return NextResponse.json({ token });
  } catch (err) {
    console.error("Customer login error:", err);
    return NextResponse.json({ error: "Verbindungsfehler." }, { status: 500 });
  }
}
