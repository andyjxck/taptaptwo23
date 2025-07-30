import { supabase } from "@/utilities/supabaseClient";

// --------- HELPERS ----------
function safe(val) { return (typeof val === "number" && !isNaN(val) ? val : 0); }
function getBossHP(level, base = 250, scale = 1.2) { return Math.floor(base * Math.pow(scale, (level - 1))); }
function getCoopBossHP(totalTapPower, base = 250) { return base * (totalTapPower || 1); }
function getCoinsPerBoss(level) { return Math.floor(500 * Math.pow(1.15, level - 1)); }
function getCoopCoinsPerBoss(level) { return Math.floor(10 * Math.pow(1.15, level - 1)); }
function getBossEmoji(level) {
  const emojis = ["👾", "🐲", "🦖", "🐙", "👻", "🤖", "🦈", "🕷️", "🐍", "🦅"];
  return emojis[(level - 1) % emojis.length];
}
function getNextWeeklyReset() {
  const now = new Date();
  const daysUntilSunday = 7 - now.getDay();
  const next = new Date(now);
  next.setDate(now.getDate() + daysUntilSunday);
  next.setHours(0, 0, 0, 0);
  return next.toISOString();
}
function generateRoomCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
  return out;
}
async function getPlayerTapPower(userId) {
  const { data } = await supabase.from("game_saves").select("tap_power").eq("user_id", userId).single();
  return safe(data?.tap_power) || 1;
}
async function getPlayersTotalTapPower(userIds) {
  if (!Array.isArray(userIds) || userIds.length === 0) return 1;
  const { data } = await supabase.from("game_saves").select("tap_power").in("user_id", userIds);
  if (!data) return 1;
  return data.reduce((sum, row) => sum + safe(row.tap_power), 0);
}

// --------- GET HANDLER ----------
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const userId = searchParams.get("userId");
  const roomCode = searchParams.get("roomCode");

  try {
    // -- PROFILE FETCH --
    if (action === "profile") {
      if (!userId) return Response.json({ error: "userId required" }, { status: 400 });
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
        const tapPower = safe(gameSave.tap_power) || 1;
        const bossHp = 250 * tapPower;
        const { data } = await supabase.from("boss_progress").insert([{
          user_id: userId, current_level: 1, boss_hp: bossHp, boss_max_hp: bossHp, boss_emoji: "🔥",
          next_reset: getNextWeeklyReset(), total_coins: 0, weekly_best_level: 1, total_level: 1,
        }]).select().single();
        bossProgress = data;
      }
      // Update totalLevel in bossProgress if needed
      const upgradeLevel = safe(gameSave.tap_power_upgrades) + safe(gameSave.auto_tapper_upgrades) +
        safe(gameSave.crit_chance_upgrades) + safe(gameSave.tap_speed_bonus_upgrades);
      const totalLevel = safe(bossProgress.current_level) + upgradeLevel;
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
          availableCoins: safe(gameSave.coins),
          upgradeLevel,
          weeklyBest: bossProgress.weekly_best_level,
        },
      });
    }

    // -- UPGRADE/STATS FETCH --
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
      return Response.json({
        upgrades: {
          tap_power_upgrades: safe(gameSave.tap_power_upgrades),
          auto_tapper_upgrades: safe(gameSave.auto_tapper_upgrades),
          crit_chance_upgrades: safe(gameSave.crit_chance_upgrades),
          tap_speed_bonus_upgrades: safe(gameSave.tap_speed_bonus_upgrades),
        },
        stats: {
          tapPower: safe(gameSave.tap_power),
          autoTapperDps: safe(gameSave.auto_tapper),
          critChance: safe(gameSave.crit_chance),
          tapSpeedBonus: safe(gameSave.tap_speed_bonus),
        },
      });
    }

    // -- SOLO PROGRESS FETCH --
    if (action === "progress") {
      if (!userId) return Response.json({ error: "User ID required" }, { status: 400 });
      let { data: progress } = await supabase.from("boss_progress").select("*").eq("user_id", userId).single();
      if (!progress) {
        // First time, seed with tap power scaling
        const tapPower = await getPlayerTapPower(userId);
        const bossHp = 250 * (tapPower || 1);
        const { data } = await supabase.from("boss_progress").insert([{
          user_id: userId, current_level: 1, boss_hp: bossHp, boss_max_hp: bossHp,
          total_coins: 0, weekly_best_level: 1, last_reset_date: new Date().toISOString(),
        }]).select().single();
        progress = data;
      }
      if (progress.boss_hp === null) {
        const tapPower = await getPlayerTapPower(userId);
        const bossHp = 250 * (tapPower || 1);
        await supabase.from("boss_progress").update({ boss_hp: bossHp, boss_max_hp: bossHp }).eq("user_id", userId);
        progress.boss_hp = bossHp; progress.boss_max_hp = bossHp;
      }
      // Return progress (never resets boss on GET)
      return Response.json({
        success: true,
        current_level: progress.current_level,
        boss_hp: progress.boss_hp,
        boss_max_hp: progress.boss_max_hp,
        boss_emoji: getBossEmoji(progress.current_level),
        total_coins: progress.total_coins,
        weekly_best_level: progress.weekly_best_level,
        coins_per_boss: getCoinsPerBoss(progress.current_level),
        next_reset: getNextWeeklyReset(),
        last_reset_date: progress.last_reset_date,
      });
    }

    // -- CO-OP SESSION STATE (SYNC) --
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

