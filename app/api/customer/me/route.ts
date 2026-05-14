import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return NextResponse.json({ error: "Server nicht konfiguriert." }, { status: 503 });
  }

  let payload: { licenseKey: string; email: string };
  try {
    payload = jwt.verify(auth.slice(7), jwtSecret) as { licenseKey: string; email: string };
  } catch {
    return NextResponse.json({ error: "Ungültiger Token." }, { status: 401 });
  }

  const licenseServerUrl = process.env.LICENSE_SERVER_URL || "http://localhost:3100";
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) {
    return NextResponse.json({ error: "Server nicht konfiguriert." }, { status: 503 });
  }

  // Validate licenseKey from JWT payload before using in URL path
  if (!/^WL-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(payload.licenseKey)) {
    return NextResponse.json({ error: "Ungültiger Token." }, { status: 401 });
  }

  try {
    const res = await fetch(
      `${licenseServerUrl}/admin/licenses/${payload.licenseKey}`,
      { headers: { Authorization: `Bearer ${adminSecret}` } }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Lizenz nicht gefunden." }, { status: 404 });
    }

    const data = await res.json();
    return NextResponse.json({ license: data.license });
  } catch (err) {
    console.error("Customer me error:", err);
    return NextResponse.json({ error: "Verbindungsfehler." }, { status: 500 });
  }
}
