import { NextRequest, NextResponse } from "next/server";
import { partnerProxy, isValidUUID } from "@/lib/partnerProxy";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }
  return partnerProxy(req, `/partner/customers/${id}/seat-price`, "PUT");
}
