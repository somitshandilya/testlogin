"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type UserInfo = Record<string, any>;

export default function MePage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function loadUser() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/drupal/oauth/userinfo", { credentials: "same-origin" });
      console.log("userinfo response status:", res.status);
      if (!res.ok) {
        setUser(null);
        if (res.status === 401) {
          // Not logged in
          router.replace("/login");
        }
        const text = await res.text().catch(() => "");
        console.log("error response text:", text);
        if (text) setError(text);
        return;
      }
      const data = await res.json();
      console.log("userinfo response data:", data);
      setUser(data || null);
    } catch (e: any) {
      console.error("loadUser error:", e);
      setError(e?.message || "Failed to load user");
    } finally {
      setLoading(false);
    }
  }

  async function onLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Welcome</h1>
            <div className="flex gap-3">
              <button
                onClick={() => router.push("/articles")}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
              >
                Articles
              </button>
              <button
                onClick={loadUser}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition disabled:cursor-not-allowed"
              >
                Refresh
              </button>
              <button
                onClick={onLogout}
                disabled={loading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition disabled:cursor-not-allowed"
              >
                Logout
              </button>
            </div>
          </div>

          {loading && (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading user information...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {user && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Name</p>
                  <p className="text-lg font-semibold text-gray-900">{user.name || "N/A"}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Username</p>
                  <p className="text-lg font-semibold text-gray-900">{user.preferred_username || "N/A"}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                  <p className="text-lg font-semibold text-gray-900">{user.email || "N/A"}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">User ID</p>
                  <p className="text-lg font-semibold text-gray-900">{user.sub || "N/A"}</p>
                </div>
              </div>

              {user.locale && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Locale</p>
                  <p className="text-gray-900">{user.locale}</p>
                </div>
              )}

              {user.zoneinfo && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Timezone</p>
                  <p className="text-gray-900">{user.zoneinfo}</p>
                </div>
              )}

              {user.email_verified !== undefined && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Email Verified</p>
                  <p className="text-gray-900">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${user.email_verified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                      {user.email_verified ? "✓ Yes" : "✗ No"}
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}

          {!loading && !user && !error && (
            <div className="text-center py-8">
              <p className="text-gray-600">No user information available.</p>
            </div>
          )}
        </div>

        {/* Raw JSON (optional) */}
        {user && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Raw Data</h2>
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto text-xs">
{JSON.stringify(user, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
