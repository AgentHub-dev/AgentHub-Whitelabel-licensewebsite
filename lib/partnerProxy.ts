import { NextRequest, NextResponse } from "next/server";

const BACKEND =
  process.env.PARTNER_STACK_URL ?? "https://license.agent-hub.app";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOKEN_RE = /^[a-zA-Z0-9_-]{1,128}$/;

export function isValidUUID(v: string): boolean {
  return UUID_RE.test(v);
}

export function isValidToken(v: string): boolean {
  return TOKEN_RE.test(v);
}

export async function partnerProxy(
  req: NextRequest,
  backendPath: string,
  method: string
): Promise<NextResponse> {
  const headers: Record<string, string> = {};
  const auth = req.headers.get("Authorization");
  if (auth) headers["Authorization"] = auth;

  let body: string | undefined;
  if (method !== "GET") {
    const ct = req.headers.get("content-type");
    if (ct?.includes("application/json")) {
      headers["Content-Type"] = "application/json";
      body = await req.text();
    }
  }

  try {
    const res = await fetch(`${BACKEND}${backendPath}`, { method, headers, body });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Backend unreachable." }, { status: 502 });
  }
}
