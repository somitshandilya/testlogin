import { NextRequest, NextResponse } from "next/server";
import { readTokensFromRequest, setTokensOnResponse } from "@/app/lib/cookies";
import { refreshGrant } from "@/app/lib/oauth";

const API_BASE = process.env.DRUPAL_API_BASE as string;

async function proxyOnce(req: NextRequest, url: string, accessToken?: string) {
  const headers = new Headers(req.headers);
  headers.delete("host");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const init: RequestInit = {
    method: req.method,
    headers,
    body: ["GET", "HEAD"].includes(req.method) ? undefined : await req.text(),
    redirect: "manual",
  };

  return fetch(url, init);
}

export async function GET(req: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await context.params;
  return handle(req, path);
}
export async function POST(req: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await context.params;
  return handle(req, path);
}
export async function PUT(req: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await context.params;
  return handle(req, path);
}
export async function PATCH(req: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await context.params;
  return handle(req, path);
}
export async function DELETE(req: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await context.params;
  return handle(req, path);
}

async function handle(req: NextRequest, pathSegments: string[]) {
  if (!API_BASE) return NextResponse.json({ error: "DRUPAL_API_BASE not set" }, { status: 500 });
  const suffix = pathSegments && pathSegments.length ? `/${pathSegments.join("/")}` : "";
  const targetUrl = `${API_BASE}${suffix}${req.nextUrl.search}`;

  let { accessToken, accessTokenExpires, refreshToken } = readTokensFromRequest(req);
  let needRefresh = !accessToken || Date.now() > accessTokenExpires - 5000;

  // Preemptively refresh if we don't have an access token but we do have a refresh token
  let refreshed: { access: string; expiresIn: number; refresh?: string } | null = null;
  if (!accessToken && refreshToken) {
    try {
      const t = await refreshGrant(refreshToken);
      accessToken = t.access_token;
      refreshed = { access: t.access_token, expiresIn: t.expires_in, refresh: t.refresh_token ?? refreshToken };
      needRefresh = false;
    } catch (_) {
      // continue without token
    }
  }

  // First attempt with current token (possibly refreshed above)
  let res = await proxyOnce(req, targetUrl, accessToken || undefined);

  // If unauthorized and we have a refresh token, try to refresh then retry
  if ((res.status === 401 || res.status === 403 || needRefresh) && refreshToken) {
    try {
      const t = await refreshGrant(refreshToken);
      accessToken = t.access_token;
      refreshed = { access: t.access_token, expiresIn: t.expires_in, refresh: t.refresh_token ?? refreshToken };
      res = await proxyOnce(req, targetUrl, accessToken);
    } catch (_) {
      // fall through, return original response or error
    }
  }

  const proxyHeaders = new Headers(res.headers);
  proxyHeaders.delete("transfer-encoding");
  proxyHeaders.delete("content-encoding");

  // Buffer the entire response body
  const buffer = await res.arrayBuffer();
  const text = new TextDecoder().decode(buffer);
  console.log(`[proxy] response status: ${res.status}, body length: ${buffer.byteLength}, full text: ${text}`);
  
  // Log detailed error info for debugging
  if (res.status >= 400) {
    console.log(`[proxy] ERROR - URL: ${targetUrl}, Method: ${req.method}, Status: ${res.status}`);
    console.log(`[proxy] Response body:`, text);
  }
  
  // Set correct Content-Length for the buffered response
  proxyHeaders.set("Content-Length", buffer.byteLength.toString());
  
  const out = new NextResponse(buffer, { status: res.status, headers: proxyHeaders });
  if (refreshed) {
    setTokensOnResponse(out, refreshed.access, refreshed.expiresIn, refreshed.refresh);
  }
  return out;
}
