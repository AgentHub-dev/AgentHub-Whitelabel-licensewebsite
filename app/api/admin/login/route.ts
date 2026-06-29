import { NextRequest, NextResponse } from "next/server";

const LS = () => process.env.LICENSE_SERVER_URL || "http://localhost:3100";

export async function POST(req: NextRequest) {
  const { secret } = await req.json();
  if (!secret) {
    return NextResponse.json({ error: "Schlüssel erforderlich." }, { status: 400 });
  }

  // Proxy to licenseserver admin login — get a native licenseserver JWT
  const res = await fetch(`${LS()}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: secret }),
  }).catch(() => null);

  if (!res) return NextResponse.json({ error: "License server nicht erreichbar." }, { status: 502 });

  const data = await res.json();
  if (!res.ok) return NextResponse.json(data, { status: res.status });

  const token: string = data.token;
  if (!token) return NextResponse.json({ error: "Kein Token erhalten." }, { status: 500 });

  const response = NextResponse.json({ ok: true });
  response.cookies.set("admin_token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 86400,
  });
  return response;
}
