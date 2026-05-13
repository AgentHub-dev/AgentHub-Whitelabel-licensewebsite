import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin, getAdminToken } from "@/lib/verifyAdmin";

export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const licenseServerUrl = process.env.LICENSE_SERVER_URL || "http://localhost:3100";
  const token = getAdminToken(req);

  try {
    const res = await fetch(`${licenseServerUrl}/admin/customers`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "License server unreachable." }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const licenseServerUrl = process.env.LICENSE_SERVER_URL || "http://localhost:3100";
  const token = getAdminToken(req);
  const body = await req.json();

  try {
    const res = await fetch(`${licenseServerUrl}/admin/customers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "License server unreachable." }, { status: 502 });
  }
}
