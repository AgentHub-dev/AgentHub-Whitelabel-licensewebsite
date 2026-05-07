import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

function verifyAdmin(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return false;
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) return false;
  try {
    const p = jwt.verify(auth.slice(7), jwtSecret) as { role?: string };
    return p.role === "admin";
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const licenseServerUrl = process.env.LICENSE_SERVER_URL || "http://localhost:3100";
  const adminSecret = process.env.ADMIN_SECRET;

  try {
    const res = await fetch(`${licenseServerUrl}/admin/licenses`, {
      headers: { Authorization: `Bearer ${adminSecret}` },
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "License server unreachable." }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const licenseServerUrl = process.env.LICENSE_SERVER_URL || "http://localhost:3100";
  const adminSecret = process.env.ADMIN_SECRET;
  const body = await req.json();

  try {
    const res = await fetch(`${licenseServerUrl}/admin/licenses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminSecret}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (!res.ok) return NextResponse.json(data, { status: res.status });

    // Fetch the full license details
    const licenseRes = await fetch(
      `${licenseServerUrl}/admin/licenses/${data.key}`,
      { headers: { Authorization: `Bearer ${adminSecret}` } }
    );
    const licenseData = await licenseRes.json();
    return NextResponse.json({ license: licenseData.license }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "License server unreachable." }, { status: 502 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  if (!key) return NextResponse.json({ error: "Key required" }, { status: 400 });

  const licenseServerUrl = process.env.LICENSE_SERVER_URL || "http://localhost:3100";
  const adminSecret = process.env.ADMIN_SECRET;
  const body = await req.json();

  try {
    const res = await fetch(`${licenseServerUrl}/admin/licenses/${key}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminSecret}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "License server unreachable." }, { status: 502 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  if (!key) return NextResponse.json({ error: "Key required" }, { status: 400 });

  const licenseServerUrl = process.env.LICENSE_SERVER_URL || "http://localhost:3100";
  const adminSecret = process.env.ADMIN_SECRET;

  try {
    const res = await fetch(`${licenseServerUrl}/admin/licenses/${key}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminSecret}` },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "License server unreachable." }, { status: 502 });
  }
}
