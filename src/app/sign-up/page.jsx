"use client";
import React, { useState, useEffect, useCallback} from "react";

function MainComponent() {
  const [userId, setUserId] = useState("");
  const [suggestedId, setSuggestedId] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // Add useEffect for pageview tracking
  React.useEffect(() => {
    // Record pageview
    fetch("/api/record-pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        page_path: "/sign-up",
        user_id: null, // No user ID since they're not logged in yet
        user_agent: navigator.userAgent,
        referrer: document.referrer,
      }),
    }).catch(console.error);
  }, []); // Run once on mount

  useEffect(() => {
    const generateUserId = async () => {
      try {
        const response = await fetch("/api/auth-handler", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "getNextUserId" }),
        });

        if (!response.ok) {
          throw new Error("Failed to generate user ID");
        }

        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
        setSuggestedId(data.userId);
        setUserId(data.userId);
        setIsAvailable(true);
        setLoading(false);
      } catch (error) {
        console.error(error);
        setError("Failed to generate user ID");
        setLoading(false);
      }
    };

    generateUserId();
  }, []);

  const checkAvailability = async (id) => {
    if (!id) {
      setIsAvailable(false);
      return;
    }

    const idNum = parseInt(id);
    if (isNaN(idNum) || idNum <= 0) {
      setIsAvailable(false);
      return;
    }

    setCheckingAvailability(true);
    try {
      const response = await fetch("/api/auth-handler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checkUserId", userId: id }),
      });

      if (!response.ok) {
        throw new Error("Failed to check user ID");
      }

      const data = await response.json();
      if (data.error) {
        console.error("Error checking availability:", data.error);
        setIsAvailable(false);
        return;
      }

      setIsAvailable(data.available);
    } catch (error) {
      console.error(error);
      setError("Failed to check user ID availability");
    } finally {
      setCheckingAvailability(false);
    }
  };

  // Debounce the check availability function
  const debouncedCheck = useCallback(
    (() => {
      let timeoutId;
      return (value) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => checkAvailability(value), 500);
      };
    })(),
    []
  );

  const handleUserIdChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setUserId(value);
    debouncedCheck(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!userId || !isAvailable) {
      setError("Please enter a valid User ID");
      return;
    }

    if (pin.length !== 4) {
      setError("PIN must be 4 digits");
      return;
    }

    if (pin !== confirmPin) {
      setError("PINs do not match");
      return;
    }

    try {
      const response = await fetch("/api/auth-handler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createUser",
          userId: userId,
          pin,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create user");
      }

      const data = await response.json();
      if (data.error) {
        setError(data.error);
        return;
      }

      // Store credentials
      localStorage.setItem("userId", userId);
      localStorage.setItem("pin", pin);

      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (error) {
      console.error(error);
      setError("Failed to create account");
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
          Create Account
        </h1>

        {success ? (
          <div className="text-center space-y-4">
            <div className="text-[#10B981] font-medium">
              Account created! Redirecting...
            </div>
            <div className="text-[#4a5568] text-sm">
              Important: Your User ID is{" "}
              <span className="font-bold">{userId}</span>. Please save this
              number as you'll need it to log in!
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <div className="relative">
                <input
                  type="text"
                  value={userId}
                  onChange={handleUserIdChange}
                  className="w-full px-4 py-3 rounded-xl bg-white/30 border border-purple-300 text-[#2d3748] focus:outline-none focus:ring-2 focus:ring-[#a78bfa] text-center text-lg"
                  placeholder={loading ? "Generating ID..." : "Enter User ID"}
                  maxLength={6}
                />
                {!loading && userId && (
                  <div
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-sm ${
                      isAvailable ? "text-[#10B981]" : "text-[#EF4444]"
                    }`}
                  >
                    {checkingAvailability
                      ? "Checking..."
                      : isAvailable
                      ? "Available ✓"
                      : "Not Available ✗"}
                  </div>
                )}
              </div>
              <div className="mt-2 text-[#4a5568] text-sm text-center">
                {suggestedId && (
                  <>
                    Suggested ID:{" "}
                    <span className="font-medium">{suggestedId}</span> or choose
                    your own.
                    <br />
                  </>
                )}
                Remember your ID - you'll need it to log in!
              </div>
            </div>

            <div>
              <input
                type="password"
                name="pin"
                placeholder="Enter 4-digit PIN"
                value={pin}
                onChange={(e) =>
                  setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                className="w-full px-4 py-3 rounded-xl bg-white/30 border border-purple-300 text-[#2d3748] placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-[#a78bfa] text-center text-lg"
                maxLength={4}
              />
            </div>

            <div>
              <input
                type="password"
                name="confirmPin"
                placeholder="Confirm PIN"
                value={confirmPin}
                onChange={(e) =>
                  setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                className="w-full px-4 py-3 rounded-xl bg-white/30 border border-purple-300 text-[#2d3748] placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-[#a78bfa] text-center text-lg"
                maxLength={4}
              />
            </div>

            {error && (
              <div className="text-[#EF4444] text-center text-sm">{error}</div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#a78bfa] to-[#7c3aed] text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
            >
              Create Account
            </button>

            <div className="text-center text-sm text-[#4a5568]">
              Already have an account?{" "}
              <a href="/login" className="text-[#7c3aed] hover:underline">
                Log In
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default MainComponent;