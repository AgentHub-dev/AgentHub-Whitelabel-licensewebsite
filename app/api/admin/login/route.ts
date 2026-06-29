import { NextRequest, NextResponse } from "next/server";

const LS = () => process.env.LICENSE_SERVER_URL || "http://localhost:3100";

// Simple in-memory rate limiter — resets on cold start (acceptable for Vercel edge)
// For production-grade limiting use Upstash Redis KV with @upstash/ratelimit.
const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000; // 15 min
const MAX_ATTEMPTS = 10;

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  entry.count += 1;
  return entry.count <= MAX_ATTEMPTS;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Zu viele Login-Versuche. Bitte 15 Minuten warten." },
      { status: 429 }
    );
  }

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
