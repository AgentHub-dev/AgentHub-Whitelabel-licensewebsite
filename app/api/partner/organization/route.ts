import { NextRequest } from "next/server";
import { partnerProxy } from "@/lib/partnerProxy";

export async function GET(req: NextRequest) {
  return partnerProxy(req, "/partner/organization", "GET");
}

export async function PATCH(req: NextRequest) {
  return partnerProxy(req, "/partner/organization", "PATCH");
}
