import { NextRequest } from "next/server";
import { partnerProxy } from "@/lib/partnerProxy";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  return partnerProxy(req, `/provisioning/hetzner-onboarding/${token}`, "GET");
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  return partnerProxy(req, `/provisioning/hetzner-onboarding/${token}`, "POST");
}
