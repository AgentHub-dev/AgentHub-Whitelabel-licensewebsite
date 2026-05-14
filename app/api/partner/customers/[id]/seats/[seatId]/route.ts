import { NextRequest } from "next/server";
import { partnerProxy } from "@/lib/partnerProxy";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; seatId: string }> }
) {
  const { id, seatId } = await params;
  return partnerProxy(req, `/partner/customers/${id}/seats/${seatId}`, "PUT");
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; seatId: string }> }
) {
  const { id, seatId } = await params;
  return partnerProxy(req, `/partner/customers/${id}/seats/${seatId}`, "DELETE");
}
