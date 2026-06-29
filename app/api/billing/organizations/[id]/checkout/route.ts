import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin, getAdminToken } from "@/lib/verifyAdmin";

const LS = () => process.env.LICENSE_SERVER_URL || "http://localhost:3100";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!verifyAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const res = await fetch(`${LS()}/usage-admin/organizations/${params.id}/checkout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getAdminToken(req)}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => null);
  if (!res) return NextResponse.json({ error: "License server unreachable." }, { status: 502 });
  return NextResponse.json(await res.json(), { status: res.status });
}
