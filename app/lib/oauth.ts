const TOKEN_URL = process.env.DRUPAL_TOKEN_URL as string;
const REVOKE_URL = process.env.DRUPAL_REVOKE_URL as string;
const CLIENT_ID = process.env.DRUPAL_CLIENT_ID as string;
const CLIENT_SECRET = process.env.DRUPAL_CLIENT_SECRET as string;
const SCOPE = process.env.DRUPAL_SCOPE as string | undefined;

if (!TOKEN_URL || !CLIENT_ID) {
  // Avoid throwing at import time in Next.js; handlers will validate and respond with 500.
}

export type TokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  id_token?: string;
};

export async function passwordGrant(username: string, password: string): Promise<TokenResponse> {
  const params = new URLSearchParams();
  params.set("grant_type", "password");
  params.set("username", username);
  params.set("password", password);
  params.set("client_id", CLIENT_ID);
  if (CLIENT_SECRET) params.set("client_secret", CLIENT_SECRET);
  if (SCOPE) params.set("scope", SCOPE);

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Password grant failed: ${res.status} ${text}`);
  }

  return (await res.json()) as TokenResponse;
}

export async function refreshGrant(refreshToken: string): Promise<TokenResponse> {
  const params = new URLSearchParams();
  params.set("grant_type", "refresh_token");
  params.set("refresh_token", refreshToken);
  params.set("client_id", CLIENT_ID);
  if (CLIENT_SECRET) params.set("client_secret", CLIENT_SECRET);

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Refresh grant failed: ${res.status} ${text}`);
  }

  return (await res.json()) as TokenResponse;
}

export async function revokeToken(token: string, hint: "access_token" | "refresh_token" = "refresh_token"): Promise<void> {
  if (!REVOKE_URL) return;
  const params = new URLSearchParams();
  params.set("token", token);
  params.set("token_type_hint", hint);
  params.set("client_id", CLIENT_ID);
  if (CLIENT_SECRET) params.set("client_secret", CLIENT_SECRET);

  await fetch(REVOKE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  }).catch(() => {});
}
