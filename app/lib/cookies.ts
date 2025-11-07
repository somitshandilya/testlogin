import { NextRequest, NextResponse } from "next/server";

const isProd = process.env.NODE_ENV === "production";

const common = {
  httpOnly: true as const,
  sameSite: "lax" as const,
  secure: isProd && process.env.NEXT_PUBLIC_USE_HTTP !== "true",
  path: "/",
};

export const COOKIE_KEYS = {
  accessToken: "accessToken",
  accessTokenExpires: "accessTokenExpires",
  refreshToken: "refreshToken",
} as const;

export function setTokensOnResponse(res: NextResponse, accessToken: string, expiresInSec: number, refreshToken?: string) {
  const expiresAt = Date.now() + expiresInSec * 1000 - 5000; // small skew
  res.cookies.set(COOKIE_KEYS.accessToken, accessToken, { ...common, expires: new Date(expiresAt) });
  // Expose expiry to client scripts (non-httpOnly) for UI decisions; okay because it's not sensitive
  res.cookies.set(COOKIE_KEYS.accessTokenExpires, String(expiresAt), { ...common, httpOnly: false });
  if (refreshToken) {
    res.cookies.set(COOKIE_KEYS.refreshToken, refreshToken, { ...common });
  }
}

export function clearTokensOnResponse(res: NextResponse) {
  Object.values(COOKIE_KEYS).forEach((k) => res.cookies.delete(k));
}

export function readTokensFromRequest(req: NextRequest) {
  const accessToken = req.cookies.get(COOKIE_KEYS.accessToken)?.value || null;
  const accessTokenExpires = parseInt(req.cookies.get(COOKIE_KEYS.accessTokenExpires)?.value || "0", 10) || 0;
  const refreshToken = req.cookies.get(COOKIE_KEYS.refreshToken)?.value || null;
  return { accessToken, accessTokenExpires, refreshToken };
}
