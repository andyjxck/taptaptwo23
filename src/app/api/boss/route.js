import { supabase } from "@/utilities/supabaseClient";
import { NextResponse } from "next/server";

// ---------- HELPERS ----------
function safe(val: any) {
  return typeof val === "number" && !isNaN(val) ? val : 0;
}

// Match FRONTEND boss HP exactly
function getBossHP(level: number) {
  const BASE_HP = 1000;
  const GROWTH = 1.32;
  return Math.floor(BASE_HP * Math.pow(GROWTH, Math.max(level - 1, 0)));
}

// Use SAME reward curve frontend shows (+500 base, 1.1 growth)
function getCoinsPerBoss(level: number) {
  const BASE = 500;
  const GROWTH = 1.1;
  return Math.floor(BASE * Math.pow(GROWTH, Math.max(level - 1, 0)));
}

// Boss Emoji set
function getBossEmoji(level: number) {
  const emojis = [
    "👾","🐲","🦖","🐙","👻","🤖","🦈","🕷️","🐍","🦅","🦂","🦇","🧟","🦄","🦑","🦾","🐉","👹","💀","🔥","❄️","⚡","🍄","🌪️","👽","🪓","🛡️","🧙","🦅","👑",
  ];
  return emojis[(Math.max(1, level) - 1) % emojis.length];
}

function getNextWeeklyReset() {
  const now = new Date();
  const daysUntilSunday = (7 - now.getDay()) % 7;
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

async function ensureGameSave(userId: string | number) {
  let { data: gameSave } = await supabase
    .from("game_saves")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!gameSave) {
    const { data } = await supabase
      .from("game_saves")
      .insert([
        {
          user_id: userId,
          profile_name: "Fire Warrior",
          profile_icon: "🔥",
          tap_power_upgrades: 1,
          auto_tapper_upgrades: 0,
          crit_chance_upgrades: 0,
          tap_speed_bonus_upgrades: 0,
          tap_power: 1,
          auto_tapper: 0,
          crit_chance: 0,
          tap_speed_bonus: 0,
          coins: 0,
          total_coins_earned: 0,
          total_taps: 0,
        },
      ])
      .select()
      .single();
    gameSave = data!;
  }
  return gameSave;
}

async function ensureSoloProgress(userId: string | number) {
  let { data: bossProgress } = await supabase
    .from("boss_progress")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!bossProgress) {
    const lvl = 1;
    const hp = getBossHP(lvl);
    const { data } = await supabase
      .from("boss_progress")
      .insert([
        {
          user_id: userId,
          current_level: lvl,
          boss_hp: hp,
          boss_max_hp: hp,
          boss_emoji: getBossEmoji(lvl),
          next_reset: getNextWeeklyReset(),
          total_coins: 0,
          weekly_best_level: lvl,
          total_level: lvl,
          last_reset_date: new Date().toISOString(),
        },
      ])
      .select()
      .single();
    bossProgress = data!;
  }

  // Backfill null hp/max if needed
  if (bossProgress.boss_hp == null || bossProgress.boss_max_hp == null) {
    const fixedHp = getBossHP(bossProgress.current_level || 1);
    await supabase
      .from("boss_progress")
      .update({ boss_hp: fixedHp, boss_max_hp: fixedHp })
      .eq("user_id", userId);
    bossProgress.boss_hp = fixedHp;
    bossProgress.boss_max_hp = fixedHp;
  }

  return bossProgress;
}

