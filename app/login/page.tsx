"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type UserInfo = {
  sub?: string;
  name?: string;
  preferred_username?: string;
  email?: string;
  email_verified?: boolean;
  profile?: string;
  locale?: string;
  [key: string]: any;
};

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const router = useRouter();

  async function fetchUserInfo() {
    try {
      const res = await fetch("/api/drupal/oauth/userinfo");
      if (!res.ok) {
        setUser(null);
        return;
      }
      const data = await res.json().catch(() => null);
      setUser(data || null);
    } catch {
      setUser(null);
    }
  }

  useEffect(() => {
    // Try to get user on first load in case already logged in
    fetchUserInfo();
  }, []);

  // Redirect when user is available
  useEffect(() => {
    if (user) {
      router.replace("/me");
    }
  }, [user, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(async () => ({ error: await res.text().catch(() => "") }));
      if (!res.ok || (data && data.error)) {
        setError((data && data.error) || "Login failed");
        setUser(null);
      } else {
        // API returns { ok: true, user: {...} }
        setUser(data?.user || null);
        router.replace("/me");
      }
    } catch (e: any) {
      setError(e?.message || "Login failed");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function onLogout() {
    setLoading(true);
    setError(null);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-full mb-4">
              <span className="text-xl text-white">→</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome</h1>
            <p className="text-gray-600 mt-2">Sign in to your account</p>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-gray-600 mt-6">
            Demo credentials: admin / admin
          </p>
        </div>
      </div>
    </div>
  );
}
