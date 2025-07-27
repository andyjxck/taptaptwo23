"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  User,
  Code,
  Play,
  Crown,
  Timer,
  Coins,
  Zap,
  Target,
  Clock,
  Flame,
  ChevronDown,
  Settings,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function BossModePage() {
  const [mode, setMode] = useState(""); // 'solo', 'coop-create', 'coop-join'
  const [roomCode, setRoomCode] = useState("");
  const [currentSession, setCurrentSession] = useState(null);
  const [bossHp, setBossHp] = useState(100);
  const [tapCount, setTapCount] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [lastTapTimes, setLastTapTimes] = useState([]);
  const [showDamageNumbers, setShowDamageNumbers] = useState([]);
  const [localBattleData, setLocalBattleData] = useState(null); // Local battle data state
  const autoTapperRef = useRef(null);

  const queryClient = useQueryClient();

  // Profile query
  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await fetch("/api/boss/profile?userId=demo_user");
      if (!response.ok) throw new Error("Failed to fetch profile");
      return response.json();
    },
  });

  // Upgrades query
  const { data: upgradesData, isLoading: upgradesLoading } = useQuery({
    queryKey: ["upgrades"],
    queryFn: async () => {
      const response = await fetch("/api/boss/upgrades?userId=demo_user");
      if (!response.ok) throw new Error("Failed to fetch upgrades");
      return response.json();
    },
    refetchInterval: 5000, // Refresh for auto-tapper
  });

  // Solo mode queries and mutations
  const { data: soloProgress, isLoading: soloLoading } = useQuery({
    queryKey: ["solo-progress"],
    queryFn: async () => {
      const response = await fetch("/api/boss/solo/progress?userId=demo_user");
      if (!response.ok) throw new Error("Failed to fetch progress");
      return response.json();
    },
    enabled: mode === "solo",
    refetchInterval: 30000,
  });

  // Purchase upgrade mutation
  const purchaseUpgradeMutation = useMutation({
    mutationFn: async (upgradeType) => {
      const response = await fetch("/api/boss/upgrades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "demo_user", upgradeType }),
      });
      if (!response.ok) throw new Error("Failed to purchase upgrade");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upgrades"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["solo-progress"] });
    },
  });

  const soloTapMutation = useMutation({
    mutationFn: async (isAutoTap = false) => {
      const response = await fetch("/api/boss/solo/tap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "demo_user", isAutoTap }),
      });
      if (!response.ok) throw new Error("Failed to process tap");
      return response.json();
    },
    onSuccess: (data) => {
      // Update HP from backend response
      if (data.current_boss_hp !== undefined) {
        setBossHp(data.current_boss_hp);
      }

      if (data.boss_defeated) {
        setShowCelebration(true);
        setBossHp(data.current_boss_hp);

        // Immediately update local battle data for instant boss change
        setLocalBattleData((prev) => ({
          ...(prev || soloProgress),
          current_level: data.new_level,
          boss_hp: data.current_boss_hp,
          boss_max_hp: data.boss_max_hp,
          boss_emoji: data.boss_emoji,
          total_coins_earned: data.total_coins,
          coins_per_boss: Math.floor(500 * Math.pow(1.15, data.new_level - 1)),
        }));

        // Update query cache
        queryClient.setQueryData(["solo-progress"], (oldData) => ({
          ...oldData,
          current_level: data.new_level,
          boss_hp: data.current_boss_hp,
          boss_max_hp: data.boss_max_hp,
          boss_emoji: data.boss_emoji,
          total_coins_earned: data.total_coins,
        }));

        queryClient.invalidateQueries({ queryKey: ["solo-progress"] });
        queryClient.invalidateQueries({ queryKey: ["upgrades"] });
        queryClient.invalidateQueries({ queryKey: ["profile"] });
        setTimeout(() => setShowCelebration(false), 2000);
      }

      // Show damage number (but not for auto-taps to avoid spam)
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

  // Co-op mutations
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/boss/coop/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "demo_user" }),
      });
      if (!response.ok) throw new Error("Failed to create session");
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentSession(data.session);
      setBossHp(data.session.current_boss_hp);
    },
  });

  const joinSessionMutation = useMutation({
    mutationFn: async (code) => {
      const response = await fetch("/api/boss/coop/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode: code, userId: "demo_user" }),
      });
      if (!response.ok) throw new Error("Failed to join session");
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentSession(data.session);
      setBossHp(data.session.current_boss_hp);
    },
  });

  const coopTapMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/boss/coop/tap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomCode: currentSession.room_code,
          userId: "demo_user",
          damage: upgradesData?.stats?.tapPower || 1,
        }),
      });
      if (!response.ok) throw new Error("Failed to process tap");
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentSession(data.session);
      setBossHp(data.session.current_boss_hp);
      if (data.boss_defeated) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 2000);
      }
    },
  });

  // Auto-tapper effect - let backend handle all calculations
  useEffect(() => {
    if (mode === "solo" && upgradesData?.stats?.autoTapperDps > 0) {
      autoTapperRef.current = setInterval(() => {
        // Let backend handle auto-tapper damage calculations
        soloTapMutation.mutate(true); // true = isAutoTap
      }, 1000);
    }

    return () => {
      if (autoTapperRef.current) {
        clearInterval(autoTapperRef.current);
      }
    };
  }, [mode, upgradesData?.stats?.autoTapperDps, soloTapMutation]);

  // Calculate tap speed bonus
  const getTapSpeedMultiplier = useCallback(() => {
    if (!upgradesData?.stats?.tapSpeedBonus) return 1;

    const now = Date.now();
    const recentTaps = lastTapTimes.filter((time) => now - time < 1000).length;

    if (recentTaps >= 3) {
      return 1 + upgradesData.stats.tapSpeedBonus / 100;
    }
    return 1;
  }, [lastTapTimes, upgradesData?.stats?.tapSpeedBonus]);

  // Handle tapping - let backend handle all calculations
  const handleTap = useCallback(() => {
    const now = Date.now();
    setLastTapTimes((prev) => [...prev.slice(-10), now]); // Keep last 10 taps for UI feedback
    setTapCount((prev) => prev + 1);

    if (mode === "solo" && soloProgress) {
      // Let backend handle all damage calculations and HP tracking
      soloTapMutation.mutate();
    } else if (mode.startsWith("coop") && currentSession) {
      coopTapMutation.mutate();
    }
  }, [mode, soloProgress, currentSession, soloTapMutation, coopTapMutation]);

  // Initialize local battle data when solo progress loads
  useEffect(() => {
    if (mode === "solo" && soloProgress && !localBattleData) {
      setLocalBattleData(soloProgress);
    }
  }, [mode, soloProgress, localBattleData]);

  // Initialize boss HP when battle data loads
  useEffect(() => {
    const battleData =
      mode === "solo" ? localBattleData || soloProgress : currentSession;
    if (mode === "solo" && battleData && bossHp === 100) {
      setBossHp(battleData.boss_hp);
    }
  }, [mode, localBattleData, soloProgress, currentSession, bossHp]);

  // Co-op session sync
  useQuery({
    queryKey: ["coop-session", currentSession?.room_code],
    queryFn: async () => {
      const response = await fetch(
        `/api/boss/coop/tap?roomCode=${currentSession.room_code}&userId=demo_user`,
      );
      if (!response.ok) throw new Error("Failed to sync session");
      return response.json();
    },
    enabled: mode.startsWith("coop") && !!currentSession,
    refetchInterval: 1000,
    onSuccess: (data) => {
      setCurrentSession(data.session);
      setBossHp(data.session.current_boss_hp);
    },
  });

  // Get time until next weekly reset
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

  // Get available coins
  const availableCoins = profileData?.stats?.availableCoins || 0;

  if (!mode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-orange-900 to-black p-4 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Profile Header */}
          {profileData && (
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="w-full backdrop-blur-xl bg-gradient-to-r from-orange-500/20 to-red-600/20 rounded-2xl p-3 shadow-2xl border border-orange-500/30 flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <div className="text-2xl">
                    {profileData.profile.profile_icon}
                  </div>
                  <div className="text-left">
                    <div className="text-orange-100 font-bold text-sm">
                      {profileData.profile.profile_name}
                    </div>
                    <div className="text-orange-300 text-xs">
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
                    className="absolute top-full left-0 right-0 mt-2 backdrop-blur-xl bg-gradient-to-r from-orange-500/20 to-red-600/20 rounded-2xl p-4 shadow-2xl border border-orange-500/30 z-50"
                  >
                    <div className="space-y-2 text-orange-100 text-sm">
                      <div className="flex justify-between">
                        <span>Boss Level:</span>
                        <span className="font-bold">
                          {profileData.stats.bossLevel}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Coins:</span>
                        <span className="font-bold text-yellow-400">
                          {profileData.stats.totalCoins}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Available:</span>
                        <span className="font-bold text-green-400">
                          {availableCoins}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Upgrade Level:</span>
                        <span className="font-bold">
                          {profileData.stats.upgradeLevel}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Glassmorphic Panel */}
          <div className="backdrop-blur-xl bg-gradient-to-br from-orange-500/20 to-red-600/20 rounded-3xl p-8 shadow-2xl border border-orange-500/30">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-orange-100 mb-2">
                🔥 INFERNO BOSS 🔥
              </h1>
              <p className="text-orange-300 text-lg">
                Choose your battle destiny
              </p>
            </div>

            <div className="space-y-4">
              {/* Solo Mode Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setMode("solo")}
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-2xl p-6 shadow-lg border border-orange-400/30 backdrop-blur-sm hover:shadow-xl transition-all duration-200"
              >
                <div className="flex items-center justify-center space-x-3">
                  <Flame size={28} />
                  <div className="text-left">
                    <div className="text-xl font-bold">Solo Inferno</div>
                    <div className="text-sm opacity-90">
                      Face the flames alone
                    </div>
                  </div>
                </div>
              </motion.button>

              {/* Co-op Mode Buttons */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setMode("coop-create")}
                className="w-full bg-gradient-to-r from-orange-600 to-yellow-600 text-white rounded-2xl p-6 shadow-lg border border-orange-400/30 backdrop-blur-sm hover:shadow-xl transition-all duration-200"
              >
                <div className="flex items-center justify-center space-x-3">
                  <Users size={28} />
                  <div className="text-left">
                    <div className="text-xl font-bold">Forge Alliance</div>
                    <div className="text-sm opacity-90">
                      Create a 5-player raid
                    </div>
                  </div>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setMode("coop-join")}
                className="w-full bg-gradient-to-r from-yellow-600 to-red-600 text-white rounded-2xl p-6 shadow-lg border border-orange-400/30 backdrop-blur-sm hover:shadow-xl transition-all duration-200"
              >
                <div className="flex items-center justify-center space-x-3">
                  <Code size={28} />
                  <div className="text-left">
                    <div className="text-xl font-bold">Join Alliance</div>
                    <div className="text-sm opacity-90">
                      Enter the battle code
                    </div>
                  </div>
                </div>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (mode === "coop-create" && !currentSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-orange-900 to-black p-4 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="backdrop-blur-xl bg-gradient-to-br from-orange-500/20 to-red-600/20 rounded-3xl p-8 shadow-2xl border border-orange-500/30">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-orange-100 mb-2">
                Forge Alliance
              </h2>
              <p className="text-orange-300">Summon your raid party</p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => createSessionMutation.mutate()}
              disabled={createSessionMutation.isLoading}
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-2xl p-6 shadow-lg border border-orange-400/30 backdrop-blur-sm hover:shadow-xl transition-all duration-200 disabled:opacity-50"
            >
              <div className="flex items-center justify-center space-x-3">
                <Flame size={24} />
                <span className="text-xl font-bold">
                  {createSessionMutation.isLoading
                    ? "Forging..."
                    : "Create Alliance"}
                </span>
              </div>
            </motion.button>

            <button
              onClick={() => setMode("")}
              className="w-full mt-4 text-orange-300 hover:text-orange-100 transition-colors"
            >
              ← Back to menu
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (mode === "coop-join" && !currentSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black p-4 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="backdrop-blur-xl bg-gradient-to-br from-orange-500/20 to-red-600/20 rounded-3xl p-8 shadow-2xl border border-orange-500/30">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-orange-100 mb-2">
                Join Alliance
              </h2>
              <p className="text-orange-300">Enter the battle code</p>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Enter battle code"
                className="w-full px-6 py-4 rounded-2xl bg-black/40 backdrop-blur-sm border border-orange-500/50 text-orange-100 placeholder-orange-400/60 text-xl font-bold text-center tracking-wider focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                maxLength={6}
              />

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => joinSessionMutation.mutate(roomCode)}
                disabled={!roomCode || joinSessionMutation.isLoading}
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-2xl p-6 shadow-lg border border-orange-400/30 backdrop-blur-sm hover:shadow-xl transition-all duration-200 disabled:opacity-50"
              >
                <div className="flex items-center justify-center space-x-3">
                  <Users size={24} />
                  <span className="text-xl font-bold">
                    {joinSessionMutation.isLoading
                      ? "Joining..."
                      : "Join Alliance"}
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
            >
              ← Back to menu
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Battle Screen (Solo or Co-op)
  const battleData =
    mode === "solo" ? localBattleData || soloProgress : currentSession;
  const isLoading = mode === "solo" ? soloLoading : false;

  if (isLoading || !battleData || upgradesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black p-4 flex items-center justify-center">
        <div className="text-orange-100 text-2xl">Loading inferno...</div>
      </div>
    );
  }

  const hpPercentage =
    (bossHp / (battleData.boss_max_hp || battleData.boss_hp)) * 100;
  const tapSpeedMultiplier = getTapSpeedMultiplier();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Profile Header - Also shown during battle */}
        {profileData && (
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="w-full backdrop-blur-xl bg-gradient-to-r from-orange-500/20 to-red-600/20 rounded-2xl p-3 shadow-2xl border border-orange-500/30 flex items-center justify-between"
            >
              <div className="flex items-center space-x-2">
                <div className="text-2xl">
                  {profileData.profile.profile_icon}
                </div>
                <div className="text-left">
                  <div className="text-orange-100 font-bold text-sm">
                    {profileData.profile.profile_name}
                  </div>
                  <div className="text-orange-300 text-xs">
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
                  className="absolute top-full left-0 right-0 mt-2 backdrop-blur-xl bg-gradient-to-r from-orange-500/20 to-red-600/20 rounded-2xl p-4 shadow-2xl border border-orange-500/30 z-50"
                >
                  <div className="space-y-2 text-orange-100 text-sm">
                    <div className="flex justify-between">
                      <span>Boss Level:</span>
                      <span className="font-bold">
                        {profileData.stats.bossLevel}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Coins:</span>
                      <span className="font-bold text-yellow-400">
                        {profileData.stats.totalCoins}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Available:</span>
                      <span className="font-bold text-green-400">
                        {availableCoins}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Upgrade Level:</span>
                      <span className="font-bold">
                        {profileData.stats.upgradeLevel}
                      </span>
                    </div>
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
          className="backdrop-blur-xl bg-gradient-to-r from-orange-500/20 to-red-600/20 rounded-2xl p-4 shadow-2xl border border-orange-500/30"
        >
          <div className="flex justify-between items-center text-sm">
            <div className="text-orange-100">
              <div className="flex items-center space-x-1 mb-1">
                <Crown size={16} className="text-yellow-400" />
                <span className="font-bold">
                  Level{" "}
                  {battleData.current_level || battleData.current_boss_level}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <Coins size={14} className="text-yellow-400" />
                <span className="text-xs opacity-80">
                  {availableCoins} coins
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

            {mode.startsWith("coop") && currentSession && (
              <div className="text-orange-100 text-right">
                <div className="font-bold text-sm mb-1">
                  {currentSession.room_code}
                </div>
                <div className="text-xs opacity-80">
                  {
                    [
                      currentSession.player1_id,
                      currentSession.player2_id,
                      currentSession.player3_id,
                      currentSession.player4_id,
                      currentSession.player5_id,
                    ].filter(Boolean).length
                  }
                  /5 warriors
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Battle Arena */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="backdrop-blur-xl bg-gradient-to-br from-orange-500/20 to-red-600/20 rounded-3xl p-6 shadow-2xl border border-orange-500/30 text-center relative overflow-hidden"
        >
          {/* Damage Numbers */}
          <AnimatePresence>
            {showDamageNumbers.map((damage) => (
              <motion.div
                key={damage.id}
                initial={{ opacity: 1, y: 0, scale: 1 }}
                animate={{ opacity: 0, y: -80, scale: 1.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className={`absolute text-3xl font-black pointer-events-none z-20 ${
                  damage.isCrit
                    ? "text-yellow-300 drop-shadow-lg"
                    : "text-orange-200"
                }`}
                style={{
                  left: `calc(50% + ${damage.x}px)`,
                  top: `calc(40% + ${damage.y}px)`,
                  textShadow: damage.isCrit
                    ? "0 0 20px #fbbf24"
                    : "0 0 10px #fb923c",
                }}
              >
                {damage.isCrit && "💥 "}
                {damage.damage}
                {damage.isCrit && " 💥"}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Boss */}
          <motion.div
            animate={{
              scale: showCelebration ? [1, 1.3, 1] : 1,
              rotate: showCelebration ? [0, 10, -10, 0] : 0,
            }}
            transition={{ duration: 0.6 }}
            className="text-7xl mb-4 drop-shadow-2xl"
          >
            {battleData.boss_emoji}
          </motion.div>

          {/* Health Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-orange-100 mb-2 text-sm">
              <span className="font-bold">Boss HP</span>
              <span>
                {bossHp} / {battleData.boss_max_hp || battleData.boss_hp}
              </span>
            </div>
            <div className="w-full bg-black/50 rounded-full h-4 backdrop-blur-sm border border-orange-500/50 overflow-hidden">
              <motion.div
                initial={{ width: `${hpPercentage}%` }}
                animate={{ width: `${hpPercentage}%` }}
                transition={{ duration: 0.3 }}
                className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 h-full rounded-full shadow-lg relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
              </motion.div>
            </div>
          </div>

          {/* Epic Strike Button */}
          <div className="relative mb-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{
                scale: 0.9,
                rotate: [0, -5, 5, 0],
              }}
              onClick={handleTap}
              className="relative w-48 h-48 mx-auto bg-gradient-to-br from-orange-400 via-red-500 to-red-700 rounded-full shadow-2xl border-4 border-yellow-400/60 backdrop-blur-sm transition-all duration-200 text-white font-black text-xl overflow-hidden group"
              style={{
                boxShadow:
                  "0 0 40px rgba(251, 146, 60, 0.6), inset 0 0 40px rgba(255, 255, 255, 0.1)",
              }}
            >
              {/* Inner glow effect */}
              <div className="absolute inset-2 bg-gradient-to-br from-yellow-300/30 to-transparent rounded-full"></div>

              {/* Animated ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-2 border-dashed border-yellow-300/40"
              ></motion.div>

              {/* Pulse effect */}
              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-gradient-to-br from-orange-400/30 to-red-600/30 rounded-full"
              ></motion.div>

              {/* Button content */}
              <div className="relative z-10 flex flex-col items-center justify-center h-full">
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    textShadow: [
                      "0 0 10px #fbbf24",
                      "0 0 20px #fbbf24",
                      "0 0 10px #fbbf24",
                    ],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-4xl mb-2"
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

              {/* Tap effect particles */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0 }}
              >
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                    style={{
                      left: "50%",
                      top: "50%",
                      transform: `rotate(${i * 45}deg) translateY(-60px)`,
                    }}
                  />
                ))}
              </motion.div>
            </motion.button>
          </div>

          {/* Battle Stats */}
          <div className="text-orange-200 space-y-1 text-sm">
            <div>
              Strikes: {tapCount} | +{battleData.coins_per_boss} coins per boss
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
                ⚡ Auto-Strike: {upgradesData.stats.autoTapperDps} DPS
              </div>
            )}
          </div>
        </motion.div>

        {/* Upgrades Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-xl bg-gradient-to-br from-orange-500/20 to-red-600/20 rounded-3xl p-4 shadow-2xl border border-orange-500/30"
        >
          <h3 className="text-xl font-bold text-orange-100 mb-3 text-center">
            ⚔️ UPGRADES ⚔️
          </h3>

          <div className="grid grid-cols-2 gap-2">
            {/* Tap Power */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => purchaseUpgradeMutation.mutate("tapPower")}
              disabled={
                availableCoins < upgradesData?.costs?.tapPowerCost ||
                purchaseUpgradeMutation.isLoading
              }
              className="bg-gradient-to-r from-red-600/80 to-orange-600/80 text-white rounded-xl p-3 shadow-lg border border-orange-400/30 backdrop-blur-sm hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-between mb-1">
                <Zap size={16} className="text-yellow-400" />
                <div className="text-xs font-bold text-yellow-400">
                  {upgradesData?.costs?.tapPowerCost || 0}
                </div>
              </div>
              <div className="text-xs font-bold">Tap Power</div>
              <div className="text-xs opacity-80">
                Lv.{upgradesData?.upgrades?.tap_power_level || 1}
              </div>
              <div className="text-xs opacity-70">
                {upgradesData?.stats?.tapPower || 1} DMG
              </div>
            </motion.button>

            {/* Auto Tapper */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => purchaseUpgradeMutation.mutate("autoTapper")}
              disabled={
                availableCoins < upgradesData?.costs?.autoTapperCost ||
                purchaseUpgradeMutation.isLoading
              }
              className="bg-gradient-to-r from-green-600/80 to-teal-600/80 text-white rounded-xl p-3 shadow-lg border border-orange-400/30 backdrop-blur-sm hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-between mb-1">
                <Settings size={16} className="text-green-400" />
                <div className="text-xs font-bold text-yellow-400">
                  {upgradesData?.costs?.autoTapperCost || 0}
                </div>
              </div>
              <div className="text-xs font-bold">Auto Tapper</div>
              <div className="text-xs opacity-80">
                Lv.{upgradesData?.upgrades?.auto_tapper_level || 0}
              </div>
              <div className="text-xs opacity-70">
                {upgradesData?.stats?.autoTapperDps || 0} DPS
              </div>
            </motion.button>

            {/* Crit Chance */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => purchaseUpgradeMutation.mutate("critChance")}
              disabled={
                availableCoins < upgradesData?.costs?.critChanceCost ||
                purchaseUpgradeMutation.isLoading ||
                upgradesData?.stats?.critChance >= 100
              }
              className="bg-gradient-to-r from-purple-600/80 to-pink-600/80 text-white rounded-xl p-3 shadow-lg border border-orange-400/30 backdrop-blur-sm hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-between mb-1">
                <Target size={16} className="text-purple-400" />
                <div className="text-xs font-bold text-yellow-400">
                  {upgradesData?.costs?.critChanceCost || 0}
                </div>
              </div>
              <div className="text-xs font-bold">Crit Chance</div>
              <div className="text-xs opacity-80">
                Lv.{upgradesData?.upgrades?.crit_chance_level || 0}
              </div>
              <div className="text-xs opacity-70">
                {upgradesData?.stats?.critChance || 0}%
              </div>
            </motion.button>

            {/* Tap Speed Bonus */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => purchaseUpgradeMutation.mutate("tapSpeedBonus")}
              disabled={
                availableCoins < upgradesData?.costs?.tapSpeedBonusCost ||
                purchaseUpgradeMutation.isLoading
              }
              className="bg-gradient-to-r from-yellow-600/80 to-orange-600/80 text-white rounded-xl p-3 shadow-lg border border-orange-400/30 backdrop-blur-sm hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-between mb-1">
                <Clock size={16} className="text-yellow-400" />
                <div className="text-xs font-bold text-yellow-400">
                  {upgradesData?.costs?.tapSpeedBonusCost || 0}
                </div>
              </div>
              <div className="text-xs font-bold">Speed Bonus</div>
              <div className="text-xs opacity-80">
                Lv.{upgradesData?.upgrades?.tap_speed_bonus_level || 0}
              </div>
              <div className="text-xs opacity-70">
                +{upgradesData?.stats?.tapSpeedBonus || 0}%
              </div>
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
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{ duration: 0.8 }}
                className="text-4xl text-orange-100 font-black text-center bg-black/50 backdrop-blur-xl rounded-3xl p-6 border border-orange-500/50"
              >
                🔥 BOSS INCINERATED! 🔥
                <div className="text-lg mt-2">Level Up!</div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Back Button */}
        <div className="text-center pt-2">
          <button
            onClick={() => {
              // Save data when going back to menu
              queryClient.invalidateQueries({ queryKey: ["profile"] });
              queryClient.invalidateQueries({ queryKey: ["upgrades"] });
              queryClient.invalidateQueries({ queryKey: ["solo-progress"] });

              setMode("");
              setCurrentSession(null);
              setBossHp(100);
              setTapCount(0);
              setShowProfileDropdown(false);
              setLocalBattleData(null);
            }}
            className="text-orange-300 hover:text-orange-100 transition-colors text-sm"
          >
            ← Back to menu
          </button>
        </div>
      </div>

      {/* Global Styles for Animations */}
      <style jsx global>{`
        @keyframes confetti {
          0% { transform: translateY(0) rotateZ(0deg); opacity: 1; }
          100% { transform: translateY(-100vh) rotateZ(360deg); opacity: 0; }
        }
        
        .shadow-3xl {
          box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.25);
        }

        @keyframes screenShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
        }

        .screen-shake {
          animation: screenShake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
