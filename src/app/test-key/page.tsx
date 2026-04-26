"use client";

import { useState } from "react";

export default function TestKeyPage() {
  const [prompt, setPrompt] = useState("Hi Gemini, are you working?");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const testApiKey = async () => {
    setIsLoading(true);
    setResponse("");
    setError("");

    try {
      const res = await fetch("/api/test-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      if (data.success) {
        setResponse(data.apiResponse);
      } else {
        // Detailed error dikhana
        setError(`API Error: ${data.error} (Status: ${data.status})`);
      }
    } catch (err) {
      setError("Failed to connect to backend API route.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 md:p-24 font-sans">
      <div className="max-w-3xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="border-b border-gray-800 pb-6">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            Gemini API Key Tester
          </h1>
          <p className="text-gray-400 mt-2">
            Enter a prompt to verify if your API Key and Model configuration are working.
          </p>
        </div>

        {/* Input Section */}
        <div className="space-y-4">
          <label className="text-sm font-medium text-gray-300">Test Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            className="w-full p-4 bg-gray-900 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            placeholder="Enter test prompt here..."
          />
          <button
            onClick={testApiKey}
            disabled={isLoading}
            className={`w-full md:w-auto px-8 py-3 rounded-xl font-semibold transition duration-300 transform active:scale-95 flex items-center justify-center gap-2 
              ${isLoading 
                ? "bg-gray-700 cursor-not-allowed" 
                : "bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-500/20"
              }`}
          >
            {isLoading ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                Testing...
              </>
            ) : (
              "Test API Key 🚀"
            )}
          </button>
        </div>

        {/* Output Section */}
        <div className="space-y-6">
          {error && (
            <div className="p-4 bg-red-950/50 border border-red-700 text-red-300 rounded-xl font-mono text-sm animate-pulse">
              <strong>Error:</strong> {error}
            </div>
          )}

          {response && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-green-400 flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                Gemini Response (Success)
              </label>
              <div className="p-5 bg-gray-900 border border-green-800 rounded-2xl text-gray-200 leading-relaxed whitespace-pre-wrap shadow-inner">
                {response}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}