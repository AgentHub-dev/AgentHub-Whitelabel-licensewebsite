import { NextRequest, NextResponse } from "next/server";
import { partnerProxy, isValidUUID } from "@/lib/partnerProxy";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }
  return partnerProxy(req, `/partner/customers/${id}`, "GET");
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }
  return partnerProxy(req, `/partner/customers/${id}`, "PUT");
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }
  return partnerProxy(req, `/partner/customers/${id}`, "DELETE");
}
