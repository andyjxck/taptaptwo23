"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Flame, ChevronDown, Coins, Crown, Timer, Zap, Settings } from "lucide-react";

function isImageUrl(icon) {
  return (
    typeof icon === "string" &&
    (icon.startsWith("http") ||
      icon.startsWith("/") ||
      icon.match(/\.(png|jpg|jpeg|gif|svg)$/i))
  );
}

function formatNumberShort(num) {
  if (num < 1000) return num?.toString() ?? "0";
  const units = [
    { value: 1e33, symbol: "Dc" },
    { value: 1e30, symbol: "Nn" },
    { value: 1e27, symbol: "Oc" },
    { value: 1e24, symbol: "Sp" },
    { value: 1e21, symbol: "Sx" },
    { value: 1e18, symbol: "Qi" },
    { value: 1e15, symbol: "Qa" },
    { value: 1e12, symbol: "T" },
    { value: 1e9, symbol: "B" },
    { value: 1e6, symbol: "M" },
    { value: 1e3, symbol: "K" },
  ];
  for (let i = 0; i < units.length; i++) {
    if (num >= units[i].value) {
      const formatted = (num / units[i].value)
        .toFixed(1)
        .replace(/\.0$/, "");
      return formatted + units[i].symbol;
    }
  }
  return num?.toString() ?? "0";
}

export default function BossModePage() {
  const router = useRouter();

  // --- AUTH ---
  const [userId, setUserId] = useState("");
  const [pin, setPin] = useState("");
  const [userReady, setUserReady] = useState(false);

  // --- MENU/UI STATE ---
  const [mode, setMode] = useState(""); // "", "solo", "coop-create", "coop-join", "coop"
  const [roomCode, setRoomCode] = useState("");
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [showDamageNumbers, setShowDamageNumbers] = useState([]);

  // --- PROFILE & UPGRADES STATE ---
  const [profileData, setProfileData] = useState(null);
  const [upgradesData, setUpgradesData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [upgradesLoading, setUpgradesLoading] = useState(false);

  // --- SOLO BOSS STATE ---
  const [soloProgress, setSoloProgress] = useState(null); // boss_hp, boss_max_hp, current_level, ...
  const [soloLoading, setSoloLoading] = useState(false);

  // --- COOP BOSS STATE ---
  const [currentSession, setCurrentSession] = useState(null);
  const [coopError, setCoopError] = useState("");
  const [coopJoining, setCoopJoining] = useState(false);
  const [coopCreating, setCoopCreating] = useState(false);

  // --- BUTTON LOCK & LOADING ---
  const [pageLoading, setPageLoading] = useState(true);

  // --- DAMAGE STATE ---
  const [accumulatedAutoTapDamage, setAccumulatedAutoTapDamage] = useState(0);

  
  // --- EFFECTS: AUTH INIT ---
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    const storedPin = localStorage.getItem("pin");
    if (!storedUserId || !storedPin) {
      window.location.href = "/login";
      return;
    }
    setUserId(storedUserId);
    setPin(storedPin);
    setUserReady(true);
  }, []);

  // --- EFFECTS: LOAD PROFILE & UPGRADES ON LOGIN ---
  useEffect(() => {
    if (!userReady) return;
    setProfileLoading(true);
    setUpgradesLoading(true);
    Promise.all([
      fetch(`/api/boss?action=profile&userId=${userId}`).then((r) => r.json()),
      fetch(`/api/boss?action=upgrades&userId=${userId}`).then((r) => r.json()),
    ])
      .then(([profile, upgrades]) => {
        setProfileData(profile);
        setUpgradesData(upgrades);
      })
      .finally(() => {
        setProfileLoading(false);
        setUpgradesLoading(false);
        setPageLoading(false);
      });
  }, [userReady, userId]);

  // --- EFFECTS: LOAD SOLO PROGRESS ON ENTERING SOLO ---
  useEffect(() => {
    if (!userReady || mode !== "solo") return;
    setSoloLoading(true);
    fetch(`/api/boss?action=progress&userId=${userId}`)
      .then((r) => r.json())
      .then((data) => {
        setSoloProgress(data);
        setTapCount(0);
        setAccumulatedAutoTapDamage(0);
      })
      .finally(() => setSoloLoading(false));
  }, [userReady, userId, mode]);
