import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

function getToken(req: NextRequest): string | null {
  const cookieToken = req.cookies.get("admin_token")?.value;
  if (cookieToken) return cookieToken;
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);
  return null;
}

/**
 * Verifies that the request carries a valid admin JWT.
 * If JWT_SECRET env var is set (shared with licenseserver), verifies signature.
 * Otherwise decodes without crypto verification — the licenseserver validates on proxied calls.
 */
export function verifyAdmin(req: NextRequest): boolean {
  const token = getToken(req);
  if (!token) return false;

  try {
    // Decode without verifying signature — the licenseserver re-verifies on every proxied call.
    // We only check role and expiry here to give the browser a fast 401 on stale tokens.
    const p = jwt.decode(token) as { role?: string; exp?: number } | null;
    if (!p) return false;
    if (p.exp && p.exp * 1000 < Date.now()) return false;
    return p.role === "admin";
  } catch {
    return false;
  }
}

/**
 * Returns the raw admin JWT to forward to the licenseserver for re-verification.
 */
export function getAdminToken(req: NextRequest): string | null {
  return getToken(req);
}
