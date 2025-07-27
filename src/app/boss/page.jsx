"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users, Code, Flame, ChevronDown, Coins, Crown, Timer, Zap, Target, Clock, Settings
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// === CONFIG ===
const DEMO_USER = "demo_user";

function getUpgradeField(utype) {
  switch (utype) {
    case "tapPower": return "tap_power_level";
    case "autoTapper": return "auto_tapper_level";
    case "critChance": return "crit_chance_upgrades";
    case "tapSpeedBonus": return "tap_speed_bonus_upgrades";
    default: return utype;
  }
}

export default function BossModePage() {
  // === STATE ===
  const [mode, setMode] = useState(""); // '', 'solo', 'coop-create', 'coop-join'
  const [roomCode, setRoomCode] = useState("");
  const [currentSession, setCurrentSession] = useState(null);
  const [bossHp, setBossHp] = useState(100);
  const [tapCount, setTapCount] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [lastTapTimes, setLastTapTimes] = useState([]);
  const [showDamageNumbers, setShowDamageNumbers] = useState([]);
  const [localBattleData, setLocalBattleData] = useState(null);
  const autoTapperRef = useRef(null);

  const queryClient = useQueryClient();

  // === QUERIES & MUTATIONS ===
  const { data: profileData } = useQuery({
    queryKey: ["boss-profile"],
    queryFn: async () => {
      const res = await fetch(`/api/boss?action=profile&userId=${DEMO_USER}`);
      if (!res.ok) throw new Error("Failed to fetch profile");
      return await res.json();
    }
  });

  const { data: upgradesData, isLoading: upgradesLoading } = useQuery({
    queryKey: ["boss-upgrades"],
    queryFn: async () => {
      const res = await fetch(`/api/boss?action=upgrades&userId=${DEMO_USER}`);
      if (!res.ok) throw new Error("Failed to fetch upgrades");
      return await res.json();
    },
    refetchInterval: 5000,
  });

  const { data: soloProgress, isLoading: soloLoading } = useQuery({
    queryKey: ["boss-solo-progress"],
    queryFn: async () => {
      const res = await fetch(`/api/boss?action=progress&userId=${DEMO_USER}`);
      if (!res.ok) throw new Error("Failed to fetch solo progress");
      return await res.json();
    },
    enabled: mode === "solo",
    refetchInterval: 30000,
  });

  useQuery({
    queryKey: ["boss-coop-session", currentSession?.room_code],
    queryFn: async () => {
      if (!currentSession?.room_code) throw new Error("No session");
      const res = await fetch(
        `/api/boss?action=coop_session&roomCode=${currentSession.room_code}&userId=${DEMO_USER}`
      );
      if (!res.ok) throw new Error("Failed to sync session");
      return await res.json();
    },
    enabled: mode.startsWith("coop") && !!currentSession,
    refetchInterval: 1000,
    onSuccess: (data) => {
      setCurrentSession(data.session);
      setBossHp(data.session.boss_hp);
    },
  });

  const purchaseUpgradeMutation = useMutation({
    mutationFn: async (upgradeType) => {
      const res = await fetch("/api/boss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "upgrade", userId: DEMO_USER, upgradeType }),
      });
      if (!res.ok) throw new Error("Failed to purchase upgrade");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boss-upgrades"] });
      queryClient.invalidateQueries({ queryKey: ["boss-profile"] });
      queryClient.invalidateQueries({ queryKey: ["boss-solo-progress"] });
    },
  });

  const soloTapMutation = useMutation({
    mutationFn: async (isAutoTap = false) => {
      const res = await fetch("/api/boss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "solo_tap", userId: DEMO_USER, isAutoTap }),
      });
      if (!res.ok) throw new Error("Failed to tap boss");
      return res.json();
    },
    onSuccess: (data) => {
      if (typeof data.current_boss_hp === "number") setBossHp(data.current_boss_hp);

      if (data.boss_defeated) {
        setShowCelebration(true);
        setBossHp(data.current_boss_hp);

        setLocalBattleData((prev) => ({
          ...(prev || soloProgress),
          current_level: data.new_level,
          boss_hp: data.current_boss_hp,
          boss_max_hp: data.boss_max_hp,
          boss_emoji: data.boss_emoji,
          total_coins_earned: data.total_coins,
          coins_per_boss: data.coins_per_boss || Math.floor(500 * Math.pow(1.15, data.new_level - 1)),
        }));

        queryClient.setQueryData(["boss-solo-progress"], (oldData) => ({
          ...oldData,
          current_level: data.new_level,
          boss_hp: data.current_boss_hp,
          boss_max_hp: data.boss_max_hp,
          boss_emoji: data.boss_emoji,
          total_coins_earned: data.total_coins,
        }));

        queryClient.invalidateQueries({ queryKey: ["boss-solo-progress"] });
        queryClient.invalidateQueries({ queryKey: ["boss-upgrades"] });
        queryClient.invalidateQueries({ queryKey: ["boss-profile"] });
        setTimeout(() => setShowCelebration(false), 2000);
      }

      if (data.damage_dealt && !data.is_auto_tap) {
        const damageId = Date.now();
        setShowDamageNumbers((prev) => [
          ...prev,
          {
            id: damageId,
            damage: data.damage_dealt,
            isCrit: data.was_crit,
            x: Math.random() * 200 - 100,
            y: Math.random() * 100 - 50,
          },
        ]);
        setTimeout(() => {
          setShowDamageNumbers((prev) => prev.filter((d) => d.id !== damageId));
        }, 1500);
      }
    },
  });

  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/boss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "coop_create", userId: DEMO_USER }),
      });
      if (!res.ok) throw new Error("Failed to create session");
      return res.json();
    },
    onSuccess: (data) => {
      setCurrentSession(data.session);
      setBossHp(data.session.boss_hp);
    },
  });

  const joinSessionMutation = useMutation({
    mutationFn: async (code) => {
      const res = await fetch("/api/boss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "coop_join", roomCode: code, userId: DEMO_USER }),
      });
      if (!res.ok) throw new Error("Failed to join session");
      return res.json();
    },
    onSuccess: (data) => {
      setCurrentSession(data.session);
      setBossHp(data.session.boss_hp);
    },
  });

  const coopTapMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/boss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "coop_tap",
          roomCode: currentSession.room_code,
          userId: DEMO_USER,
          damage: upgradesData?.stats?.tapPower || 1,
        }),
      });
      if (!res.ok) throw new Error("Failed to process co-op tap");
      return res.json();
    },
    onSuccess: (data) => {
      setCurrentSession(data.session);
      setBossHp(data.session.boss_hp);
      if (data.boss_defeated) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 2000);
      }
    },
  });

  useEffect(() => {
    if (mode === "solo" && upgradesData?.stats?.autoTapperDps > 0) {
      autoTapperRef.current = setInterval(() => {
        soloTapMutation.mutate(true);
      }, 1000);
    }
    return () => { if (autoTapperRef.current) clearInterval(autoTapperRef.current); };
  }, [mode, upgradesData?.stats?.autoTapperDps, soloTapMutation]);

  const getTapSpeedMultiplier = useCallback(() => {
    if (!upgradesData?.stats?.tapSpeedBonus) return 1;
    const now = Date.now();
    const recentTaps = lastTapTimes.filter((time) => now - time < 1000).length;
    if (recentTaps >= 3) return 1 + upgradesData.stats.tapSpeedBonus / 100;
    return 1;
  }, [lastTapTimes, upgradesData?.stats?.tapSpeedBonus]);

  const handleTap = useCallback(() => {
    const now = Date.now();
    setLastTapTimes((prev) => [...prev.slice(-10), now]);
    setTapCount((prev) => prev + 1);

    if (mode === "solo" && soloProgress) {
      soloTapMutation.mutate();
    } else if (mode.startsWith("coop") && currentSession) {
      coopTapMutation.mutate();
    }
  }, [mode, soloProgress, currentSession, soloTapMutation, coopTapMutation]);

  useEffect(() => {
    if (mode === "solo" && soloProgress && !localBattleData) {
      setLocalBattleData(soloProgress);
    }
  }, [mode, soloProgress, localBattleData]);

  useEffect(() => {
    const battleData = mode === "solo" ? localBattleData || soloProgress : currentSession;
    if (mode === "solo" && battleData && bossHp === 100) setBossHp(battleData.boss_hp);
  }, [mode, localBattleData, soloProgress, currentSession, bossHp]);

  const getTimeUntilReset = useCallback(() => {
    if (!soloProgress?.next_reset) return "";
    const now = new Date();
    const resetDate = new Date(soloProgress.next_reset);
    const diff = resetDate - now;
    if (diff <= 0) return "0d 0h 0m";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${days}d ${hours}h ${minutes}m`;
  }, [soloProgress]);

  const availableCoins = profileData?.stats?.availableCoins || 0;

  // --- UI: Menu ---
  if (!mode) {
    return (
      <div className="boss-bg min-h-screen flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          {profileData && (
            <div className="relative mb-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="w-full boss-glass-panel p-3 shadow-2xl border border-orange-500/40 flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <div className="text-2xl">{profileData.profile.profile_icon}</div>
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
                      <div className="flex justify-between"><span>Boss Level:</span><span className="font-bold">{profileData.stats.bossLevel}</span></div>
                      <div className="flex justify-between"><span>Total Coins:</span><span className="font-bold text-yellow-400">{profileData.stats.totalCoins}</span></div>
                      <div className="flex justify-between"><span>Available:</span><span className="font-bold text-green-400">{availableCoins}</span></div>
                      <div className="flex justify-between"><span>Upgrade Level:</span><span className="font-bold">{profileData.stats.upgradeLevel}</span></div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          <div className="boss-glass-panel p-8 shadow-3xl border border-orange-500/30">
            <div className="text-center mb-8">
              <h1 className="text-5xl font-black text-orange-100 mb-2" style={{ textShadow: "0 0 20px #d97706,0 0 40px #7c2d12" }}>
                <span className="flicker">INFERNO BOSS</span>
              </h1>
              <p className="text-orange-300 text-lg">Dare to face the darkness?</p>
            </div>
            <div className="space-y-4">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setMode("solo")}
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
                onClick={() => setMode("coop-create")}
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
                onClick={() => setMode("coop-join")}
                className="boss-button-join"
              >
                <div className="flex items-center justify-center space-x-3">
                  <Code size={28} />
                  <div className="text-left">
                    <div className="text-xl font-bold">Join Alliance</div>
                    <div className="text-sm opacity-90">Enter the battle code</div>
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

  // --- CO-OP CREATE ---
  if (mode === "coop-create" && !currentSession) {
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
              onClick={() => createSessionMutation.mutate()}
              disabled={createSessionMutation.isLoading}
              className="boss-button-coop w-full"
            >
              <div className="flex items-center justify-center space-x-3">
                <Flame size={24} />
                <span className="text-xl font-bold">
                  {createSessionMutation.isLoading ? "Forging..." : "Create Alliance"}
                </span>
              </div>
            </motion.button>
            <button
              onClick={() => setMode("")}
              className="w-full mt-4 text-orange-300 hover:text-orange-100 transition-colors"
            >← Back to menu</button>
          </div>
        </motion.div>
        <style jsx global>{bossCSS}</style>
      </div>
    );
  }

  // --- CO-OP JOIN ---
  if (mode === "coop-join" && !currentSession) {
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
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Enter battle code"
                className="boss-input"
                maxLength={6}
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => joinSessionMutation.mutate(roomCode)}
                disabled={!roomCode || joinSessionMutation.isLoading}
                className="boss-button-join w-full"
              >
                <div className="flex items-center justify-center space-x-3">
                  <Users size={24} />
                  <span className="text-xl font-bold">
                    {joinSessionMutation.isLoading ? "Joining..." : "Join Alliance"}
                  </span>
                </div>
              </motion.button>
              {joinSessionMutation.error && (
                <div className="text-red-200 text-center p-3 bg-red-500/20 rounded-xl border border-red-500/30">
                  Failed to join alliance. Check the code and try again.
                </div>
              )}
            </div>
            <button
              onClick={() => setMode("")}
              className="w-full mt-4 text-orange-300 hover:text-orange-100 transition-colors"
            >← Back to menu</button>
          </div>
        </motion.div>
        <style jsx global>{bossCSS}</style>
      </div>
    );
  }

  // --- BATTLE UI (Solo/Co-op) ---
  const battleData = mode === "solo" ? localBattleData || soloProgress : currentSession;
  const isLoading = mode === "solo" ? soloLoading : false;
  if (isLoading || !battleData || upgradesLoading) {
    return (
      <div className="boss-bg min-h-screen flex items-center justify-center px-4">
        <div className="text-orange-100 text-2xl animate-pulse">Summoning darkness...</div>
        <style jsx global>{bossCSS}</style>
      </div>
    );
  }
  const hpPercentage = (bossHp / (battleData.boss_max_hp || battleData.boss_hp)) * 100;
  const tapSpeedMultiplier = getTapSpeedMultiplier();

  // --- FULL BATTLE + UPGRADE PANEL ---
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
                <div className="text-2xl">{profileData.profile.profile_icon}</div>
                <div className="text-left">
                  <div className="text-orange-50 font-bold text-sm">{profileData.profile.profile_name}</div>
                  <div className="text-orange-200 text-xs">Level {profileData.profile.total_level}</div>
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
                    <div className="flex justify-between"><span>Boss Level:</span><span className="font-bold">{profileData.stats.bossLevel}</span></div>
                    <div className="flex justify-between"><span>Total Coins:</span><span className="font-bold text-yellow-400">{profileData.stats.totalCoins}</span></div>
                    <div className="flex justify-between"><span>Available:</span><span className="font-bold text-green-400">{availableCoins}</span></div>
                    <div className="flex justify-between"><span>Upgrade Level:</span><span className="font-bold">{profileData.stats.upgradeLevel}</span></div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Header Stats */}
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
                <span className="text-xs opacity-80">{availableCoins} coins</span>
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
            {mode.startsWith("coop") && currentSession && (
              <div className="text-orange-100 text-right">
                <div className="font-bold text-sm mb-1">{currentSession.room_code}</div>
                <div className="text-xs opacity-80">
                  {(currentSession.players?.length || 1)}/5 warriors
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Battle Arena */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="boss-glass-panel p-6 shadow-2xl border border-orange-500/30 text-center relative overflow-hidden boss-arena"
        >
          {/* Flickering ambient lights */}
          <div className="boss-flicker" />
          <div className="boss-flare" />
          {/* Damage Numbers */}
          <AnimatePresence>
            {showDamageNumbers.map((damage) => (
              <motion.div
                key={damage.id}
                initial={{ opacity: 1, y: 0, scale: 1 }}
                animate={{ opacity: 0, y: -80, scale: 1.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className={`absolute text-3xl font-black pointer-events-none z-20 ${damage.isCrit ? "text-yellow-300 drop-shadow-lg" : "text-orange-200"}`}
                style={{
                  left: `calc(50% + ${damage.x}px)`,
                  top: `calc(40% + ${damage.y}px)`,
                  textShadow: damage.isCrit ? "0 0 20px #fbbf24" : "0 0 10px #fb923c",
                }}
              >
                {damage.isCrit && "💥 "}
                {damage.damage}
                {damage.isCrit && " 💥"}
              </motion.div>
            ))}
          </AnimatePresence>
          {/* Boss Emoji */}
          <motion.div
            animate={{ scale: showCelebration ? [1, 1.3, 1] : 1, rotate: showCelebration ? [0, 10, -10, 0] : 0 }}
            transition={{ duration: 0.6 }}
            className="text-7xl mb-4 drop-shadow-2xl"
            style={{ textShadow: "0 0 32px #ef4444, 0 0 64px #7c2d12" }}
          >
            {battleData.boss_emoji}
          </motion.div>
          {/* Health Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-orange-100 mb-2 text-sm">
              <span className="font-bold">Boss HP</span>
              <span>{bossHp} / {battleData.boss_max_hp || battleData.boss_hp}</span>
            </div>
            <div className="w-full boss-hp-bar">
              <motion.div
                initial={{ width: `${hpPercentage}%` }}
                animate={{ width: `${hpPercentage}%` }}
                transition={{ duration: 0.3 }}
                className="boss-hp-bar-inner"
              >
                <div className="boss-hp-bar-glow"></div>
              </motion.div>
            </div>
          </div>
          {/* Strike Button */}
          <div className="relative mb-6">
            <motion.button
              whileHover={{ scale: 1.07 }}
              whileTap={{ scale: 0.94, rotate: [0, -5, 5, 0] }}
              onClick={handleTap}
              className="boss-strike-button"
            >
              <div className="absolute inset-0 boss-strike-gloss"></div>
              <div className="relative z-10 flex flex-col items-center justify-center h-full">
                <motion.div
                  animate={{ scale: [1, 1.15, 1], textShadow: ["0 0 10px #fbbf24", "0 0 24px #fbbf24", "0 0 10px #fbbf24"] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-5xl mb-2"
                >🔥</motion.div>
                <div className="text-lg font-black tracking-wider drop-shadow-lg">STRIKE!</div>
                <div className="text-xs opacity-90 mt-1">{upgradesData?.stats?.tapPower || 1} DMG</div>
              </div>
            </motion.button>
          </div>
          {/* Battle Stats */}
          <div className="text-orange-200 space-y-1 text-sm">
            <div>Strikes: {tapCount} | +{battleData.coins_per_boss} coins per boss</div>
            {tapSpeedMultiplier > 1 && (
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="text-yellow-400 font-bold"
              >🔥 SPEED BONUS: {Math.round((tapSpeedMultiplier - 1) * 100)}% 🔥</motion.div>
            )}
            {upgradesData?.stats?.autoTapperDps > 0 && (
              <div className="text-green-400">⚡ Auto-Strike: {upgradesData.stats.autoTapperDps} DPS</div>
            )}
          </div>
        </motion.div>
        {/* Upgrades Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="boss-glass-panel p-4 shadow-2xl border border-orange-500/30"
        >
          <h3 className="text-xl font-bold text-orange-100 mb-3 text-center">⚔️ UPGRADES ⚔️</h3>
          <div className="grid grid-cols-2 gap-2">
            {/* Tap Power */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => purchaseUpgradeMutation.mutate("tapPower")}
              disabled={availableCoins < upgradesData?.costs?.tapPowerCost || purchaseUpgradeMutation.isLoading}
              className="boss-upgrade-btn boss-upgrade-red"
            >
              <div className="flex items-center justify-between mb-1"><Zap size={16} className="text-yellow-400" /><div className="text-xs font-bold text-yellow-400">{upgradesData?.costs?.tapPowerCost || 0}</div></div>
              <div className="text-xs font-bold">Tap Power</div>
              <div className="text-xs opacity-80">Lv.{upgradesData?.upgrades?.tap_power_level || 1}</div>
              <div className="text-xs opacity-70">{upgradesData?.stats?.tapPower || 1} DMG</div>
            </motion.button>
            {/* Auto Tapper */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => purchaseUpgradeMutation.mutate("autoTapper")}
              disabled={availableCoins < upgradesData?.costs?.autoTapperCost || purchaseUpgradeMutation.isLoading}
              className="boss-upgrade-btn boss-upgrade-green"
            >
              <div className="flex items-center justify-between mb-1"><Settings size={16} className="text-green-400" /><div className="text-xs font-bold text-yellow-400">{upgradesData?.costs?.autoTapperCost || 0}</div></div>
              <div className="text-xs font-bold">Auto Tapper</div>
              <div className="text-xs opacity-80">Lv.{upgradesData?.upgrades?.auto_tapper_level || 0}</div>
              <div className="text-xs opacity-70">{upgradesData?.stats?.autoTapperDps || 0} DPS</div>
            </motion.button>
            {/* Crit Chance */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => purchaseUpgradeMutation.mutate("critChance")}
              disabled={availableCoins < upgradesData?.costs?.critChanceCost || purchaseUpgradeMutation.isLoading || upgradesData?.stats?.critChance >= 100}
              className="boss-upgrade-btn boss-upgrade-purple"
            >
              <div className="flex items-center justify-between mb-1"><Target size={16} className="text-purple-400" /><div className="text-xs font-bold text-yellow-400">{upgradesData?.costs?.critChanceCost || 0}</div></div>
              <div className="text-xs font-bold">Crit Chance</div>
              <div className="text-xs opacity-80">Lv.{upgradesData?.upgrades?.crit_chance_upgrades || 0}</div>
              <div className="text-xs opacity-70">{upgradesData?.stats?.critChance || 0}%</div>
            </motion.button>
            {/* Tap Speed Bonus */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => purchaseUpgradeMutation.mutate("tapSpeedBonus")}
              disabled={availableCoins < upgradesData?.costs?.tapSpeedBonusCost || purchaseUpgradeMutation.isLoading}
              className="boss-upgrade-btn boss-upgrade-yellow"
            >
              <div className="flex items-center justify-between mb-1"><Clock size={16} className="text-yellow-400" /><div className="text-xs font-bold text-yellow-400">{upgradesData?.costs?.tapSpeedBonusCost || 0}</div></div>
              <div className="text-xs font-bold">Speed Bonus</div>
              <div className="text-xs opacity-80">Lv.{upgradesData?.upgrades?.tap_speed_bonus_upgrades || 0}</div>
              <div className="text-xs opacity-70">+{upgradesData?.stats?.tapSpeedBonus || 0}%</div>
            </motion.button>
          </div>
        </motion.div>
        {/* Celebration Animation */}
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
                🔥 BOSS INCINERATED! 🔥<div className="text-lg mt-2">Level Up!</div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Back Button */}
        <div className="text-center pt-2">
          <button
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["boss-profile"] });
              queryClient.invalidateQueries({ queryKey: ["boss-upgrades"] });
              queryClient.invalidateQueries({ queryKey: ["boss-solo-progress"] });
              setMode(""); setCurrentSession(null); setBossHp(100); setTapCount(0); setShowProfileDropdown(false); setLocalBattleData(null);
            }}
            className="text-orange-300 hover:text-orange-100 transition-colors text-sm"
          >← Back to menu</button>
        </div>
      </div>
      <style jsx global>{bossCSS}</style>
    </div>
  );
}

// --- GLOSSY DARK iOS/ARENA THEME ---
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
  0% { opacity: 0.92; filter: blur(1px);}
  11% { opacity: 0.7;}
  22% { opacity: 0.88;}
  42% { opacity: 0.6;}
  62% { opacity: 1;}
  73% { opacity: 0.74;}
  100% { opacity: 0.88; filter: blur(2px);}
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
  0% { opacity: 0.11; }
  51% { opacity: 0.20;}
  100% { opacity: 0.13; }
}
.boss-hp-bar {
  width: 100%;
  height: 18px;
  background: linear-gradient(90deg, #18151e 0%, #27191c 100%);
  border-radius: 9px;
  border: 1.5px solid #e6a34455;
  overflow: hidden;
  box-shadow: 0 2px 12px #6d260466, 0 0.5px 1.5px #ed8033a8 inset;
}
.boss-hp-bar-inner {
  background: linear-gradient(92deg, #ff4747 5%, #ffaf38 90%);
  height: 100%;
  border-radius: 9px 8px 8px 9px;
  box-shadow: 0 0 18px #fb923c55, 0 0 12px #dc2626aa inset;
  position: relative;
  transition: width .27s;
}
.boss-hp-bar-glow {
  position: absolute;
  inset: 0;
  border-radius: 9px;
  background: linear-gradient(91deg, #fbbf2496 40%, #fdba7488 90%, transparent 100%);
  opacity: .38;
  filter: blur(2.7px);
  pointer-events: none;
}
.boss-strike-button {
  width: 11rem; height: 11rem;
  background: radial-gradient(ellipse at 70% 18%, #fffae5 7%, #ff6d00e0 49%, #6d1500 100%);
  border-radius: 100vw;
  border: 4px solid #ffe18b55;
  box-shadow: 0 0 40px #fb923caa, 0 0 90px #7c2d12, 0 4px 18px #000c;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  user-select: none;
  outline: none;
  transition: box-shadow 0.2s;
}
.boss-strike-gloss {
  position: absolute; top:0; left:0; right:0; bottom:0; z-index:2;
  background: linear-gradient(170deg, rgba(255,255,255,0.19) 15%, rgba(251,191,36,0.10) 49%, rgba(0,0,0,0.13) 70%);
  pointer-events: none;
  mix-blend-mode: lighten;
}
.boss-button-solo {
  width: 100%;
  background: linear-gradient(91deg, #9a3412 2%, #ef4444 97%);
  color: #fff;
  border-radius: 2rem;
  padding: 1.5rem;
  font-weight: 700;
  box-shadow: 0 8px 24px #7c2d12aa, 0 2px 12px #1111;
  border: 1.5px solid #fbbf2440;
  backdrop-filter: blur(4px);
  transition: box-shadow .2s, border .2s;
}
.boss-button-coop {
  width: 100%;
  background: linear-gradient(95deg, #ef4444 2%, #f59e42 97%);
  color: #fff;
  border-radius: 2rem;
  padding: 1.5rem;
  font-weight: 700;
  box-shadow: 0 8px 24px #f59e4299, 0 2px 12px #1111;
  border: 1.5px solid #fbbf2440;
  backdrop-filter: blur(4px);
  transition: box-shadow .2s, border .2s;
}
.boss-button-join {
  width: 100%;
  background: linear-gradient(92deg, #b91c1c 2%, #ef4444 49%, #fb7185 97%);
  color: #fff;
  border-radius: 2rem;
  padding: 1.5rem;
  font-weight: 700;
  box-shadow: 0 8px 24px #b91c1c99, 0 2px 12px #1111;
  border: 1.5px solid #fbbf2440;
  backdrop-filter: blur(4px);
  transition: box-shadow .2s, border .2s;
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
  margin-bottom: .5rem;
}
.boss-upgrade-btn {
  border-radius: 1rem;
  font-weight: 700;
  padding: 0.8rem 1rem;
  box-shadow: 0 2px 8px #0d070b44;
  border: 1.5px solid #fff1;
  background: linear-gradient(120deg, #231b21cc 70%, #391a15cc 100%);
  color: #fff;
  transition: background .2s, box-shadow .2s, border .2s;
  user-select: none;
}
.boss-upgrade-red { background: linear-gradient(92deg, #b91c1c 60%, #ef4444 100%);}
.boss-upgrade-green { background: linear-gradient(92deg, #166534 60%, #22d3ee 100%);}
.boss-upgrade-purple { background: linear-gradient(91deg, #a21caf 60%, #ec4899 100%);}
.boss-upgrade-yellow { background: linear-gradient(92deg, #f59e42 60%, #fbbf24 100%);}
.flicker { animation: flicker-text 2.2s infinite alternate; }
@keyframes flicker-text {
  0%, 19% { filter: brightness(0.97); text-shadow: 0 0 24px #fbbf24, 0 0 80px #d97706; }
  23%, 31% { filter: brightness(1.03); }
  47% { filter: brightness(1.1); }
  51%, 62% { filter: brightness(0.85); }
  89% { filter: brightness(1.11);}
  100% { filter: brightness(1); }
}
.shadow-3xl { box-shadow: 0 35px 60px -12px rgba(0,0,0,0.36);}
`;
// END FILE
