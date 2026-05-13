import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

export function verifyAdmin(req: NextRequest): boolean {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) return false;

  // Cookie takes priority (HttpOnly — XSS-safe)
  const cookieToken = req.cookies.get("admin_token")?.value;
  // Fallback: Authorization header (server-to-server or legacy clients)
  const authHeader = req.headers.get("authorization");
  const headerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;

  const token = cookieToken ?? headerToken;
  if (!token) return false;

  try {
    const p = jwt.verify(token, jwtSecret) as { role?: string };
    return p.role === "admin";
  } catch {
    return false;
  }
}

/**
 * Returns the raw admin JWT from the cookie or Authorization header.
 * Used to forward the token to the backend so the backend can verify
 * the JTI blacklist (revoked tokens after logout).
 */
export function getAdminToken(req: NextRequest): string | null {
  const cookieToken = req.cookies.get("admin_token")?.value;
  if (cookieToken) return cookieToken;
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);
  return null;
}
