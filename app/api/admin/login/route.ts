import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  const { secret } = await req.json();
  if (!secret) {
    return NextResponse.json({ error: "Schlüssel erforderlich." }, { status: 400 });
  }

  const adminSecret = process.env.ADMIN_SECRET;
  const jwtSecret = process.env.JWT_SECRET;

  if (!adminSecret || !jwtSecret) {
    return NextResponse.json({ error: "Server nicht konfiguriert." }, { status: 503 });
  }

  if (secret !== adminSecret) {
    return NextResponse.json({ error: "Ungültiger Admin-Schlüssel." }, { status: 403 });
  }

  const token = jwt.sign({ role: "admin" }, jwtSecret, { expiresIn: "24h" });
  return NextResponse.json({ token });
}
