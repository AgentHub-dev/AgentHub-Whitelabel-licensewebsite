import { NextRequest, NextResponse } from "next/server";

const BACKEND =
  process.env.PARTNER_STACK_URL ?? "https://license.agent-hub.app";

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
