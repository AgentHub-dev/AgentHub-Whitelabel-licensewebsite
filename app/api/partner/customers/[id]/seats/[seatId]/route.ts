import { NextRequest, NextResponse } from "next/server";
import { partnerProxy, isValidUUID } from "@/lib/partnerProxy";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; seatId: string }> }
) {
  const { id, seatId } = await params;
  if (!isValidUUID(id) || !isValidUUID(seatId)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }
  return partnerProxy(req, `/partner/customers/${id}/seats/${seatId}`, "PUT");
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; seatId: string }> }
) {
  const { id, seatId } = await params;
  if (!isValidUUID(id) || !isValidUUID(seatId)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }
  return partnerProxy(req, `/partner/customers/${id}/seats/${seatId}`, "DELETE");
}
