import { NextRequest } from "next/server";
import { partnerProxy } from "@/lib/partnerProxy";

export async function DELETE(req: NextRequest) {
  return partnerProxy(req, "/partner/hetzner/disconnect", "DELETE");
}
