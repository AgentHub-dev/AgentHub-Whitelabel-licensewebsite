import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin, getAdminToken } from "@/lib/verifyAdmin";

export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const licenseServerUrl = process.env.LICENSE_SERVER_URL || "http://localhost:3100";
  const token = getAdminToken(req);

  try {
    const res = await fetch(`${licenseServerUrl}/admin/licenses`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) return NextResponse.json({ error: "Token revoked" }, { status: 401 });
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
  const token = getAdminToken(req);
  const body = await req.json();

  try {
    const res = await fetch(`${licenseServerUrl}/admin/licenses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (!res.ok) return NextResponse.json(data, { status: res.status });

    const licenseRes = await fetch(
      `${licenseServerUrl}/admin/licenses/${data.key}`,
      { headers: { Authorization: `Bearer ${token}` } }
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
  if (!/^WL-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(key)) {
    return NextResponse.json({ error: "Invalid key format" }, { status: 400 });
  }

  const licenseServerUrl = process.env.LICENSE_SERVER_URL || "http://localhost:3100";
  const token = getAdminToken(req);
  const body = await req.json();

  try {
    const res = await fetch(`${licenseServerUrl}/admin/licenses/${key}/status`, {
      method: "PUT",
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

export async function DELETE(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  if (!key) return NextResponse.json({ error: "Key required" }, { status: 400 });
  if (!/^WL-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(key)) {
    return NextResponse.json({ error: "Invalid key format" }, { status: 400 });
  }

  const licenseServerUrl = process.env.LICENSE_SERVER_URL || "http://localhost:3100";
  const token = getAdminToken(req);

  try {
    const res = await fetch(`${licenseServerUrl}/admin/licenses/${key}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "License server unreachable." }, { status: 502 });
  }
}