// ---------- GET HANDLER ----------
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const userId = searchParams.get("userId");
  const roomCode = searchParams.get("roomCode");

  try {
    if (action === "profile") {
      if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

      const gameSave = await ensureGameSave(userId);
      let bossProgress = await ensureSoloProgress(userId);

      const upgradeLevel =
        safe(gameSave.tap_power_upgrades) +
        safe(gameSave.auto_tapper_upgrades) +
        safe(gameSave.crit_chance_upgrades) +
        safe(gameSave.tap_speed_bonus_upgrades);

      const totalLevel = safe(bossProgress.current_level) + upgradeLevel;

      if (bossProgress.total_level !== totalLevel) {
        await supabase
          .from("boss_progress")
          .update({ total_level: totalLevel })
          .eq("user_id", userId);
        bossProgress.total_level = totalLevel;
      }

      return NextResponse.json({
        profile: {
          user_id: gameSave.user_id,
          profile_name: gameSave.profile_name,
          profile_icon: gameSave.profile_icon,
          total_level: totalLevel,
        },
        stats: {
          bossLevel: bossProgress.current_level,
          totalCoins: safe(gameSave.coins),
          availableCoins: safe(gameSave.coins),
          upgradeLevel,
          weeklyBest: bossProgress.weekly_best_level,
        },
      });
    }

    if (action === "upgrades") {
      if (!userId) return NextResponse.json({ error: "User ID required" }, { status: 400 });
      const gameSave = await ensureGameSave(userId);

      return NextResponse.json({
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

    if (action === "progress") {
      if (!userId) return NextResponse.json({ error: "User ID required" }, { status: 400 });

      const progress = await ensureSoloProgress(userId);

      return NextResponse.json({
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

    if (action === "coop_session") {
      if (!roomCode) return NextResponse.json({ error: "Room code is required" }, { status: 400 });
      if (!userId) return NextResponse.json({ error: "User ID is required" }, { status: 400 });

      const { data: sessions } = await supabase
        .from("boss_coop_sessions")
        .select("*")
        .eq("room_code", roomCode.toUpperCase())
        .eq("is_active", true);

      if (!sessions || sessions.length === 0)
        return NextResponse.json({ error: "Session not found" }, { status: 404 });

      const sessionData = sessions[0];
      const players: any[] = Array.isArray(sessionData.players) ? sessionData.players : [];
      if (!players.includes(userId))
        return NextResponse.json({ error: "User not in this session" }, { status: 403 });

      return NextResponse.json({
        success: true,
        session: {
          ...sessionData,
          boss_emoji: getBossEmoji(sessionData.boss_level),
          coins_per_boss: getCoinsPerBoss(sessionData.boss_level),
        },
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
  }
}

// ---------- POST HANDLER ----------
export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const action = body.action;

  try {
    if (action === "solo_tap") {
      const { userId, damage } = body;
      if (!userId) return NextResponse.json({ error: "User ID required" }, { status: 400 });
      if (typeof damage !== "number" || damage <= 0)
        return NextResponse.json({ error: "Valid damage required" }, { status: 400 });

      const progress = await ensureSoloProgress(userId);

      if (safe(progress.boss_hp) <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Boss already defeated. Please reload.",
            current_boss_hp: progress.boss_hp,
            needs_reload: true,
          },
          { status: 409 }
        );
      }

      const currentLevel = progress.current_level;
      const bossMaxHp = safe(progress.boss_max_hp) || getBossHP(currentLevel);
      const currentBossHp = safe(progress.boss_hp) ?? bossMaxHp;

      const newBossHp = Math.max(0, currentBossHp - damage);
      const isBossDefeated = newBossHp === 0;

      if (!isBossDefeated) {
        await supabase.from("boss_progress").update({ boss_hp: newBossHp }).eq("user_id", userId);
        return NextResponse.json({
          success: true,
          damage_dealt: damage,
          boss_defeated: false,
          current_boss_hp: newBossHp,
          boss_max_hp: bossMaxHp,
        });
      }

      // Defeated: pay fixed per-level reward (frontend shows this)
      const coinsEarned = getCoinsPerBoss(currentLevel);

      // get coins + total_coins_earned
      const { data: gs } = await supabase
        .from("game_saves")
        .select("coins,total_coins_earned")
        .eq("user_id", userId)
        .single();
      const currentCoins = safe(gs?.coins);
      const currentEarned = safe(gs?.total_coins_earned);

      const newCoins = currentCoins + coinsEarned;
      const newLevel = currentLevel + 1;
      const nextHp = getBossHP(newLevel);
      const nextEmoji = getBossEmoji(newLevel);
      const newWeeklyBest = Math.max(safe(progress.weekly_best_level), newLevel);

      await supabase
        .from("boss_progress")
        .update({
          current_level: newLevel,
          boss_hp: nextHp,
          boss_max_hp: nextHp,
          boss_emoji: nextEmoji,
          weekly_best_level: newWeeklyBest,
        })
        .eq("user_id", userId);

      await supabase
        .from("game_saves")
        .update({
          coins: newCoins,
          total_coins_earned: currentEarned + coinsEarned,
        })
        .eq("user_id", userId);

      return NextResponse.json({
        success: true,
        boss_defeated: true,
        coins_earned: coinsEarned,
        total_coins: newCoins,
        current_boss_hp: nextHp,
        boss_max_hp: nextHp,
        boss_emoji: nextEmoji,
        weekly_best: newWeeklyBest,
        damage_dealt: damage,
      });
    }

    if (action === "coop_create") {
      const { userId } = body;
      if (!userId) return NextResponse.json({ error: "User ID required" }, { status: 400 });

      // unique code
      let roomCode: string;
      while (true) {
        roomCode = generateRoomCode();
        const { data: exists } = await supabase
          .from("boss_coop_sessions")
          .select("room_code")
          .eq("room_code", roomCode)
          .eq("is_active", true);
        if (!exists || exists.length === 0) break;
      }

      const level = 1;
      const hp = getBossHP(level); // match frontend bar

      const { data: session, error: insertErr } = await supabase
        .from("boss_coop_sessions")
        .insert([
          {
            room_code: roomCode,
            boss_hp: hp,
            boss_max_hp: hp,
            boss_level: level,
            players: [userId],
            is_active: true,
            total_coins: 0,
          },
        ])
        .select()
        .single();

      if (insertErr) throw insertErr;

      return NextResponse.json({
        success: true,
        session: {
          ...session,
          boss_emoji: getBossEmoji(level),
          coins_per_boss: getCoinsPerBoss(level),
        },
      });
    }

    // Atomically increment total_taps
    if (action === "increment_total_taps") {
      const { userId, amount } = body;
      if (!userId) return NextResponse.json({ error: "User ID required" }, { status: 400 });
      const increment = typeof amount === "number" && amount > 0 ? amount : 1;

      const { error } = await supabase
        .from("game_saves")
        .update({ total_taps: (supabase as any).literal(`total_taps + ${increment}`) })
        .eq("user_id", userId);

      if (error) return NextResponse.json({ error: "Failed to increment total_taps" }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    if (action === "coop_join") {
      const { roomCode, userId } = body;
      if (!roomCode) return NextResponse.json({ error: "Room code is required" }, { status: 400 });
      if (!userId) return NextResponse.json({ error: "User ID is required" }, { status: 400 });

      const { data: sessions } = await supabase
        .from("boss_coop_sessions")
        .select("*")
        .eq("room_code", roomCode.toUpperCase())
        .eq("is_active", true);

      if (!sessions || sessions.length === 0)
        return NextResponse.json({ error: "Room not found or inactive" }, { status: 404 });

      const session = sessions[0];
      const currentPlayers: any[] = Array.isArray(session.players) ? session.players : [];

      if (currentPlayers.length >= 5 && !currentPlayers.includes(userId))
        return NextResponse.json({ error: "Room is full" }, { status: 400 });

      if (currentPlayers.includes(userId)) {
        return NextResponse.json({
          success: true,
          session: {
            ...session,
            boss_emoji: getBossEmoji(session.boss_level),
            coins_per_boss: getCoinsPerBoss(session.boss_level),
          },
        });
      }

      const newPlayers = [...currentPlayers, userId];
      const { data: updatedSessionArr } = await supabase
        .from("boss_coop_sessions")
        .update({ players: newPlayers })
        .eq("room_code", session.room_code)
        .select();

      const updatedSession = updatedSessionArr![0];

      return NextResponse.json({
        success: true,
        session: {
          ...updatedSession,
          boss_emoji: getBossEmoji(updatedSession.boss_level),
          coins_per_boss: getCoinsPerBoss(updatedSession.boss_level),
        },
      });
    }

    if (action === "coop_tap") {
      const { roomCode, userId, damage } = body;
      if (!roomCode) return NextResponse.json({ error: "Room code is required" }, { status: 400 });
      if (!userId) return NextResponse.json({ error: "User ID is required" }, { status: 400 });
      if (typeof damage !== "number" || damage <= 0)
        return NextResponse.json({ error: "Valid damage required" }, { status: 400 });

      const { data: sessions } = await supabase
        .from("boss_coop_sessions")
        .select("*")
        .eq("room_code", roomCode.toUpperCase())
        .eq("is_active", true);

      if (!sessions || sessions.length === 0)
        return NextResponse.json({ error: "Session not found" }, { status: 404 });

      const sessionData = sessions[0];
      const players: any[] = Array.isArray(sessionData.players) ? sessionData.players : [];

      if (!players.includes(userId))
        return NextResponse.json({ error: "User not in this session" }, { status: 403 });

      if (safe(sessionData.boss_hp) <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Boss already defeated. Wait for server to spawn new boss.",
            current_boss_hp: sessionData.boss_hp,
            needs_reload: true,
          },
          { status: 409 }
        );
      }

      const newHp = Math.max(0, safe(sessionData.boss_hp) - damage);
      const bossDefeated = newHp === 0;

      if (!bossDefeated) {
        const { data: updateArr } = await supabase
          .from("boss_coop_sessions")
          .update({ boss_hp: newHp })
          .eq("room_code", sessionData.room_code)
          .select();
        const updatedSession = updateArr![0];

        return NextResponse.json({
          success: true,
          boss_defeated: false,
          coins_earned: 0,
          session: {
            ...updatedSession,
            boss_emoji: getBossEmoji(updatedSession.boss_level),
            coins_per_boss: getCoinsPerBoss(updatedSession.boss_level),
          },
        });
      }

      // Boss defeated in COOP: give each player fixed level reward (same as solo for UI consistency)
      const level = safe(sessionData.boss_level);
      const rewardPerPlayer = getCoinsPerBoss(level);

      const { data: playersCoins } = await supabase
        .from("game_saves")
        .select("user_id, coins, total_coins_earned")
        .in("user_id", players);

      const rewards: { user_id: any; reward: number }[] = [];
      await Promise.all(
        (playersCoins || []).map(async (p) => {
          const reward = rewardPerPlayer;
          rewards.push({ user_id: p.user_id, reward });

          await supabase
            .from("game_saves")
            .update({
              coins: safe(p.coins) + reward,
              total_coins_earned: safe(p.total_coins_earned) + reward,
            })
            .eq("user_id", p.user_id);
        })
      );

      const newLevel = level + 1;
      const newBossHp = getBossHP(newLevel);

      const { data: updateArr } = await supabase
        .from("boss_coop_sessions")
        .update({
          boss_level: newLevel,
          boss_hp: newBossHp,
          boss_max_hp: newBossHp,
        })
        .eq("room_code", sessionData.room_code)
        .select();

      const updatedSession = updateArr![0];

      return NextResponse.json({
        success: true,
        boss_defeated: true,
        rewards,
        session: {
          ...updatedSession,
          boss_emoji: getBossEmoji(updatedSession.boss_level),
          coins_per_boss: getCoinsPerBoss(updatedSession.boss_level),
        },
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
  }
}
