import { NextRequest } from "next/server";
import { partnerProxy } from "@/lib/partnerProxy";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return partnerProxy(req, `/partner/customers/${id}/resend-onboarding`, "POST");
}
