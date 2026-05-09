import { NextRequest, NextResponse } from "next/server";
import https from "https";

export const runtime = "nodejs";

function httpsPost(url: string, body: string): Promise<{ status: number; data: unknown }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || 443,
        path: parsed.pathname,
        method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
        rejectUnauthorized: false, // self-signed cert on internal stack server
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          try { resolve({ status: res.statusCode ?? 500, data: JSON.parse(raw) }); }
          catch { reject(new Error("Invalid JSON from upstream")); }
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

export async function POST(req: NextRequest) {
  const { name, email, companyName, password } = await req.json();
  if (!name || !email || !companyName || !password) {
    return NextResponse.json({ error: "Alle Felder sind erforderlich." }, { status: 400 });
  }

  const stackUrl = process.env.PARTNER_STACK_URL ?? "https://138.2.173.221";

  try {
    const { status, data } = await httpsPost(
      `${stackUrl}/api/partner/auth/register`,
      JSON.stringify({ name, email, companyName, password })
    );

    if (status >= 400) {
      const d = data as Record<string, unknown>;
      return NextResponse.json({ error: d.error ?? "Registrierung fehlgeschlagen." }, { status });
    }

    const d = data as Record<string, unknown>;
    return NextResponse.json({ token: d.token, partner: d.partner });
  } catch {
    return NextResponse.json({ error: "Verbindung zum Partner-Server fehlgeschlagen." }, { status: 502 });
  }
}