// --------- POST HANDLER ----------
export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { body = {}; }
  const action = body.action;

  try {
    // -- UPDATE PROFILE (if needed) --
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

    // -- BUY UPGRADE --
    if (action === "upgrade") {
      // ...Keep as in your code, or I can rewrite the full upgrade logic if you want...
      return Response.json({ error: 'Not implemented in this snippet' }, { status: 501 });
    }

    // -- SOLO BOSS TAP --
    if (action === "solo_tap") {
      const { userId, isAutoTap = false } = body;
      if (!userId) return Response.json({ error: "User ID required" }, { status: 400 });

      let { data: progress } = await supabase.from("boss_progress").select("*").eq("user_id", userId).single();
      if (!progress) return Response.json({ error: "User progress not found" }, { status: 404 });

      // --- PREVENT FREE COIN EXPLOIT ---
      if (progress.boss_hp <= 0) {
        // Boss already dead. Only way to reset is via previous kill logic.
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
      const bossMaxHp = safe(progress.boss_max_hp) || getBossHP(currentLevel);
      let currentBossHp = safe(progress.boss_hp) ?? bossMaxHp;

      // Determine tap damage
      let actualDamage = 1, isCrit = false;
      if (isAutoTap) {
        actualDamage = safe(gameSave.auto_tapper);
      } else {
        actualDamage = safe(gameSave.tap_power) || 1;
        const critChance = Math.min(safe(gameSave.crit_chance_upgrades) * 5, 100);
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

      // --- Boss Defeated: atomically grant coins, level up, and only then respawn boss. ---
      const coinsPerBoss = getCoinsPerBoss(currentLevel);
      const newTotalCoins = safe(progress.total_coins) + coinsPerBoss;
      const { data: oldCoins } = await supabase.from("game_saves").select("coins").eq("user_id", userId).single();
      const newAvailableCoins = safe(oldCoins?.coins) + coinsPerBoss;
      const newLevel = currentLevel + 1;
      const newWeeklyBest = Math.max(safe(progress.weekly_best_level), newLevel);
      // Calculate next boss HP based on new tap power
      const tapPower = await getPlayerTapPower(userId);
      const nextBossHp = 250 * (tapPower || 1);

      // Transaction: update all at once (as much as supabase lets us)
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

    // -- CO-OP CREATE --
    if (action === "coop_create") {
      const { userId } = body;
      if (!userId) return Response.json({ error: "User ID required" }, { status: 400 });
      let roomCode;
      // Generate unique room code
      while (true) {
        roomCode = generateRoomCode();
        const { data: exists } = await supabase.from("boss_coop_sessions").select("room_code").eq("room_code", roomCode).eq("is_active", true);
        if (!exists || exists.length === 0) break;
      }
      const level = 1;
      const playersArr = [userId];
      const totalTapPower = await getPlayersTotalTapPower(playersArr);
      const bossHp = getCoopBossHP(totalTapPower);
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

    // -- CO-OP JOIN --
    if (action === "coop_join") {
      const { roomCode, userId } = body;
      if (!roomCode) return Response.json({ error: 'Room code is required' }, { status: 400 });
      if (!userId) return Response.json({ error: 'User ID is required' }, { status: 400 });
      const { data: sessions } = await supabase.from("boss_coop_sessions").select("*")
        .eq("room_code", roomCode.toUpperCase()).eq("is_active", true);
      if (!sessions || sessions.length === 0) return Response.json({ error: 'Room not found or inactive' }, { status: 404 });
      const session = sessions[0];
      const currentPlayers = Array.isArray(session.players) ? session.players : [];
      if (currentPlayers.length >= 5 && !currentPlayers.includes(userId))
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

    // -- CO-OP TAP --
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
      // Prevent double defeat: only accept tap if boss_hp > 0
      if (safe(sessionData.boss_hp) <= 0) {
        return Response.json({
          success: false,
          error: "Boss already defeated. Wait for server to spawn new boss.",
          current_boss_hp: sessionData.boss_hp,
          needs_reload: true,
        }, { status: 409 });
      }
      const newHp = Math.max(0, safe(sessionData.boss_hp) - safe(damage));
      const bossDefeated = newHp === 0;
      let updatedSession, coinsEarned = 0;
      if (bossDefeated) {
        // Only spawn next boss ONCE, regardless of tap spam!
        const newLevel = safe(sessionData.boss_level) + 1;
        const playersArr = Array.isArray(sessionData.players) ? sessionData.players : [];
        const totalTapPower = await getPlayersTotalTapPower(playersArr);
        const newBossHp = getCoopBossHP(totalTapPower);
        coinsEarned = getCoopCoinsPerBoss(safe(sessionData.boss_level));
        const newTotalCoins = safe(sessionData.total_coins) + coinsEarned;
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