let battleData = mode === "solo" ? soloProgress : currentSession;

const hpMax = (battleData?.boss_max_hp || battleData?.boss_hp) || 1;  // fallback 1 to avoid NaN
const visibleBossHp = Math.max(0, (battleData?.boss_hp || 0) - accumulatedAutoTapDamage);
const hpPercentage = Math.max(0, Math.min(100, (visibleBossHp / hpMax) * 100));

  // Poll for boss progress refresh when boss is defeated (visibleBossHp === 0)
useEffect(() => {
  if (!userReady) return;
  if (visibleBossHp > 0) return; // Only poll if boss is dead (0 HP)

  const interval = setInterval(async () => {
    try {
      if (mode === "solo") {
        const res = await fetch(`/api/boss?action=progress&userId=${userId}`);
        const data = await res.json();
        if (data && data.boss_hp !== undefined) {
          setSoloProgress(data);
          setAccumulatedAutoTapDamage(0);
          setTapCount(0);
        }
      } else if (mode === "coop" && currentSession) {
        const res = await fetch(`/api/boss?action=coop_session&roomCode=${currentSession.room_code}&userId=${userId}`);
        const data = await res.json();
        if (data && data.session) {
          setCurrentSession(data.session);
          setAccumulatedAutoTapDamage(0);
          setTapCount(0);
        }
      }
    } catch (e) {
      console.error("Error refreshing boss progress:", e);
    }
  }, 1500); // Poll every 1.5 seconds

  return () => clearInterval(interval);
}, [visibleBossHp, userReady, userId, mode, currentSession]);


  // --- EFFECTS: COOP SESSION POLLING ---
  useEffect(() => {
    if (!userReady || mode !== "coop" || !currentSession) return;
    let cancelled = false;
    const interval = setInterval(() => {
      fetch(
        `/api/boss?action=coop_session&roomCode=${currentSession.room_code}&userId=${userId}`
      )
        .then((r) => r.json())
        .then((data) => {
          if (cancelled) return;
          if (data.session) setCurrentSession(data.session);
        });
    }, 1200);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [mode, currentSession, userReady, userId]);

  
  // --- EFFECTS: ACCUMULATE AUTO-TAPPER DAMAGE LOCALLY ---
  useEffect(() => {
    if (
      mode !== "solo" ||
      !soloProgress ||
      !upgradesData?.stats?.autoTapperDps ||
      upgradesData.stats.autoTapperDps <= 0 ||
      soloProgress.boss_hp <= 0
    )
      return;

    // Every second add auto tapper DPS damage to accumulated damage
    const interval = setInterval(() => {
      setAccumulatedAutoTapDamage(
        (prev) => prev + (upgradesData.stats.autoTapperDps || 0)
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [mode, soloProgress?.boss_hp, upgradesData?.stats?.autoTapperDps]);

  // --- FUNCTION: HANDLE MANUAL TAP ---
  async function handleTap() {
    if (
      soloLoading ||
      (mode === "solo" && (!soloProgress || soloProgress.boss_hp <= 0)) ||
      (mode === "coop" && (!currentSession || currentSession.boss_hp <= 0))
    )
      return;

    const tapPower = upgradesData?.stats?.tapPower || 1;

    // 5% crit chance = 3x damage
    const isCrit = Math.random() < 0.05;
    const critMultiplier = isCrit ? 3 : 1;

    // Total damage this tap = tap power * crit + accumulated auto tapper damage
    const totalDamage = tapPower * critMultiplier + accumulatedAutoTapDamage;

    // Show floating damage number (including crit and auto tap damage)
    const dmgId = Date.now() + Math.random();
    setShowDamageNumbers((prev) => [
      ...prev,
      {
        id: dmgId,
        damage: Math.floor(totalDamage),
        isCrit,
        x: Math.random() * 120 - 60,
        y: Math.random() * 60 - 30,
      },
    ]);
    setTimeout(() => {
      setShowDamageNumbers((prev) => prev.filter((d) => d.id !== dmgId));
    }, 1200);

    // Send total damage to backend (for solo or coop)
    const action = mode === "solo" ? "solo_tap" : "coop_tap";

    // Prepare request body
    const body = {
      action,
      userId,
      damage: Math.floor(totalDamage),
    };

    if (mode === "coop") {
      body.roomCode = currentSession.room_code;
    }

    try {
      const res = await fetch("/api/boss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      // Reset accumulated auto tap damage after sending
      setAccumulatedAutoTapDamage(0);

      if (data.boss_defeated) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 1600);

        // Reload progress and profile after boss defeated
        if (mode === "solo") {
          const newProgress = await fetch(
            `/api/boss?action=progress&userId=${userId}`
          ).then((r) => r.json());
          setSoloProgress(newProgress);
          setAccumulatedAutoTapDamage(0);
        } else {
          const newSession = await fetch(
            `/api/boss?action=coop_session&roomCode=${currentSession.room_code}&userId=${userId}`
          )
            .then((r) => r.json())
            .then((res) => res.session);
          if (newSession) setCurrentSession(newSession);
          setAccumulatedAutoTapDamage(0);
        }

        const newProfile = await fetch(
          `/api/boss?action=profile&userId=${userId}`
        ).then((r) => r.json());
        setProfileData(newProfile);

        setTapCount(0);
        return;
      }

      // Update local HP and tap count on normal tap
      if (mode === "solo") {
        setSoloProgress((prev) => ({
          ...prev,
          boss_hp: data.current_boss_hp,
        }));
       setAccumulatedAutoTapDamage(0);
      } else {
        setCurrentSession((prev) => ({
          ...prev,
          boss_hp: data.current_boss_hp,  
        }));
         setAccumulatedAutoTapDamage(0);
      }
      setTapCount((prev) => prev + 1);
    } catch (error) {
      console.error("Error sending tap damage:", error);
    }
  }

  // --- TAP BUTTON HANDLER (calls handleTap) ---
  function onTapButtonClick() {
    handleTap();
  }

  // --- COOP CREATE ---
  function handleCoopCreate() {
    setCoopCreating(true);
    setCoopError("");
    fetch("/api/boss", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "coop_create", userId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.session) throw new Error("No session returned");
        setCurrentSession(data.session);
        setMode("coop");
      })
      .catch(() => setCoopError("Failed to create session. Please try again."))
      .finally(() => setCoopCreating(false));
  }

  // --- COOP JOIN ---
  function handleCoopJoin() {
    setCoopJoining(true);
    setCoopError("");
    fetch("/api/boss", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "coop_join", roomCode: roomCode.trim(), userId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.session) {
          setCurrentSession(data.session);
          setMode("coop");
        } else setCoopError("Failed to join alliance. Check code.");
      })
      .catch(() => setCoopError("Failed to join alliance."))
      .finally(() => setCoopJoining(false));
  }

  // --- LOADING WHEEL (no intrusive overlay) ---
  if (pageLoading) {
    return (
      <div className="boss-bg min-h-screen flex items-center justify-center">
        <div className="w-14 h-14 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // --- MAIN MENU ---
  if (!mode) {
    return (
      <div className="boss-bg min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Profile Header */}
          {profileData && (
            <div className="relative mb-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="w-full boss-glass-panel p-3 shadow-2xl border border-orange-500/40 flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  {profileData.profile.profile_icon ? (
                    isImageUrl(profileData.profile.profile_icon) ? (
                      <img
                        src={profileData.profile.profile_icon}
                        alt="icon"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <i className={`${profileData.profile.profile_icon} text-white`}></i>
                    )
                  ) : (
                    <div className="text-2xl">🙂</div>
                  )}
                  <div className="text-left">
                    <div className="text-orange-50 font-bold text-sm">
                      {profileData.profile.profile_name}
                    </div>
                    <div className="text-orange-200 text-xs">
                      Level {profileData.profile.total_level}
                    </div>
                  </div>
                </div>
                <ChevronDown className="text-orange-200" size={16} />
              </motion.button>
              <AnimatePresence>
                {showProfileDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 boss-glass-panel p-4 shadow-2xl border border-orange-500/30 z-50"
                  >
                    <div className="space-y-2 text-orange-100 text-sm">
                      <div className="flex justify-between">
                        <span>Boss Level:</span>
                        <span className="font-bold">{profileData.stats.bossLevel}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Coins:</span>
                        <span className="font-bold text-yellow-400">
                          {formatNumberShort(profileData.stats.totalCoins)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Available:</span>
                        <span className="font-bold text-green-400">
                          {formatNumberShort(profileData.stats.availableCoins)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Upgrade Level:</span>
                        <span className="font-bold">{profileData.stats.upgradeLevel}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Main Menu Panel */}
          <div className="boss-glass-panel p-8 shadow-3xl border border-orange-500/30">
            <div className="text-center mb-8">
              <h1
                className="text-5xl font-black text-orange-100 mb-2 flicker"
                style={{ textShadow: "0 0 20px #d97706, 0 0 40px #7c2d12" }}
              >
                INFERNO BOSS
              </h1>
              <p className="text-orange-300 text-lg">Dare to face the darkness?</p>
            </div>
            <div className="space-y-4">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setMode("solo");
                  setShowProfileDropdown(false);
                }}
                className="boss-button-solo"
              >
                <div className="flex items-center justify-center space-x-3">
                  <Flame size={28} />
                  <div className="text-left">
                    <div className="text-xl font-bold">Solo Inferno</div>
                    <div className="text-sm opacity-90">Face the flames alone</div>
                  </div>
                </div>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setMode("coop-create");
                  setShowProfileDropdown(false);
                }}
                className="boss-button-coop"
              >
                <div className="flex items-center justify-center space-x-3">
                  <Users size={28} />
                  <div className="text-left">
                    <div className="text-xl font-bold">Forge Alliance</div>
                    <div className="text-sm opacity-90">Create a 5-player raid</div>
                  </div>
                </div>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setMode("coop-join");
                  setShowProfileDropdown(false);
                }}
                className="boss-button-join"
              >
                <div className="flex items-center justify-center space-x-3">
                  <ChevronDown size={28} />
                  <div className="text-left">
                    <div className="text-xl font-bold">Join Alliance</div>
                    <div className="text-sm opacity-90">Enter a battle code</div>
                  </div>
                </div>
              </motion.button>
            </div>
          </div>
        </motion.div>
        <style jsx global>{bossCSS}</style>
      </div>
    );
  }

  // --- COOP CREATE / JOIN SCREENS ---
  if (mode === "coop-create" && !currentSession) {
    return (
      <div className="boss-bg min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="boss-glass-panel p-8 shadow-3xl border border-orange-500/30">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-orange-100 mb-2">Forge Alliance</h2>
              <p className="text-orange-300">Summon your raid party</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleCoopCreate}
              disabled={coopCreating}
              className="boss-button-coop w-full"
            >
              <div className="flex items-center justify-center space-x-3">
                <Flame size={24} />
                <span className="text-xl font-bold">
                  {coopCreating ? "Forging..." : "Create Alliance"}
                </span>
              </div>
            </motion.button>
            {coopError && (
              <div className="text-red-200 text-center p-3 bg-red-500/20 rounded-xl border border-red-500/30 mt-4">
                {coopError}
              </div>
            )}
            <button
              onClick={() => setMode("")}
              className="w-full mt-4 text-orange-300 hover:text-orange-100 transition-colors"
            >
              ← Back to menu
            </button>
          </div>
        </motion.div>
        <style jsx global>{bossCSS}</style>
      </div>
    );
  }
  if (mode === "coop-join" && !currentSession) {
    return (
      <div className="boss-bg min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="boss-glass-panel p-8 shadow-3xl border border-orange-500/30">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-orange-100 mb-2">Join Alliance</h2>
              <p className="text-orange-300">Enter the battle code</p>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Enter battle code"
                className="boss-input"
                maxLength={6}
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCoopJoin}
                disabled={!roomCode || coopJoining}
                className="boss-button-join w-full"
              >
                <div className="flex items-center justify-center space-x-3">
                  <Users size={24} />
                  <span className="text-xl font-bold">
                    {coopJoining ? "Joining..." : "Join Alliance"}
                  </span>
                </div>
              </motion.button>
              {coopError && (
                <div className="text-red-200 text-center p-3 bg-red-500/20 rounded-xl border border-red-500/30">
                  {coopError}
                </div>
              )}
            </div>
            <button
              onClick={() => setMode("")}
              className="w-full mt-4 text-orange-300 hover:text-orange-100 transition-colors"
            >
              ← Back to menu
            </button>
          </div>
        </motion.div>
        <style jsx global>{bossCSS}</style>
      </div>
    );
  }

  // --- BATTLE UI (SOLO/COOP) ---

  const isBattleLoading =
    (mode === "solo" && soloLoading) || (mode === "coop" && !currentSession);
  if (!upgradesData || !battleData || isBattleLoading) {
    return (
      <div className="boss-bg min-h-screen flex flex-col items-center justify-center px-4">
        <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-orange-100 text-xl animate-pulse">Summoning...</div>
        <style jsx global>{bossCSS}</style>
      </div>
    );
  }

  function getTimeUntilReset() {
    if (!soloProgress?.next_reset) return "";
    const now = new Date();
    const resetDate = new Date(soloProgress.next_reset);
    const diffMs = resetDate - now;
    if (diffMs <= 0) return "0d 0h 0m";
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${days}d ${hours}h ${minutes}m`;
  }

  return (
    <div className="boss-bg min-h-screen px-4 pb-10">
      <div className="max-w-md mx-auto space-y-4 pt-4">
        {/* Profile Header */}
        {profileData && (
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="w-full boss-glass-panel p-3 shadow-2xl border border-orange-500/30 flex items-center justify-between"
            >
              <div className="flex items-center space-x-2">
                {profileData.profile.profile_icon ? (
                  isImageUrl(profileData.profile.profile_icon) ? (
                    <img
                      src={profileData.profile.profile_icon}
                      alt="icon"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <i className={`${profileData.profile.profile_icon} text-white`}></i>
                  )
                ) : (
                  <div className="text-2xl">🙂</div>
                )}
                <div className="text-left">
                  <div className="text-orange-50 font-bold text-sm">
                    {profileData.profile.profile_name}
                  </div>
                  <div className="text-orange-200 text-xs">
                    Level {profileData.profile.total_level}
                  </div>
                </div>
              </div>
              <ChevronDown className="text-orange-300" size={16} />
            </motion.button>
            <AnimatePresence>
              {showProfileDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 boss-glass-panel p-4 shadow-2xl border border-orange-500/30 z-50"
                >
                  <div className="space-y-2 text-orange-100 text-sm">
                    <div className="flex justify-between">
                      <span>Boss Level:</span>
                      <span className="font-bold">{profileData.stats.bossLevel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Coins:</span>
                      <span className="font-bold text-yellow-400">
                        {formatNumberShort(profileData.stats.totalCoins)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Available:</span>
                      <span className="font-bold text-green-400">
                        {formatNumberShort(profileData.stats.availableCoins)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Upgrade Level:</span>
                      <span className="font-bold">{profileData.stats.upgradeLevel}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Header Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="boss-glass-panel p-4 shadow-2xl border border-orange-500/30"
        >
          <div className="flex justify-between items-center text-sm">
            <div className="text-orange-100">
              <div className="flex items-center space-x-1 mb-1">
                <Crown size={16} className="text-yellow-400" />
                <span className="font-bold">
                  Level {battleData.current_level || battleData.boss_level}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <Coins size={14} className="text-yellow-400" />
                <span className="text-xs opacity-80">
                  {formatNumberShort(profileData.stats.availableCoins)} coins
                </span>
              </div>
            </div>
            {mode === "solo" && (
              <div className="text-orange-100 text-right">
                <div className="flex items-center space-x-1 mb-1">
                  <Timer size={16} className="text-red-400" />
                  <span className="font-bold text-xs">Weekly Reset</span>
                </div>
                <div className="text-xs opacity-80">{getTimeUntilReset()}</div>
              </div>
            )}
            {mode === "coop" && currentSession && (
              <div className="text-orange-100 text-right">
                <div className="font-bold text-sm mb-1">{currentSession.room_code}</div>
                <div className="text-xs opacity-80">
                  {(currentSession.players?.length || 1)}/5 warriors
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Battle Arena Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="boss-glass-panel p-6 shadow-2xl border border-orange-500/30 text-center relative overflow-hidden boss-arena"
        >
          {/* Ambient flicker and flare */}
          <div className="boss-flicker" />
          <div className="boss-flare" />

          {/* Floating Damage Numbers */}
          <AnimatePresence>
            {showDamageNumbers.map((dmg) => (
              <motion.div
                key={dmg.id}
                initial={{ opacity: 1, y: 0, scale: 1 }}
                animate={{ opacity: 0, y: -80, scale: 1.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className={`absolute text-3xl font-black pointer-events-none z-20 ${
                  dmg.isCrit ? "text-yellow-300 drop-shadow-lg" : "text-orange-200"
                }`}
                style={{
                  left: `calc(50% + ${dmg.x}px)`,
                  top: `calc(40% + ${dmg.y}px)`,
                  textShadow: dmg.isCrit
                    ? "0 0 20px #fbbf24"
                    : "0 0 10px #fb923c",
                }}
              >
                {dmg.isCrit && "💥"}
                {dmg.damage}
                {dmg.isCrit && " 💥"}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Boss Emoji / Image */}
          <motion.div
            animate={
              showCelebration
                ? { scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }
                : { scale: 1, rotate: 0 }
            }
            transition={{ duration: 0.6 }}
            className="text-7xl mb-4 drop-shadow-2xl"
            style={{ textShadow: "0 0 32px #ef4444, 0 0 64px #7c2d12" }}
          >
            {battleData.boss_emoji}
          </motion.div>

          {/* Boss Health Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-orange-100 mb-2 text-sm">
              <span className="font-bold">Boss HP</span>
              <span>
                {formatNumberShort(visibleBossHp)} / {formatNumberShort(hpMax)}
              </span>
            </div>
            <div className="w-full boss-hp-bar">
              <motion.div
                initial={{ width: `${hpPercentage}%` }}
                animate={{ width: `${hpPercentage}%` }}
                transition={{ duration: 0.3 }}
                className="boss-hp-bar-inner"
              >
                <div className="boss-hp-bar-glow" />
              </motion.div>
            </div>
          </div>

          {/* Strike Action Button */}
          <div className="relative mb-6">
            <motion.button
              whileHover={{ scale: 1.07 }}
              whileTap={{ scale: 0.94, rotate: [0, -5, 5, 0] }}
              onClick={onTapButtonClick}
            disabled={visibleBossHp <= 0 || soloLoading}
              className="boss-strike-button"
            >
              <div className="absolute inset-0 boss-strike-gloss"></div>
              <div className="relative z-10 flex flex-col items-center justify-center h-full">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    textShadow: [
                      "0 0 10px #fbbf24",
                      "0 0 24px #fbbf24",
                      "0 0 10px #fbbf24",
                    ],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-5xl mb-2"
                >
                  🔥
                </motion.div>
                <div className="text-lg font-black tracking-wider drop-shadow-lg">
                  STRIKE!
                </div>
                <div className="text-xs opacity-90 mt-1">
                  {upgradesData?.stats?.tapPower || 1} DMG
                </div>
              </div>
            </motion.button>
          </div>
          <div className="text-orange-200 space-y-1 text-sm">
            <div>
              Strikes: {tapCount} | +{formatNumberShort(Math.floor(profileData.stats.availableCoins * 0.5))} coins per boss
              per boss
            </div>
            {upgradesData?.stats?.autoTapperDps > 0 && (
              <div className="text-green-400">
                ⚡ Auto-Strike: {formatNumberShort(upgradesData.stats.autoTapperDps)} DPS
              </div>
            )}
          </div>
        </motion.div>

        {/* Upgrades Panel (view-only in boss mode) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="boss-glass-panel p-4 shadow-2xl border border-orange-500/30"
        >
          <h3 className="text-xl font-bold text-orange-100 mb-1 text-center">
            ⚔️ UPGRADES ⚔️
          </h3>
          <p className="text-xs text-orange-200 text-center mb-3">
            (Manage upgrades in main game)
          </p>
          <div className="grid grid-cols-2 gap-2 text-orange-100 text-center text-xs font-bold">
            <div className="boss-upgrade-btn boss-upgrade-red cursor-not-allowed opacity-80 p-2">
              <div className="mb-1 flex items-center justify-between">
                <Zap size={16} className="text-yellow-400" />
              </div>
              <div>Tap Power</div>
              <div className="opacity-90">
                Lv.{formatNumberShort(upgradesData?.upgrades?.tap_power_upgrades || 1)}
              </div>
              <div className="opacity-70">
                {formatNumberShort(upgradesData?.stats?.tapPower || 1)} DMG
              </div>
            </div>
            <div className="boss-upgrade-btn boss-upgrade-green cursor-not-allowed opacity-80 p-2">
              <div className="mb-1 flex items-center justify-between">
                <Settings size={16} className="text-green-400" />
              </div>
              <div>Auto Tapper</div>
              <div className="opacity-90">
                Lv.{formatNumberShort(upgradesData?.upgrades?.auto_tapper_upgrades || 0)}
              </div>
              <div className="opacity-70">
                {formatNumberShort(upgradesData?.stats?.autoTapperDps || 0)} DPS
              </div>
            </div>
          </div>
        </motion.div>

        {/* Victory Celebration Overlay */}
        <AnimatePresence>
          {showCelebration && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 0.8 }}
                className="boss-glass-panel text-4xl text-orange-100 font-black text-center bg-black/70 backdrop-blur-xl rounded-3xl p-6 border border-orange-500/50"
              >
                🔥 BOSS INCINERATED! 🔥
                <div className="text-lg mt-2">Level Up!</div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Return to Main Game Button */}
        <div className="text-center pt-2">
          <button
            onClick={() => router.push("/")}
            className="text-orange-300 hover:text-orange-100 transition-colors text-sm"
          >
            ← Return to Tap Tap Two
          </button>
        </div>
      </div>
      <style jsx global>{bossCSS}</style>
    </div>
  );
}

// --- GLOSSY DARK "INFERNO" THEME STYLES ---
const bossCSS = `
  .boss-bg {
    background: linear-gradient(120deg, #18151e 0%, #2b1a1f 50%, #1a090d 100%);
    min-height: 100vh;
    position: relative;
    overflow: hidden;
  }
  .boss-glass-panel {
    background: linear-gradient(110deg, rgba(35,27,33,0.72) 80%, rgba(70,21,18,0.22) 100%);
    box-shadow: 0 8px 40px #0d070b77, 0 1px 4px #ff6d0057 inset;
    border-radius: 2rem;
    border: 1.5px solid #3913122c;
    backdrop-filter: blur(18px) brightness(0.95);
  }
  .boss-arena { position: relative; }
  .boss-flicker {
    pointer-events: none;
    position: absolute; top: -12px; left: 0; right: 0;
    height: 16px;
    background: radial-gradient(ellipse at 50% 40%, #ea580c44 0%, transparent 60%);
    animation: flicker-lights 2.7s infinite alternate;
    z-index: 1;
  }
  @keyframes flicker-lights {
    0%   { opacity: 0.92; filter: blur(1px); }
    11%  { opacity: 0.7; }
    22%  { opacity: 0.88; }
    42%  { opacity: 0.6; }
    62%  { opacity: 1; }
    73%  { opacity: 0.74; }
    100% { opacity: 0.88; filter: blur(2px); }
  }
  .boss-flare {
    pointer-events: none;
    position: absolute; left: 50%; top: 50%;
    width: 260px; height: 60px;
    transform: translate(-50%, -40%);
    background: radial-gradient(circle, #ff6d0066 0%, transparent 85%);
    opacity: 0.13;
    filter: blur(8px);
    z-index: 1;
    animation: arena-flare 4s infinite alternate;
  }
  @keyframes arena-flare {
    0%   { opacity: 0.11; }
    51%  { opacity: 0.20; }
    100% { opacity: 0.13; }
  }
  .boss-hp-bar {
    width: 100%;
    height: 20px;
    background: linear-gradient(90deg, #18151e 0%, #27191c 100%);
    border-radius: 10px;
    border: 1.5px solid #e6a34455;
    overflow: hidden;
    box-shadow: 0 2px 12px #6d260466, 0 0.5px 1.5px #ed8033a8 inset;
  }
  .boss-hp-bar-inner {
    background: linear-gradient(92deg, #ff4747 5%, #ffaf38 90%);
    height: 100%;
    border-radius: 10px 9px 9px 10px;
    position: relative;
  }
  .boss-hp-bar-glow {
    position: absolute;
    inset: 0;
    border-radius: 10px;
    background: linear-gradient(91deg, #fbbf2496 40%, #fdba7488 90%, transparent 100%);
    opacity: 0.4;
    filter: blur(3px);
    pointer-events: none;
  }
  .boss-strike-button {
    width: 11rem; height: 11rem;
    background: radial-gradient(ellipse at 70% 18%, #fffae5 7%, #ff6d00e0 49%, #6d1500 100%);
    border-radius: 50%;
    border: 4px solid #ffe18b55;
    box-shadow: 0 0 40px #fb923caa, 0 0 90px #7c2d12, 0 4px 18px #000000cc;
    overflow: hidden;
    position: relative;
    cursor: pointer;
    user-select: none;
    outline: none;
    transition: box-shadow 0.2s;
  }
  .boss-strike-button:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
  .boss-strike-gloss {
    position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 2;
    background: linear-gradient(170deg, rgba(255,255,255,0.19) 15%, rgba(251,191,36,0.1) 49%, rgba(0,0,0,0.13) 70%);
    pointer-events: none;
    mix-blend-mode: lighten;
  }
  .boss-button-solo, .boss-button-coop, .boss-button-join {
    width: 100%;
    color: #fff;
    border-radius: 2rem;
    padding: 1.5rem;
    font-weight: 700;
    border: 1.5px solid #fbbf2440;
    backdrop-filter: blur(4px);
    transition: box-shadow 0.2s, border 0.2s;
  }
  .boss-button-solo {
    background: linear-gradient(91deg, #9a3412 2%, #ef4444 97%);
    box-shadow: 0 8px 24px #7c2d12aa, 0 2px 12px #11111111;
  }
  .boss-button-coop {
    background: linear-gradient(95deg, #ef4444 2%, #f59e42 97%);
    box-shadow: 0 8px 24px #f59e4299, 0 2px 12px #11111111;
  }
  .boss-button-join {
    background: linear-gradient(92deg, #b91c1c 2%, #ef4444 49%, #fb7185 97%);
    box-shadow: 0 8px 24px #b91c1c99, 0 2px 12px #11111111;
  }
  .boss-input {
    width: 100%;
    padding: 1.2rem 1.5rem;
    border-radius: 1.5rem;
    background: #18151e77;
    border: 1.5px solid #fbbf2450;
    color: #ffecc1;
    font-size: 1.5rem;
    font-weight: 700;
    text-align: center;
    letter-spacing: 0.12em;
    outline: none;
    margin-bottom: 0.5rem;
  }
  .boss-upgrade-btn {
    border-radius: 1rem;
    font-weight: 700;
    padding: 0.8rem 0.5rem;
    box-shadow: 0 2px 8px #0d070b44;
    border: 1.5px solid #ffffff11;
    background: linear-gradient(120deg, #231b21cc 70%, #391a15cc 100%);
    color: #fff;
    user-select: none;
  }
  .boss-upgrade-red    { background: linear-gradient(92deg, #b91c1c 60%, #ef4444 100%); }
  .boss-upgrade-green  { background: linear-gradient(92deg, #166534 60%, #22d3ee 100%); }
  .boss-upgrade-purple { background: linear-gradient(91deg, #a21caf 60%, #ec4899 100%); }
  .boss-upgrade-yellow { background: linear-gradient(92deg, #f59e42 60%, #fbbf24 100%); }
  .flicker {
    animation: flicker-text 2.2s infinite alternate;
  }
  @keyframes flicker-text {
    0%, 19% { filter: brightness(0.97); text-shadow: 0 0 24px #fbbf24, 0 0 80px #d97706; }
    23%, 31% { filter: brightness(1.03); }
    47% { filter: brightness(1.1); }
    51%, 62% { filter: brightness(0.85); }
    89% { filter: brightness(1.11); }
    100% { filter: brightness(1); }
  }
  .shadow-3xl {
    box-shadow: 0 35px 60px -12px rgba(0,0,0,0.36);
  }
`;
