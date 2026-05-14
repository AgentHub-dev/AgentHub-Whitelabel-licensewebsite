import { NextRequest, NextResponse } from "next/server";
import { partnerProxy, isValidToken } from "@/lib/partnerProxy";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!isValidToken(token)) {
    return NextResponse.json({ error: "Invalid token." }, { status: 400 });
  }
  return partnerProxy(req, `/provisioning/hetzner-onboarding/${token}`, "GET");
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!isValidToken(token)) {
    return NextResponse.json({ error: "Invalid token." }, { status: 400 });
  }
  return partnerProxy(req, `/provisioning/hetzner-onboarding/${token}`, "POST");
}
