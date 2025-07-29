import { supabase } from "@/utilities/supabaseClient";

// --- Helper functions ---
function safe(val) { return (typeof val === "number" && !isNaN(val) ? val : 0); }
function getBossHP(level) { return Math.floor(100 * Math.pow(1.2, level - 1)); }
function getCoinsPerBoss(level) { return Math.floor(500 * Math.pow(1.15, level - 1)); }
function getBossEmoji(level) {
  const emojis = ["👾", "🐲", "🦖", "🐙", "👻", "🤖", "🦈", "🕷️", "🐍", "🦅"];
  return emojis[(level - 1) % emojis.length];
}
function getCoopCoinsPerBoss(level) { return Math.floor(10 * Math.pow(1.15, level - 1)); }
function getNextWeeklyReset() {
  const now = new Date();
  const daysUntilSunday = 7 - now.getDay();
  const nextWeek = new Date(now);
  nextWeek.setDate(now.getDate() + daysUntilSunday);
  nextWeek.setHours(0, 0, 0, 0);
  return nextWeek.toISOString();
}

// --- NEW: Helpers to fetch tap power(s) ---
async function getPlayerTapPower(userId) {
  const { data } = await supabase.from("game_saves").select("tap_power").eq("user_id", userId).single();
  return data?.tap_power || 1;
}
async function getPlayersTotalTapPower(userIds) {
  if (!Array.isArray(userIds) || userIds.length === 0) return 1;
  const { data } = await supabase
    .from("game_saves")
    .select("tap_power, user_id")
    .in("user_id", userIds);
  if (!data || data.length === 0) return 1;
  return data.reduce((sum, row) => sum + (row.tap_power || 1), 0);
}


function generateRoomCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

