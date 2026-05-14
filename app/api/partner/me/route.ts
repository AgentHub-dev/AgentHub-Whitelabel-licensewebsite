import { NextRequest } from "next/server";
import { partnerProxy } from "@/lib/partnerProxy";

export async function GET(req: NextRequest) {
  return partnerProxy(req, "/partner/me", "GET");
}
