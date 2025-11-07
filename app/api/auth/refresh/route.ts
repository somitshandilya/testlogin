import { NextRequest, NextResponse } from "next/server";
import { refreshGrant } from "@/app/lib/oauth";
import { readTokensFromRequest, setTokensOnResponse } from "@/app/lib/cookies";

export async function POST(_req: NextRequest) {
  try {
    const { refreshToken } = readTokensFromRequest(_req);
    if (!refreshToken) {
      return NextResponse.json({ error: "No refresh token" }, { status: 401 });
    }
    const token = await refreshGrant(refreshToken);
    const res = NextResponse.json({ ok: true });
    setTokensOnResponse(res, token.access_token, token.expires_in, token.refresh_token ?? refreshToken);
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Refresh failed" }, { status: 401 });
  }
}
