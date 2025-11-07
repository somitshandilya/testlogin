"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Article = {
  title: string;
  body: string;
  field_image?: string;
  uid: string;
  created: string;
};

type UserInfo = {
  sub: string;
  name: string;
  [key: string]: any;
};

export default function ArticlesPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function loadUserAndArticles() {
    setLoading(true);
    setError(null);
    try {
      // Fetch user info
      const userRes = await fetch("/api/drupal/oauth/userinfo", { credentials: "same-origin" });
      if (!userRes.ok) {
        if (userRes.status === 401) {
          router.replace("/login");
        }
        throw new Error("Failed to load user info");
      }
      const userInfo = await userRes.json();
      setUser(userInfo);

      // Fetch articles by user ID (sub)
      const articlesRes = await fetch(`/api/drupal/article-nodes-api.json/${userInfo.sub}`, {
        credentials: "same-origin",
      });
      if (!articlesRes.ok) {
        throw new Error("Failed to load articles");
      }
      const articlesData = await articlesRes.json();
      setArticles(Array.isArray(articlesData) ? articlesData : []);
    } catch (e: any) {
      console.error("Error loading data:", e);
      setError(e?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function onLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  useEffect(() => {
    loadUserAndArticles();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Articles</h1>
              {user && <p className="text-gray-600 mt-2">by {user.name}</p>}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push("/me")}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                Profile
              </button>
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-gray-600">Loading articles...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Articles Grid */}
        {!loading && articles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition">
                {/* Article Image */}
                {article.field_image && (
                  <div className="w-full h-48 bg-gray-200 overflow-hidden">
                    <img
                      src={`http://app-testdrupal.v2gpulkqzd-ewx3lym286zq.p.temp-site.link${article.field_image}`}
                      alt={article.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23ddd' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' font-size='18' fill='%23999' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  </div>
                )}

                {/* Article Content */}
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{article.title}</h2>
                  <div
                    className="text-gray-700 text-sm mb-4 line-clamp-3"
                    dangerouslySetInnerHTML={{ __html: article.body }}
                  />
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>by {article.uid}</span>
                    <span>{new Date(parseInt(article.created) * 1000).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Articles State */}
        {!loading && articles.length === 0 && !error && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-gray-600">No articles found for this user.</p>
          </div>
        )}
      </div>
    </div>
  );
}
