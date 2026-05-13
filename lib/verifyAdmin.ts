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
