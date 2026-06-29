import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin, getAdminToken } from "@/lib/verifyAdmin";

const LS = () => process.env.LICENSE_SERVER_URL || "http://localhost:3100";

export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const res = await fetch(`${LS()}/usage-admin/billing`, {
    headers: { Authorization: `Bearer ${getAdminToken(req)}` },
  }).catch(() => null);
  if (!res) return NextResponse.json({ error: "License server unreachable." }, { status: 502 });
  return NextResponse.json(await res.json(), { status: res.status });
}
