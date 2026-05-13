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
    const res = await fetch(`${licenseServerUrl}/admin/partners`, {
      headers: { Authorization: `Bearer ${adminSecret}` },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "License server unreachable." }, { status: 502 });
  }
}
