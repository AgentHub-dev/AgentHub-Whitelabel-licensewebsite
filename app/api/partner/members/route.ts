import { NextRequest } from "next/server";
import { partnerProxy } from "@/lib/partnerProxy";

export async function GET(req: NextRequest) {
  return partnerProxy(req, "/partner/members", "GET");
}

export async function POST(req: NextRequest) {
  return partnerProxy(req, "/partner/members", "POST");
}
