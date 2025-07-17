"use client";
import React, { useState } from "react";


function MainComponent() {
  const [userId, setUserId] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Add useEffect for pageview tracking
  React.useEffect(() => {
    // Record pageview
    fetch("/api/record-pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        page_path: "/login",
        user_id: null, // No user ID since they're not logged in yet
        user_agent: navigator.userAgent,
        referrer: document.referrer,
      }),
    }).catch(console.error);
  }, []); // Run once on mount

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const authResponse = await fetch("/api/auth-handler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login",
          userId: parseInt(userId, 10),
          pin,
        }),
      });

      if (!authResponse.ok) {
        throw new Error("Failed to login");
      }

      const authData = await authResponse.json();

      if (authData.error) {
        setError(authData.error);
        setLoading(false);
        return;
      }

      if (!authData.success) {
        setError("Invalid credentials");
        setLoading(false);
        return;
      }

      localStorage.setItem("userId", userId);
      localStorage.setItem("pin", pin);
      localStorage.setItem("lastCredentialCheck", Date.now().toString());

      setLoading(false);
      window.location.href = "/";
    } catch (error) {
      console.error(error);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#c084fc] via-[#a78bfa] to-[#7c3aed] flex items-center justify-center px-4">
      <div
        className="
  bg-gradient-to-br from-purple-400/50 via-purple-200/40 to-purple-600/60
  backdrop-blur-xl rounded-2xl p-8 w-full max-w-md border border-white/30 shadow-lg
  relative
"
        style={{
          background:
            "linear-gradient(135deg, rgba(192,132,252,0.95), rgba(139,92,246,0.75), rgba(59,7,100,0.7))",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow: "0 8px 32px 0 rgba(124,58,237,0.18)",
        }}
      >
        <h1 className="text-4xl font-crimson-text text-[#2d3748] text-center mb-8">
          Welcome Back
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="text"
              name="userId"
              placeholder="Enter User ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value.replace(/\D/g, ""))}
              className="w-full px-4 py-3 rounded-xl bg-white/30 border border-purple-300 text-[#2d3748] placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-[#a78bfa] text-center text-lg"
              inputMode="numeric"
              autoComplete="username"
            />
          </div>

          <div>
            <input
              type="password"
              name="pin"
              placeholder="Enter PIN"
              value={pin}
              onChange={(e) =>
                setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              className="w-full px-4 py-3 rounded-xl bg-white/30 border border-purple-300 text-[#2d3748] placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-[#a78bfa] text-center text-lg"
              maxLength={4}
              inputMode="numeric"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="text-[#EF4444] text-center text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#60a5fa] to-[#3b82f6] text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in..." : "Log In"}
          </button>

          <div className="text-center text-sm text-[#4a5568]">
            Don't have an account?{" "}
            <a href="/sign-up" className="text-[#3b82f6] hover:underline">
              Sign Up
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MainComponent;