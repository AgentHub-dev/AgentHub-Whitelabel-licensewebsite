import { NextRequest } from "next/server";
import { partnerProxy } from "@/lib/partnerProxy";

export async function POST(req: NextRequest) {
  return partnerProxy(req, "/partner/organization/checkout", "POST");
}
