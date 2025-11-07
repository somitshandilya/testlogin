import { NextRequest, NextResponse } from "next/server";
import { readTokensFromRequest, clearTokensOnResponse } from "@/app/lib/cookies";
import { revokeToken } from "@/app/lib/oauth";

export async function POST(req: NextRequest) {
  const { refreshToken, accessToken } = readTokensFromRequest(req);
  try {
    if (refreshToken) {
      await revokeToken(refreshToken, "refresh_token");
    }
    if (accessToken) {
      await revokeToken(accessToken, "access_token");
    }
  } catch (_) {}
  const res = NextResponse.json({ ok: true });
  clearTokensOnResponse(res);
  return res;
}