// --- MAIN HANDLERS ---

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const userId = searchParams.get("userId");
  const roomCode = searchParams.get("roomCode");

  try {
    // --- 1. PROFILE ---
    if (action === "profile") {
      if (!userId) return Response.json({ error: 'userId required' }, { status: 400 });
      // Fetch (or create) game_saves and boss_progress
      let { data: gameSave } = await supabase.from("game_saves").select("*").eq("user_id", userId).single();
      if (!gameSave) {
        const { data } = await supabase.from("game_saves").insert([{
          user_id: userId, profile_name: "Fire Warrior", profile_icon: "🔥",
          tap_power_upgrades: 1, auto_tapper_upgrades: 0, crit_chance_upgrades: 0, tap_speed_bonus_upgrades: 0,
          tap_power: 1, auto_tapper: 0, crit_chance: 0, tap_speed_bonus: 0, coins: 0,
        }]).select().single();
        gameSave = data;
      }
      let { data: bossProgress } = await supabase.from("boss_progress").select("*").eq("user_id", userId).single();
      if (!bossProgress) {
        const { data } = await supabase.from("boss_progress").insert([{
          user_id: userId, current_level: 1, boss_hp: 500, boss_max_hp: 500, boss_emoji: "🔥",
          next_reset: null, total_coins: 0, weekly_best_level: 1, total_level: 1,
        }]).select().single();
        bossProgress = data;
      }
      // Calculate upgrade/total level, coins, etc.
      const upgradeLevel = safe(gameSave.tap_power_upgrades) + safe(gameSave.auto_tapper_upgrades) + safe(gameSave.crit_chance_upgrades) + safe(gameSave.tap_speed_bonus_upgrades);
      const totalLevel = safe(bossProgress.current_level) + upgradeLevel;
      const availableCoins = safe(gameSave.coins);
      if (bossProgress.total_level !== totalLevel) {
        await supabase.from("boss_progress").update({ total_level: totalLevel }).eq("user_id", userId);
      }
      return Response.json({
        profile: {
          user_id: gameSave.user_id,
          profile_name: gameSave.profile_name,
          profile_icon: gameSave.profile_icon,
          total_level: totalLevel,
        },
        stats: {
          bossLevel: bossProgress.current_level,
          totalCoins: bossProgress.total_coins,
          availableCoins,
          upgradeLevel,
          weeklyBest: bossProgress.weekly_best_level,
        },
      });
    }

    // --- 2. UPGRADES ---
    if (action === "upgrades") {
      if (!userId) return Response.json({ error: 'User ID required' }, { status: 400 });
      let { data: gameSave } = await supabase.from("game_saves").select("*").eq("user_id", userId).single();
      if (!gameSave) {
        const { data } = await supabase.from("game_saves").insert([{
          user_id: userId, tap_power_upgrades: 1, auto_tapper_upgrades: 0, crit_chance_upgrades: 0, tap_speed_bonus_upgrades: 0,
          tap_power: 1, auto_tapper: 0, crit_chance: 0, tap_speed_bonus: 0, coins: 0,
        }]).select().single();
        gameSave = data;
      }
      const tapPower = safe(gameSave.tap_power_upgrades);
      const autoTapperDps = safe(gameSave.auto_tapper_upgrades) > 0 ? Math.floor(gameSave.auto_tapper_upgrades * 0.5) : 0;
      const critChance = Math.min(safe(gameSave.crit_chance_upgrades) * 5, 100);
      const tapSpeedBonus = safe(gameSave.tap_speed_bonus_upgrades) * 30;
      const tapPowerCost = Math.floor(10 * Math.pow(1.5, tapPower));
      const autoTapperCost = Math.floor(50 * Math.pow(1.8, safe(gameSave.auto_tapper_upgrades)));
      const critChanceCost = Math.floor(100 * Math.pow(2.0, safe(gameSave.crit_chance_upgrades)));
      const tapSpeedBonusCost = Math.floor(75 * Math.pow(1.7, safe(gameSave.tap_speed_bonus_upgrades)));
      return Response.json({
        upgrades: {
          tap_power_upgrades: tapPower,
          auto_tapper_upgrades: safe(gameSave.auto_tapper_upgrades),
          crit_chance_upgrades: safe(gameSave.crit_chance_upgrades),
          tap_speed_bonus_upgrades: safe(gameSave.tap_speed_bonus_upgrades),
        },
        stats: { tapPower, autoTapperDps, critChance, tapSpeedBonus },
        costs: { tapPowerCost, autoTapperCost, critChanceCost, tapSpeedBonusCost }
      });
    }

    // --- 3. SOLO PROGRESS ---
    if (action === "progress") {
      if (!userId) return Response.json({ error: "User ID required" }, { status: 400 });
      let { data: progress } = await supabase.from("boss_progress").select("*").eq("user_id", userId).single();
          if (!progress) {
        // --- NEW: Scale by tap power
        const tapPower = await getPlayerTapPower(userId);
        const bossHp = 250 * (tapPower || 1);
        const { data } = await supabase.from("boss_progress").insert([{
          user_id: userId, current_level: 1, boss_hp: bossHp, boss_max_hp: bossHp,
          total_coins: 0, weekly_best_level: 1, last_reset_date: new Date().toISOString(),
        }]).select().single();
        progress = data;
      }

          if (progress.boss_hp === null) {
        // --- NEW: Scale by tap power
        const tapPower = await getPlayerTapPower(userId);
        const bossHp = 250 * (tapPower || 1);
        await supabase.from("boss_progress").update({ boss_hp: bossHp, boss_max_hp: bossHp }).eq("user_id", userId);
        progress.boss_hp = bossHp; progress.boss_max_hp = bossHp;
      }

      const bossMaxHp = getBossHP(progress.current_level);
      const coinsPerBoss = getCoinsPerBoss(progress.current_level);
      const bossEmoji = getBossEmoji(progress.current_level);
      const nextReset = getNextWeeklyReset();
      return Response.json({
        success: true,
        current_level: progress.current_level,
        boss_hp: progress.boss_hp,
        boss_max_hp: bossMaxHp,
        boss_emoji: bossEmoji,
        total_coins: progress.total_coins,
        weekly_best_level: progress.weekly_best_level,
        coins_per_boss: coinsPerBoss,
        next_reset: nextReset,
        last_reset_date: progress.last_reset_date,
      });
    }

    // --- 4. CO-OP SESSION GET (sync state) ---
    if (action === "coop_session") {
      if (!roomCode) return Response.json({ error: 'Room code is required' }, { status: 400 });
      if (!userId) return Response.json({ error: 'User ID is required' }, { status: 400 });
      const { data: sessions } = await supabase.from("boss_coop_sessions").select("*")
        .eq("room_code", roomCode.toUpperCase()).eq("is_active", true);
      if (!sessions || sessions.length === 0) return Response.json({ error: 'Session not found' }, { status: 404 });
      const sessionData = sessions[0];
      const players = Array.isArray(sessionData.players) ? sessionData.players : [];
      if (!players.includes(userId)) return Response.json({ error: 'User not in this session' }, { status: 403 });
      return Response.json({
        success: true,
        session: {
          ...sessionData,
          boss_emoji: getBossEmoji(sessionData.boss_level),
          coins_per_boss: getCoopCoinsPerBoss(sessionData.boss_level)
        }
      });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message || "Unknown error" }, { status: 500 });
  }
}

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { body = {}; }
  const action = body.action;

  try {
    // --- 1. UPDATE PROFILE ---
    if (action === "update_profile") {
      const { userId, profileName, profileIcon } = body;
      if (!userId) return Response.json({ error: 'userId required' }, { status: 400 });
      const updates = {};
      if (profileName) updates.profile_name = profileName;
      if (profileIcon) updates.profile_icon = profileIcon;
      if (Object.keys(updates).length === 0) return Response.json({ error: 'No update fields' }, { status: 400 });
      const { data, error } = await supabase.from("game_saves").update(updates).eq("user_id", userId).select().single();
      if (error) return Response.json({ error: 'Failed to update profile' }, { status: 500 });
      return Response.json({ success: true, profile: data });
    }

    // --- 2. BUY UPGRADE ---
    if (action === "upgrade") {
      const { userId, upgradeType } = body;
      if (!userId || !upgradeType) return Response.json({ error: 'User ID and upgrade type required' }, { status: 400 });
      const { data: gameSave } = await supabase.from("game_saves").select("*").eq("user_id", userId).single();
      const { data: progress } = await supabase.from("boss_progress").select("total_coins").eq("user_id", userId).single();
      if (!gameSave || !progress) return Response.json({ error: 'User data not found' }, { status: 404 });
      let cost = 0, updateField = '', currentLevel = 0;
      switch (upgradeType) {
  case 'tapPower':
    currentLevel = safe(gameSave.tap_power_upgrades);
    cost = Math.floor(20 * Math.pow(1.07, currentLevel));
    updateField = 'tap_power_upgrades';
    break;

  case 'autoTapper':
    currentLevel = safe(gameSave.auto_tapper_upgrades);
    cost = Math.floor(500 * Math.pow(1.06, currentLevel));
    updateField = 'auto_tapper_upgrades';
    break;

  case 'critChance':
    currentLevel = safe(gameSave.crit_chance_upgrades);
    if (currentLevel >= 100) {
      return Response.json({ error: 'Maximum crit chance reached' }, { status: 400 });
    }
    cost = currentLevel < 84
      ? Math.floor(40 * Math.pow(1.06, currentLevel))
      : Math.floor(40 * Math.pow(1.06, 84) * Math.pow(1.09, currentLevel - 84));
    updateField = 'crit_chance_upgrades';
    break;

  case 'tapSpeedBonus':
    currentLevel = safe(gameSave.tap_speed_bonus_upgrades);
    cost = currentLevel < 69
      ? Math.floor(80 * Math.pow(1.07, currentLevel))
      : Math.floor(80 * Math.pow(1.07, 69) * Math.pow(1.1, currentLevel - 69));
    updateField = 'tap_speed_bonus_upgrades';
    break;

  default:
    return Response.json({ error: 'Invalid upgrade type' }, { status: 400 });

      }
      if (progress.total_coins < cost) return Response.json({ error: 'Insufficient coins' }, { status: 400 });
      const { error: updateUpgradeErr } = await supabase.from("game_saves").update({ [updateField]: currentLevel + 1 }).eq("user_id", userId);
      const { error: updateCoinsErr } = await supabase.from("boss_progress").update({ total_coins: progress.total_coins - cost }).eq("user_id", userId);
      if (updateUpgradeErr || updateCoinsErr) return Response.json({ error: 'Failed to purchase upgrade' }, { status: 500 });
      const { data: updatedGameSave } = await supabase.from("game_saves").select("*").eq("user_id", userId).single();
      return Response.json({ success: true, upgrades: updatedGameSave, costPaid: cost, remainingCoins: progress.total_coins - cost });
    }

 // --- 3. SOLO BOSS TAP ---
if (action === "solo_tap") {
  const { userId, isAutoTap = false } = body;
  if (!userId) return Response.json({ error: "User ID required" }, { status: 400 });

  let { data: progress } = await supabase.from("boss_progress").select("*").eq("user_id", userId).single();
  if (!progress) return Response.json({ error: "User progress not found" }, { status: 404 });

  // --- PREVENT FREE COIN EXPLOIT ---
  if (progress.boss_hp <= 0) {
    return Response.json({
      success: false,
      error: "Boss already defeated. Please reload.",
      current_boss_hp: progress.boss_hp,
      needs_reload: true,
    }, { status: 409 });
  }

  let { data: gameSave } = await supabase.from("game_saves").select("*").eq("user_id", userId).single();
  if (!gameSave) return Response.json({ error: "Upgrades not found" }, { status: 404 });

  const currentLevel = progress.current_level;
  const bossMaxHp = getBossHP(currentLevel);
  let currentBossHp = progress.boss_hp ?? bossMaxHp;

  // Determine tap damage and crit
  let actualDamage, isCrit = false;
  if (isAutoTap) {
    actualDamage = gameSave.auto_tapper || 0;
  } else {
    actualDamage = gameSave.tap_power || 1;
    const critChance = Math.min((gameSave.crit_chance_upgrades || 0) * 5, 100);
    isCrit = Math.random() * 100 < critChance;
    if (isCrit) actualDamage *= 3;
  }

  let newBossHp = Math.max(0, currentBossHp - actualDamage);
  const isBossDefeated = newBossHp === 0;

  if (!isBossDefeated) {
    await supabase.from("boss_progress").update({ boss_hp: newBossHp }).eq("user_id", userId);
    return Response.json({
      success: true,
      damage_dealt: actualDamage,
      was_crit: isCrit,
      boss_defeated: false,
      current_boss_hp: newBossHp,
      boss_max_hp: bossMaxHp,
      is_auto_tap: isAutoTap,
    });
  }

  // --- Boss Defeated ---
  const coinsPerBoss = getCoinsPerBoss(currentLevel);
  const newTotalCoins = (progress.total_coins || 0) + coinsPerBoss;
  const { data: gameSaveBefore } = await supabase.from("game_saves").select("coins").eq("user_id", userId).single();
  const newAvailableCoins = (gameSaveBefore?.coins || 0) + coinsPerBoss;

  const newLevel = currentLevel + 1;
  const newWeeklyBest = Math.max(progress.weekly_best_level || 1, newLevel);

  // Calculate next boss HP (scaling with tap power)
  const tapPower = await getPlayerTapPower(userId);
  const nextBossHp = 250 * (tapPower || 1);

  await supabase.from("boss_progress").update({
    current_level: newLevel,
    boss_hp: nextBossHp,
    boss_max_hp: nextBossHp,
    total_coins: newTotalCoins,
    weekly_best_level: newWeeklyBest,
  }).eq("user_id", userId);

  await supabase.from("game_saves").update({
    coins: newAvailableCoins,
  }).eq("user_id", userId);

  return Response.json({
    success: true,
    boss_defeated: true,
    coins_earned: coinsPerBoss,
    total_coins: newTotalCoins,
    available_coins: newAvailableCoins,
    new_level: newLevel,
    current_boss_hp: nextBossHp,
    boss_max_hp: nextBossHp,
    boss_emoji: getBossEmoji(newLevel),
    weekly_best: newWeeklyBest,
    damage_dealt: actualDamage,
    was_crit: isCrit,
    is_auto_tap: isAutoTap,
  });
}


    // --- 4. CO-OP CREATE ---
    if (action === "coop_create") {
      const { userId } = body;
      if (!userId) return Response.json({ error: "User ID required" }, { status: 400 });
      let roomCode;
      while (true) {
        roomCode = generateRoomCode();
        const { data: exists } = await supabase.from("boss_coop_sessions").select("room_code").eq("room_code", roomCode).eq("is_active", true);
        if (!exists || exists.length === 0) break;
      }
          const level = 1;
      const playersArr = [userId];
      // --- NEW: Scale by total tap power
      const totalTapPower = await getPlayersTotalTapPower(playersArr);
      const bossHp = 250 * (totalTapPower || 1);
      const { data: session, error: insertErr } = await supabase.from("boss_coop_sessions").insert([{
        room_code: roomCode,
        boss_hp: bossHp, boss_max_hp: bossHp, boss_level: level,
        players: playersArr, is_active: true, total_coins: 0,
      }]).select().single();

      if (insertErr) throw insertErr;
      return Response.json({
        success: true,
        session: {
          ...session,
          boss_emoji: getBossEmoji(level),
          coins_per_boss: getCoopCoinsPerBoss(level),
        }
      });
    }

    // --- 5. CO-OP JOIN ---
    if (action === "coop_join") {
      const { roomCode, userId } = body;
      if (!roomCode) return Response.json({ error: 'Room code is required' }, { status: 400 });
      if (!userId) return Response.json({ error: 'User ID is required' }, { status: 400 });
      const { data: sessions } = await supabase.from("boss_coop_sessions").select("*")
        .eq("room_code", roomCode.toUpperCase()).eq("is_active", true);
      if (!sessions || sessions.length === 0) return Response.json({ error: 'Room not found or inactive' }, { status: 404 });
      const session = sessions[0];
      const currentPlayers = Array.isArray(session.players) ? session.players : [];
      if (currentPlayers.length >= 2 && !currentPlayers.includes(userId))
        return Response.json({ error: 'Room is full' }, { status: 400 });
      if (currentPlayers.includes(userId)) {
        return Response.json({
          success: true,
          session: {
            ...session,
            boss_emoji: getBossEmoji(session.boss_level),
            coins_per_boss: getCoopCoinsPerBoss(session.boss_level)
          }
        });
      }
      const newPlayers = [...currentPlayers, userId];
      const { data: updatedSessionArr } = await supabase.from("boss_coop_sessions").update({ players: newPlayers }).eq("room_code", session.room_code).select();
      const updatedSession = updatedSessionArr[0];
      return Response.json({
        success: true,
        session: {
          ...updatedSession,
          boss_emoji: getBossEmoji(updatedSession.boss_level),
          coins_per_boss: getCoopCoinsPerBoss(updatedSession.boss_level)
        }
      });
    }

    // --- 6. CO-OP TAP ---
    if (action === "coop_tap") {
      const { roomCode, userId, damage = 1 } = body;
      if (!roomCode) return Response.json({ error: 'Room code is required' }, { status: 400 });
      if (!userId) return Response.json({ error: 'User ID is required' }, { status: 400 });
      const { data: sessions } = await supabase.from("boss_coop_sessions").select("*")
        .eq("room_code", roomCode.toUpperCase()).eq("is_active", true);
      if (!sessions || sessions.length === 0) return Response.json({ error: 'Session not found' }, { status: 404 });
      const sessionData = sessions[0];
      const players = Array.isArray(sessionData.players) ? sessionData.players : [];
      if (!players.includes(userId)) return Response.json({ error: 'User not in this session' }, { status: 403 });
      const newHp = Math.max(0, (sessionData.boss_hp || getBossHP(sessionData.boss_level)) - damage);
      const bossDefeated = newHp === 0;
      let updatedSession, coinsEarned = 0;
      if (bossDefeated) {
                const newLevel = (sessionData.boss_level || 1) + 1;
        const playersArr = Array.isArray(sessionData.players) ? sessionData.players : [];
        // --- NEW: Scale by total tap power
        const totalTapPower = await getPlayersTotalTapPower(playersArr);
        const newBossHp = 250 * (totalTapPower || 1);
        coinsEarned = getCoopCoinsPerBoss(sessionData.boss_level || 1);
        const newTotalCoins = (sessionData.total_coins || 0) + coinsEarned;
        const { data: updateArr } = await supabase.from("boss_coop_sessions").update({
          boss_level: newLevel, boss_hp: newBossHp, boss_max_hp: newBossHp, total_coins: newTotalCoins,
        }).eq("room_code", sessionData.room_code).select();
        updatedSession = updateArr[0];

      } else {
        const { data: updateArr } = await supabase.from("boss_coop_sessions").update({ boss_hp: newHp })
          .eq("room_code", sessionData.room_code).select();
        updatedSession = updateArr[0];
      }
      return Response.json({
        success: true,
        boss_defeated: bossDefeated,
        coins_earned: coinsEarned,
        session: {
          ...updatedSession,
          boss_emoji: getBossEmoji(updatedSession.boss_level),
          coins_per_boss: getCoopCoinsPerBoss(updatedSession.boss_level)
        }
      });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message || "Unknown error" }, { status: 500 });
  }
}
