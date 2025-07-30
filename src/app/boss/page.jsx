"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Flame, ChevronDown, Coins, Crown, Timer,
  Zap, Target, Clock, Settings
} from "lucide-react";  // Icon library for UI elements

export default function BossModePage() {
  // --- STATE HOOKS ---
  const [canTap, setCanTap] = useState(true);                     // Whether the Strike button is currently tappable
  const [mode, setMode] = useState("");                           // "", "solo", "coop-create", "coop-join", or "coop" (active coop session)
  const [roomCode, setRoomCode] = useState("");
  const [currentSession, setCurrentSession] = useState(null);     // Data for current co-op session (if any)
  const [bossHp, setBossHp] = useState(100);                      // Current boss HP (for display/health bar)
  const [tapCount, setTapCount] = useState(0);                    // Number of taps in the current battle (solo mode)
  const [showCelebration, setShowCelebration] = useState(false);  // Controls victory celebration animation
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [lastTapTimes, setLastTapTimes] = useState([]);           // Timestamps of recent taps (for tap speed bonus calc)
  const [showDamageNumbers, setShowDamageNumbers] = useState([]); // Floating damage text effects
  const [localBattleData, setLocalBattleData] = useState(null);   // Local copy of solo battle progress (boss level, etc.)
  const [profileData, setProfileData] = useState(null);           // Player profile info (name, icon, etc.)
  const [profileLoading, setProfileLoading] = useState(false);
  const [upgradesData, setUpgradesData] = useState(null);         // Player upgrades and stats (levels, costs, values)
  const [upgradesLoading, setUpgradesLoading] = useState(false);
  const [soloProgress, setSoloProgress] = useState(null);         // Solo mode progress (boss level, HP, etc.)
  const [soloLoading, setSoloLoading] = useState(false);
  const [coopError, setCoopError] = useState("");                 // Error messages for co-op join/create
  const [coopJoining, setCoopJoining] = useState(false);
  const [coopCreating, setCoopCreating] = useState(false);
  // Note: We disable purchasing upgrades in boss mode, so no need for an "upgrading" state for buttons. 

  const autoTapperInterval = useRef(null);
  const coopSyncInterval = useRef(null);

  const [userId, setUserId] = useState("");
  const [pin, setPin] = useState("");
  const [userReady, setUserReady] = useState(false);

  const router = useRouter();  // For navigation (return to main game)

  // Utility: Format large numbers into short notation (1.2K, 5M, etc.)
  function formatNumberShort(num) {
    if (num < 1000) return num.toString();
    const units = [
      { value: 1e33, symbol: "Dc" }, // Decillion
      { value: 1e30, symbol: "Nn" }, // Nonillion
      { value: 1e27, symbol: "Oc" }, // Octillion
      { value: 1e24, symbol: "Sp" }, // Septillion
      { value: 1e21, symbol: "Sx" }, // Sextillion
      { value: 1e18, symbol: "Qi" }, // Quintillion
      { value: 1e15, symbol: "Qa" }, // Quadrillion
      { value: 1e12, symbol: "T" },  // Trillion
      { value: 1e9,  symbol: "B" },  // Billion
      { value: 1e6,  symbol: "M" },  // Million
      { value: 1e3,  symbol: "K" },
    ];
    for (let i = 0; i < units.length; i++) {
      if (num >= units[i].value) {
        const formatted = (num / units[i].value).toFixed(1).replace(/\.0$/, "");
        return formatted + units[i].symbol;
      }
    }
    return num.toString();
  }

  // --- USER AUTH & SESSION INIT ---
  useEffect(() => {
    // On mount, check for stored credentials
    const storedUserId = localStorage.getItem("userId");
    const storedPin = localStorage.getItem("pin");
    if (!storedUserId || !storedPin) {
      // If not logged in, redirect to login
      window.location.href = "/login";
      return;
    }
    setUserId(storedUserId);
    setPin(storedPin);
    setUserReady(true);
  }, []);

  // --- FETCH PROFILE DATA (name, icon, coin stats) ---
  useEffect(() => {
    if (!userReady) return;
    setProfileLoading(true);
    fetch(`/api/boss?action=profile&userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        setProfileData(data);
      })
      .finally(() => setProfileLoading(false));
  }, [userReady, userId]);

  // --- FETCH UPGRADES/STATS DATA (tap power, auto-tapper, etc.) ---
  useEffect(() => {
    if (!userReady) return;
    let cancel = false;
    const loadUpgrades = () => {
      setUpgradesLoading(true);
      fetch(`/api/boss?action=upgrades&userId=${userId}`)
        .then(res => res.json())
        .then(data => {
          if (cancel) return;
          setUpgradesData(data);
          // Mark that we have loaded upgrades at least once (used to gate UI rendering)
          setUpgradesLoadedOnce(true);
        })
        .finally(() => {
          if (!cancel) setUpgradesLoading(false);
        });
    };
    // Initial load
    loadUpgrades();
    // Poll for updates every 5s to sync with any changes from main game
    const interval = setInterval(loadUpgrades, 5000);
    return () => {
      cancel = true;
      clearInterval(interval);
    };
  }, [userReady, userId]);
  const [upgradesLoadedOnce, setUpgradesLoadedOnce] = useState(false);

  // --- FETCH SOLO PROGRESS (boss level, HP, etc.) ---
  useEffect(() => {
    if (!userReady || mode !== "solo") return;
    setSoloLoading(true);
    let cancel = false;
    const loadProgress = () => {
      fetch(`/api/boss?action=progress&userId=${userId}`)
        .then(res => res.json())
        .then(data => {
          if (!cancel) setSoloProgress(data);
        })
        .finally(() => {
          if (!cancel) setSoloLoading(false);
        });
    };
    loadProgress();  // initial fetch
    const interval = setInterval(loadProgress, 30000);  // refresh every 30s
    return () => {
      cancel = true;
      clearInterval(interval);
    };
  }, [userReady, userId, mode]);

  // --- CO-OP SESSION SYNC ---
  useEffect(() => {
    // When in an active coop session, periodically sync session state (boss HP, players, etc.)
    if (!mode.startsWith("coop") || !currentSession) return;
    let cancel = false;
    const syncSession = () => {
      fetch(`/api/boss?action=coop_session&roomCode=${currentSession.room_code}&userId=${userId}`)
        .then(res => res.json())
        .then(data => {
          if (cancel || !data.session) return;
          // Update current session data and boss HP from server
          setCurrentSession(data.session);
          setBossHp(data.session.boss_hp);
        });
    };
    syncSession();
    coopSyncInterval.current = setInterval(syncSession, 1000);  // sync every 1s for real-time HP updates
    return () => {
      cancel = true;
      clearInterval(coopSyncInterval.current);
    };
  }, [mode, currentSession, userId]);

  // --- AUTO-TAPPER (Solo Mode) ---
  useEffect(() => {
    // If in solo mode and the player has an auto-tapper DPS, trigger auto taps every second
    if (mode === "solo" && upgradesData?.stats?.autoTapperDps > 0) {
      autoTapperInterval.current = setInterval(() => {
        handleSoloTap(true);  // treat as auto tap
      }, 1000);
    }
    return () => {
      // Cleanup any auto-tap interval when leaving solo mode or if DPS becomes 0
      if (autoTapperInterval.current) clearInterval(autoTapperInterval.current);
    };
  }, [mode, upgradesData?.stats?.autoTapperDps]);

  // --- LOCAL BATTLE DATA INIT ---
  useEffect(() => {
    // When entering solo mode, initialize localBattleData with the fetched soloProgress (one-time per session)
    if (mode === "solo" && soloProgress && !localBattleData) {
      setLocalBattleData(soloProgress);
    }
  }, [mode, soloProgress, localBattleData]);

  // --- INITIALIZE BOSS HP ON MODE ENTER ---
  useEffect(() => {
    // Set the initial boss HP when we have battle data and are just starting a fight
    const battleData = mode === "solo" ? (localBattleData || soloProgress) : currentSession;
    if ((mode === "solo" || mode === "coop") && battleData && bossHp === 100) {
      // Replace default 100 HP with actual current boss HP from data
      setBossHp(battleData.boss_hp);
    }
  }, [mode, localBattleData, soloProgress, currentSession, bossHp]);

  // --- UTILITY: TAP SPEED MULTIPLIER ---
  const getTapSpeedMultiplier = useCallback(() => {
    // Calculate bonus if 5 or more taps occurred in the last 1 second
    if (!upgradesData?.stats?.tapSpeedBonus) return 1;
    const now = Date.now();
    // Filter tap timestamps to last 1s
    const recentTaps = lastTapTimes.filter(t => now - t < 1000).length;
    if (recentTaps >= 5) {
      // Apply speed bonus % as multiplier
      return 1 + upgradesData.stats.tapSpeedBonus / 100;
    }
    return 1;
  }, [lastTapTimes, upgradesData?.stats?.tapSpeedBonus]);

  // --- TAP HANDLER (Delegates to solo or co-op) ---
  function handleTap() {
    if (!canTap) return;
    const now = Date.now();
    // Track this tap time for speed bonus calc
    setLastTapTimes(prev => [...prev.slice(-10), now]);
    setTapCount(prev => prev + 1);
    if (mode === "solo" && soloProgress) {
      handleSoloTap(false);
    } else if (mode.startsWith("coop") && currentSession) {
      handleCoopTap();
    }
  }

  // --- SOLO TAP (Single tap or auto-tap) ---
  function handleSoloTap(isAutoTap = false) {
    if (!canTap) return;
    setCanTap(false);  // temporarily disable further taps until server responds
    fetch("/api/boss", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "solo_tap", userId: userId, isAutoTap })
    })
      .then(res => res.json())
      .then(data => {
        if (data.needs_reload) {
          // Boss was already defeated on server (perhaps due to latency), reload all progress
          refreshAll();
          return;
        }
        if (typeof data.current_boss_hp === "number") {
          // Update boss HP if provided
          setBossHp(data.current_boss_hp);
        }
        if (data.boss_defeated) {
          // Boss defeated – show celebration and load new boss data
          setShowCelebration(true);
          // Update local battle data for the new boss/level
          setLocalBattleData(prev => {
            const prevData = prev || soloProgress;
            return {
              ...prevData,
              current_level: data.new_level,
              boss_hp: data.current_boss_hp,
              boss_max_hp: data.boss_max_hp,
              boss_emoji: data.boss_emoji,
              total_coins_earned: data.total_coins,  // updated total coins earned in boss mode
              coins_per_boss: data.coins_per_boss ||
                Math.floor(500 * Math.pow(1.15, data.new_level - 1))  // fallback if not provided
            };
          });
          // Refresh profile, upgrades, and progress to sync new coin counts and stats
          refreshAll();
          // After brief celebration, hide it and re-enable tapping for next boss
          setTimeout(() => setShowCelebration(false), 2000);
          setCanTap(true);
          return;
        }
        // If boss not dead and we dealt damage (and this was a manual tap), show damage pop-up
        if (data.damage_dealt && !data.is_auto_tap) {
          const dmgId = Date.now();
          setShowDamageNumbers(prev => [
            ...prev,
            {
              id: dmgId,
              damage: data.damage_dealt,
              isCrit: data.was_crit,
              // Random offsets for the floating text position
              x: Math.random() * 200 - 100,
              y: Math.random() * 100 - 50
            }
          ]);
          // Remove the damage number after animation (1.5s)
          setTimeout(() => {
            setShowDamageNumbers(prev => prev.filter(d => d.id !== dmgId));
          }, 1500);
        }
        // Re-enable tapping for the next strike
        setCanTap(true);
      })
      .catch(err => {
        console.error("Solo tap failed:", err);
        setCanTap(true);
      });
  }

  // --- CO-OP TAP (All players contribute damage) ---
  function handleCoopTap() {
    if (!currentSession) return;
    // For simplicity, each tap deals the player's tap power damage (crit mechanics can be handled server-side if needed)
    const damage = upgradesData?.stats?.tapPower || 1;
    fetch("/api/boss", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "coop_tap",
        roomCode: currentSession.room_code,
        userId: userId,
        damage
      })
    })
      .then(res => res.json())
      .then(data => {
        if (!data.session) {
          console.warn("Co-op tap: No session data returned");
          return;
        }
        // Update session and boss HP from response
        setCurrentSession(data.session);
        setBossHp(data.session.boss_hp);
        if (data.boss_defeated) {
          // Boss defeated in co-op
          setShowCelebration(true);
          // Refresh profile to update coin count with split reward
          refreshAll();
          setTimeout(() => setShowCelebration(false), 2000);
        }
      })
      .catch(err => console.error("Co-op tap error:", err));
  }

  // --- REFRESH ALL DATA (Profile, Upgrades, Solo Progress) ---
  function refreshAll() {
    // Fetch profile (name, icon, coins)
    setProfileLoading(true);
    fetch(`/api/boss?action=profile&userId=${userId}`)
      .then(res => res.json())
      .then(data => setProfileData(data))
      .finally(() => setProfileLoading(false));
    // Fetch upgrades (levels, stats, costs)
    setUpgradesLoading(true);
    fetch(`/api/boss?action=upgrades&userId=${userId}`)
      .then(res => res.json())
      .then(data => setUpgradesData(data))
      .finally(() => setUpgradesLoading(false));
    // Fetch solo progress (boss level, HP, etc.)
    setSoloLoading(true);
    fetch(`/api/boss?action=progress&userId=${userId}`)
      .then(res => res.json())
      .then(data => setSoloProgress(data))
      .finally(() => setSoloLoading(false));
  }

  // --- CO-OP SESSION CREATION ---
  function handleCoopCreate() {
    setCoopCreating(true);
    setCoopError("");
    fetch("/api/boss", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "coop_create", userId })
    })
      .then(res => res.json())
      .then(data => {
        if (!data.session) throw new Error("No session returned");
        setCurrentSession(data.session);
        setBossHp(data.session.boss_hp);
        // Switch mode to active coop session
        setMode("coop");
      })
      .catch(err => {
        console.error("Failed to create co-op session:", err);
        setCoopError("Failed to create session. Please try again.");
      })
      .finally(() => setCoopCreating(false));
  }

  // --- CO-OP SESSION JOIN ---
  function handleCoopJoin() {
    setCoopJoining(true);
    setCoopError("");
    fetch("/api/boss", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "coop_join", roomCode: roomCode.trim(), userId })
    })
      .then(res => res.json())
      .then(data => {
        if (data.session) {
          setCurrentSession(data.session);
          setBossHp(data.session.boss_hp);
          // Enter active coop session mode
          setMode("coop");
        } else {
          setCoopError("Failed to join alliance. Check the code and try again.");
        }
      })
      .catch(err => {
        console.error("Failed to join alliance:", err);
        setCoopError("Failed to join alliance.");
      })
      .finally(() => setCoopJoining(false));
  }

  // --- HELPER: Format time until weekly reset (for solo mode display) ---
  function getTimeUntilReset() {
    if (!soloProgress?.next_reset) return "";
    const now = new Date();
    const resetDate = new Date(soloProgress.next_reset);
    const diffMs = resetDate - now;
    if (diffMs <= 0) return "0d 0h 0m";
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${days}d ${hours}h ${minutes}m`;
  }

  // Determine currently available coins (from profile stats). 
  const availableCoins = profileData?.stats?.availableCoins || 0;

  /*** RENDER LOGIC ***/
  // If no mode selected yet, show the main boss menu (Solo / Co-op options)
  if (!mode || (mode === "coop-create" && currentSession == null) || (mode === "coop-join" && currentSession == null)) {
    return (
      <div className="boss-bg min-h-screen flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          {/* Profile Header (shows name & icon, with dropdown) */}
          {profileData && (
            <div className="relative mb-6">
              <motion.button 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="w-full boss-glass-panel p-3 shadow-2xl border border-orange-500/40 flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  {/* Profile Icon: image or emoji */}
                  {profileData.profile.profile_icon ? (
                    isImageUrl(profileData.profile.profile_icon) ? (
                      <img 
                        src={profileData.profile.profile_icon} 
                        alt="icon" 
                        className="w-8 h-8 rounded-full object-cover" 
                      />
                    ) : (
                      <div className="text-2xl">
                        {profileData.profile.profile_icon}
                      </div>
                    )
                  ) : (
                    <div className="text-2xl">🙂</div>  /* default emoji if none */
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
                        <span className="font-bold text-yellow-400">{formatNumberShort(profileData.stats.totalCoins)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Available:</span>
                        <span className="font-bold text-green-400">{formatNumberShort(availableCoins)}</span>
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
              <h1 className="text-5xl font-black text-orange-100 mb-2 flicker" style={{ textShadow: "0 0 20px #d97706, 0 0 40px #7c2d12" }}>
                INFERNO BOSS
              </h1>
              <p className="text-orange-300 text-lg">Dare to face the darkness?</p>
            </div>
            <div className="space-y-4">
              <motion.button 
                whileHover={{ scale: 1.04 }} 
                whileTap={{ scale: 0.97 }}
                onClick={() => { setMode("solo"); setShowProfileDropdown(false); }}
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
                onClick={() => { setMode("coop-create"); setShowProfileDropdown(false); }}
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
                onClick={() => { setMode("coop-join"); setShowProfileDropdown(false); }}
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
        {/* Include the global boss CSS styles */}
        <style jsx global>{bossCSS}</style>
      </div>
    );
  }

  // If mode is "coop-create" or "coop-join" but we already have currentSession, it means we just created or joined and should proceed to battle UI.
  // If mode is exactly "coop" (active coop session), proceed to battle UI as well. (We'll handle in unified battle UI below.)

  // If in the process of creating a co-op session (mode "coop-create" without a session yet)
  if (mode === "coop-create" && currentSession == null) {
    return (
      <div className="boss-bg min-h-screen flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
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

  // If in the process of joining a co-op session (mode "coop-join" without session yet)
  if (mode === "coop-join" && currentSession == null) {
    return (
      <div className="boss-bg min-h-screen flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="boss-glass-panel p-8 shadow-3xl border border-orange-500/30">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-orange-100 mb-2">Join Alliance</h2>
              <p className="text-orange-300">Enter the battle code</p>
            </div>
            <div className="space-y-4">
              <input 
                type="text"
                value={roomCode}
                onChange={e => setRoomCode(e.target.value.toUpperCase())}
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

  // At this point, we are in an active battle (either solo or coop). 
  // Prepare the data for rendering battle UI:
  const battleData = mode === "solo" ? (localBattleData || soloProgress) : currentSession;
  const isLoading = (mode === "solo" && soloLoading) || (mode === "coop" && !currentSession);
  // If data isn’t loaded yet or first upgrades fetch hasn’t completed, show loading overlay
  if (!upgradesLoadedOnce || isLoading || !battleData) {
    return (
      <div className="boss-bg min-h-screen flex flex-col items-center justify-center px-4">
        {/* Spinning flame loader */}
        <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-orange-100 text-xl animate-pulse">Summoning...</div>
        <style jsx global>{bossCSS}</style>
      </div>
    );
  }

  // Calculate HP bar percentage and tap speed bonus multiplier
  const hpPercentage = battleData.boss_max_hp ? (bossHp / battleData.boss_max_hp) * 100 
                                             : (bossHp / battleData.boss_hp) * 100;
  const tapSpeedMultiplier = getTapSpeedMultiplier();

  // --- BATTLE UI RENDER ---
  return (
    <div className="boss-bg min-h-screen px-4 pb-10">
      <div className="max-w-md mx-auto space-y-4 pt-4">
        {/* Profile Header (in battle view) */}
        {profileData && (
          <div className="relative">
            <motion.button 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="w-full boss-glass-panel p-3 shadow-2xl border border-orange-500/30 flex items-center justify-between"
            >
              <div className="flex items-center space-x-2">
                {/* Profile Icon: emoji or image */}
                {profileData.profile.profile_icon ? (
                  isImageUrl(profileData.profile.profile_icon) ? (
                    <img 
                      src={profileData.profile.profile_icon} 
                      alt="icon" 
                      className="w-8 h-8 rounded-full object-cover" 
                    />
                  ) : (
                    <div className="text-2xl">
                      {profileData.profile.profile_icon}
                    </div>
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
                      <span className="font-bold text-yellow-400">{formatNumberShort(profileData.stats.totalCoins)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Available:</span>
                      <span className="font-bold text-green-400">{formatNumberShort(availableCoins)}</span>
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

        {/* Header Stats Bar (Level, Coins, Timer or Co-op Info) */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="boss-glass-panel p-4 shadow-2xl border border-orange-500/30"
        >
          <div className="flex justify-between items-center text-sm">
            {/* Left side: Boss Level and Coins */}
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
                  {formatNumberShort(availableCoins)} coins
                </span>
              </div>
            </div>
            {/* Right side: either Solo reset timer or Co-op room info */}
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
          {/* Ambient flicker and flare effects */}
          <div className="boss-flicker" />
          <div className="boss-flare" />
          {/* Floating Damage Numbers */}
          <AnimatePresence>
            {showDamageNumbers.map(dmg => (
              <motion.div 
                key={dmg.id}
                initial={{ opacity: 1, y: 0, scale: 1 }}
                animate={{ opacity: 0, y: -80, scale: 1.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className={`absolute text-3xl font-black pointer-events-none z-20 ${dmg.isCrit ? "text-yellow-300 drop-shadow-lg" : "text-orange-200"}`}
                style={{
                  left: `calc(50% + ${dmg.x}px)`,
                  top: `calc(40% + ${dmg.y}px)`,
                  textShadow: dmg.isCrit ? "0 0 20px #fbbf24" : "0 0 10px #fb923c"
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
            animate={ showCelebration 
                      ? { scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] } 
                      : { scale: 1, rotate: 0 } }
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
                {formatNumberShort(bossHp)} / {formatNumberShort(battleData.boss_max_hp || battleData.boss_hp)}
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
              onClick={handleTap}
              disabled={!canTap || bossHp <= 0}
              className="boss-strike-button"
            >
              <div className="absolute inset-0 boss-strike-gloss"></div>
              <div className="relative z-10 flex flex-col items-center justify-center h-full">
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], textShadow: ["0 0 10px #fbbf24", "0 0 24px #fbbf24", "0 0 10px #fbbf24"] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-5xl mb-2"
                >
                  🔥
                </motion.div>
                <div className="text-lg font-black tracking-wider drop-shadow-lg">STRIKE!</div>
                {/* Show base damage on the button */}
                <div className="text-xs opacity-90 mt-1">
                  {upgradesData?.stats?.tapPower || 1} DMG
                </div>
              </div>
            </motion.button>
          </div>
          {/* Battle Stats (taps, coins per boss, speed bonus, auto-tapper) */}
          <div className="text-orange-200 space-y-1 text-sm">
            <div>
              Strikes: {tapCount} | +{formatNumberShort(battleData.coins_per_boss)} coins per boss
            </div>
            {tapSpeedMultiplier > 1 && (
              <motion.div 
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="text-yellow-400 font-bold"
              >
                🔥 SPEED BONUS: {Math.round((tapSpeedMultiplier - 1) * 100)}% 🔥
              </motion.div>
            )}
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
          <p className="text-xs text-orange-200 text-center mb-3">(Manage upgrades in main game)</p>
          <div className="grid grid-cols-2 gap-2 text-orange-100 text-center text-xs font-bold">
            {/* Tap Power (Level and Damage) */}
            <div className="boss-upgrade-btn boss-upgrade-red cursor-not-allowed opacity-80 p-2">
              <div className="mb-1 flex items-center justify-between">
                <Zap size={16} className="text-yellow-400" />
                {/* No cost displayed in boss mode */}
              </div>
              <div>Tap Power</div>
              <div className="opacity-90">Lv.{formatNumberShort(upgradesData?.upgrades?.tap_power_upgrades || 1)}</div>
              <div className="opacity-70">{formatNumberShort(upgradesData?.stats?.tapPower || 1)} DMG</div>
            </div>
            {/* Auto Tapper (Level and DPS) */}
            <div className="boss-upgrade-btn boss-upgrade-green cursor-not-allowed opacity-80 p-2">
              <div className="mb-1 flex items-center justify-between">
                <Settings size={16} className="text-green-400" />
              </div>
              <div>Auto Tapper</div>
              <div className="opacity-90">Lv.{formatNumberShort(upgradesData?.upgrades?.auto_tapper_upgrades || 0)}</div>
              <div className="opacity-70">{formatNumberShort(upgradesData?.stats?.autoTapperDps || 0)} DPS</div>
            </div>
            {/* Crit Chance (Level and %) */}
            <div className="boss-upgrade-btn boss-upgrade-purple cursor-not-allowed opacity-80 p-2">
              <div className="mb-1 flex items-center justify-between">
                <Target size={16} className="text-purple-400" />
              </div>
              <div>Crit Chance</div>
              <div className="opacity-90">Lv.{formatNumberShort(upgradesData?.upgrades?.crit_chance_upgrades || 0)}</div>
              <div className="opacity-70">{formatNumberShort(upgradesData?.stats?.critChance || 0)}%</div>
            </div>
            {/* Tap Speed Bonus (Level and %) */}
            <div className="boss-upgrade-btn boss-upgrade-yellow cursor-not-allowed opacity-80 p-2">
              <div className="mb-1 flex items-center justify-between">
                <Clock size={16} className="text-yellow-400" />
              </div>
              <div>Speed Bonus</div>
              <div className="opacity-90">Lv.{formatNumberShort(upgradesData?.upgrades?.tap_speed_bonus_upgrades || 0)}</div>
              <div className="opacity-70">+{formatNumberShort(upgradesData?.stats?.tapSpeedBonus || 0)}%</div>
            </div>
          </div>
        </motion.div>

        {/* Victory Celebration Overlay (appears on boss defeat) */}
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

// Helper to determine if a profileIcon string is an image URL (for rendering)
function isImageUrl(iconStr) {
  // Very basic check: if it looks like a URL (starts with http or /) or has an image file extension
  return typeof iconStr === "string" && 
         (iconStr.startsWith("http") || iconStr.startsWith("/") || iconStr.match(/\.(png|jpg|jpeg|gif|svg)$/i));
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
