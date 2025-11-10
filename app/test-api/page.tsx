"use client";

import { useState } from "react";

export default function TestAPIPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function testGetRequest() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/drupal/jsonapi/node/role_1", {
        method: "GET",
        headers: { "Accept": "application/vnd.api+json" },
        credentials: "same-origin"
      });

      const data = await res.json();
      console.log("GET Response:", data);
      setResult(data);
    } catch (e: any) {
      console.error("Error:", e);
      setError(e?.message || "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">JSON:API Test Page</h1>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-xl font-bold mb-4">Test GET Request</h2>
          <p className="text-gray-600 mb-4">
            This will test if you can READ nodes from the JSON:API
          </p>

          <button
            onClick={testGetRequest}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition disabled:cursor-not-allowed"
          >
            {loading ? "Loading..." : "Test GET /jsonapi/node/role_1"}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h3 className="font-bold text-red-800 mb-2">Error:</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h3 className="text-lg font-bold mb-4">Response:</h3>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-96">
              <pre className="text-xs">{JSON.stringify(result, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
