import { NextRequest, NextResponse } from "next/server";
import { readTokensFromRequest } from "@/app/lib/cookies";

export async function GET(req: NextRequest) {
  const { accessToken } = readTokensFromRequest(req);

  if (!accessToken) {
    return NextResponse.json({ error: "No access token" }, { status: 401 });
  }

  try {
    // Call Drupal's userinfo endpoint to see what user data we get
    const userRes = await fetch(
      `${process.env.DRUPAL_URL}/oauth/userinfo`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      }
    );

    const userData = await userRes.json();

    // Now call a Drupal endpoint that checks permissions
    const permRes = await fetch(
      `${process.env.DRUPAL_URL}/jsonapi/node/role_1`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.api+json",
        },
      }
    );

    const permData = await permRes.json();

    return NextResponse.json({
      user: userData,
      permissionCheck: {
        status: permRes.status,
        data: permData,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
