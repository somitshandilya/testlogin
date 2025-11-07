import { NextRequest, NextResponse } from "next/server";
import { passwordGrant } from "@/app/lib/oauth";
import { setTokensOnResponse } from "@/app/lib/cookies";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: "username and password required" }, { status: 400 });
    }

    const token = await passwordGrant(username, password);
    // Try to fetch current user info immediately using the fresh access token
    let userinfo: any = null;
    try {
      const apiBase = process.env.DRUPAL_API_BASE as string;
      const userinfoUrl = `${apiBase.replace(/\/$/, "")}/oauth/userinfo`;
      const ures = await fetch(userinfoUrl, {
        headers: { Authorization: `Bearer ${token.access_token}` },
      });
      if (ures.ok) {
        userinfo = await ures.json().catch(() => null);
      }
    } catch (_) {}

    const res = NextResponse.json({ ok: true, user: userinfo });
    setTokensOnResponse(res, token.access_token, token.expires_in, token.refresh_token);
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Login failed" }, { status: 400 });
  }
}
