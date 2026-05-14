import { NextRequest } from "next/server";
import { partnerProxy } from "@/lib/partnerProxy";

export async function GET(req: NextRequest) {
  return partnerProxy(req, "/partner/pricing", "GET");
}

export async function PUT(req: NextRequest) {
  return partnerProxy(req, "/partner/pricing", "PUT");
}
