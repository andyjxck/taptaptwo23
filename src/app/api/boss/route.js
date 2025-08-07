import { supabase } from "@/utilities/supabaseClient";
import { NextResponse } from "next/server";

// ---------- HELPERS ----------
function safe(val) {
  return typeof val === "number" && !isNaN(val) ? val : 0;
}

function getBossHP(level, tapPower = 1) {
  const BASE_HP = 1000; // Match frontend base HP
  const GROWTH = 1.31; // Match frontend growth rate
  return Math.floor(BASE_HP * Math.pow(GROWTH, Math.max(level - 1, 0)) * tapPower);
}

function getCoinsPerBoss(level) {
  const BASE = 500; // Match frontend base reward
  const GROWTH = 1.15; // Match frontend reward growth curve
  return Math.floor(BASE * Math.pow(GROWTH, Math.max(level - 1, 0)));
}

function getCoopBossHP(level, totalTapPower = 1) {
  const BASE_HP = 1000; // Match frontend base HP for coop
  const GROWTH = 1.31; // Match frontend growth for coop
  return Math.floor(BASE_HP * Math.pow(GROWTH, Math.max(level - 1, 0)) * totalTapPower);
}

function getCoopCoinsPerBoss(level) {
  const BASE = 500; // Match frontend base reward for coop
  const GROWTH = 1.15; // Match frontend reward growth for coop
  return Math.floor(BASE * Math.pow(GROWTH, Math.max(level - 1, 0)));
}


// --- Boss Emoji (20+ distinct bosses, fantasy/monster themed) ---
function getBossEmoji(level) {
  const emojis = [
    "👾", // alien
    "🐲", // dragon
    "🦖", // dino
    "🐙", // kraken
    "👻", // ghost
    "🤖", // robot
    "🦈", // shark
    "🕷️", // spider
    "🐍", // snake
    "🦅", // eagle
    "🦂", // scorpion
    "🦇", // bat
    "🧟", // zombie
    "🦄", // unicorn boss
    "🦑", // giant squid
    "🦾", // cyborg arm (mecha boss)
    "🐉", // oriental dragon
    "👹", // ogre/demon
    "💀", // skull boss
    "🔥", // fire elemental
    "❄️", // ice elemental
    "⚡", // lightning boss
    "🍄", // giant mushroom
    "🌪️", // tornado spirit
    "👽", // space invader
    "🪓", // axe warrior
    "🛡️", // shield guardian
    "🧙", // evil wizard
    "🦅", // eagle (repeat for cycle)
    "👑", // king boss
  ];
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
  for (let i = 0; i < 6; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}


async function getPlayerTapPower(userId) {
  const { data } = await supabase
    .from("game_saves")
    .select("tap_power")
    .eq("user_id", userId)
    .single();
  return safe(data?.tap_power) || 1;
}

async function getPlayersTotalTapPower(userIds) {
  if (!Array.isArray(userIds) || userIds.length === 0) return 1;
  const { data } = await supabase
    .from("game_saves")
    .select("tap_power")
    .in("user_id", userIds);
  if (!data) return 1;
  return data.reduce((sum, row) => sum + safe(row.tap_power), 0);
}

// ---------- GET HANDLER ----------
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const userId = searchParams.get("userId");
  const roomCode = searchParams.get("roomCode");

  try {
    if (action === "profile") {
      if (!userId)
        return NextResponse.json({ error: "userId required" }, { status: 400 });

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
            },
          ])
          .select()
          .single();
        gameSave = data;
      }

      let { data: bossProgress } = await supabase
        .from("boss_progress")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (!bossProgress) {
        const tapPower = safe(gameSave.tap_power) || 1;
        const bossHp = 250 * tapPower;
        const { data } = await supabase
          .from("boss_progress")
          .insert([
            {
              user_id: userId,
              current_level: 1,
              boss_hp: bossHp,
              boss_max_hp: bossHp,
              boss_emoji: "🔥",
              next_reset: getNextWeeklyReset(),
              total_coins: 0,
              weekly_best_level: 1,
              total_level: 1,
            },
          ])
          .select()
          .single();
        bossProgress = data;
      }

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
      if (!userId)
        return NextResponse.json({ error: "User ID required" }, { status: 400 });

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
              tap_power_upgrades: 1,
              auto_tapper_upgrades: 0,
              crit_chance_upgrades: 0,
              tap_speed_bonus_upgrades: 0,
              tap_power: 1,
              auto_tapper: 0,
              crit_chance: 0,
              tap_speed_bonus: 0,
              coins: 0,
            },
          ])
          .select()
          .single();
        gameSave = data;
      }

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
      if (!userId)
        return NextResponse.json({ error: "User ID required" }, { status: 400 });

      let { data: progress } = await supabase
        .from("boss_progress")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (!progress) {
        const tapPower = await getPlayerTapPower(userId);
        const bossHp = 250 * (tapPower || 1);
        const { data } = await supabase
          .from("boss_progress")
          .insert([
            {
              user_id: userId,
              current_level: 1,
              boss_hp: bossHp,
              boss_max_hp: bossHp,
              total_coins: 0,
              weekly_best_level: 1,
              last_reset_date: new Date().toISOString(),
            },
          ])
          .select()
          .single();
        progress = data;
      }

      if (progress.boss_hp === null) {
        const tapPower = await getPlayerTapPower(userId);
        const bossHp = 250 * (tapPower || 1);
        await supabase
          .from("boss_progress")
          .update({ boss_hp: bossHp, boss_max_hp: bossHp })
          .eq("user_id", userId);
        progress.boss_hp = bossHp;
        progress.boss_max_hp = bossHp;
      }

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
      if (!roomCode)
        return NextResponse.json({ error: "Room code is required" }, { status: 400 });
      if (!userId)
        return NextResponse.json({ error: "User ID is required" }, { status: 400 });

      const { data: sessions } = await supabase
        .from("boss_coop_sessions")
        .select("*")
        .eq("room_code", roomCode.toUpperCase())
        .eq("is_active", true);

      if (!sessions || sessions.length === 0)
        return NextResponse.json({ error: "Session not found" }, { status: 404 });

      const sessionData = sessions[0];
      const players = Array.isArray(sessionData.players) ? sessionData.players : [];

      if (!players.includes(userId))
        return NextResponse.json({ error: "User not in this session" }, { status: 403 });

      return NextResponse.json({
        success: true,
        session: {
          ...sessionData,
          boss_emoji: getBossEmoji(sessionData.boss_level),
          coins_per_boss: getCoopCoinsPerBoss(sessionData.boss_level),
        },
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unknown error" },
      { status: 500 }
    );
  }
}

// ---------- POST HANDLER ----------
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const action = body.action;

  try {
    if (action === "solo_tap") {
      const { userId, damage } = body;
      if (!userId)
        return NextResponse.json({ error: "User ID required" }, { status: 400 });
      if (typeof damage !== "number" || damage <= 0)
        return NextResponse.json({ error: "Valid damage required" }, { status: 400 });

      let { data: progress } = await supabase
        .from("boss_progress")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (!progress)
        return NextResponse.json(
          { error: "User progress not found" },
          { status: 404 }
        );

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
      let currentBossHp = safe(progress.boss_hp) ?? bossMaxHp;

      let newBossHp = Math.max(0, currentBossHp - damage);
      const isBossDefeated = newBossHp === 0;

      if (!isBossDefeated) {
        await supabase
          .from("boss_progress")
          .update({ boss_hp: newBossHp })
          .eq("user_id", userId);
        return NextResponse.json({
          success: true,
          damage_dealt: damage,
          boss_defeated: false,
          current_boss_hp: newBossHp,
          boss_max_hp: bossMaxHp,
        });
      }

      const { data: gameSave } = await supabase
        .from("game_saves")
        .select("coins")
        .eq("user_id", userId)
        .single();

      const currentCoins = safe(gameSave?.coins);
      const coinsEarned = Math.floor(currentCoins * 0.5);
      const newCoins = currentCoins + coinsEarned;

      const newLevel = currentLevel + 1;
const newWeeklyBest = Math.max(safe(progress.weekly_best_level), newLevel);
const tapPower = await getPlayerTapPower(userId);
const nextBossHp = 250 * (tapPower || 1);
const nextEmoji = getBossEmoji(newLevel);

await supabase
  .from("boss_progress")
  .update({
    current_level: newLevel,
    boss_hp: nextBossHp,
    boss_max_hp: nextBossHp,
    boss_emoji: nextEmoji,
    weekly_best_level: newWeeklyBest,
  })
  .eq("user_id", userId);

  // Fetch total_coins_earned, defaulting to 0 if not present
const { data: userRow } = await supabase
  .from("game_saves")
  .select("total_coins_earned")
  .eq("user_id", userId)
  .single();
const currentTotalEarned = safe(userRow?.total_coins_earned);

await supabase
  .from("game_saves")
  .update({
    coins: newCoins,
    total_coins_earned: currentTotalEarned + coinsEarned,
  })
  .eq("user_id", userId);


      return NextResponse.json({
        success: true,
        boss_defeated: true,
        coins_earned: coinsEarned,
        total_coins: newCoins,
        current_boss_hp: nextBossHp,
        boss_max_hp: nextBossHp,
        boss_emoji: nextEmoji,
        weekly_best: newWeeklyBest,
        damage_dealt: damage,
      });
    }

    if (action === "coop_create") {
      const { userId } = body;
      if (!userId)
        return NextResponse.json({ error: "User ID required" }, { status: 400 });

      let roomCode;
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
const playersArr = [userId];
const totalTapPower = await getPlayersTotalTapPower(playersArr);
const bossHp = getCoopBossHP(level, totalTapPower); // <<< FIX: pass level, totalTapPower!

      const { data: session, error: insertErr } = await supabase
        .from("boss_coop_sessions")
        .insert([
          {
            room_code: roomCode,
            boss_hp: bossHp,
            boss_max_hp: bossHp,
            boss_level: level,
            players: playersArr,
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
          coins_per_boss: getCoopCoinsPerBoss(level),
        },
      });
    }
    // --- Increment total_taps for a user ---
    if (action === "increment_total_taps") {
      const { userId, amount } = body;
      if (!userId)
        return NextResponse.json({ error: "User ID required" }, { status: 400 });

      // Default increment to 1 if not provided
      const increment = typeof amount === "number" && amount > 0 ? amount : 1;

      // Atomically increment total_taps
      const { error } = await supabase
        .from("game_saves")
        .update({ total_taps: supabase.literal(`total_taps + ${increment}`) })
        .eq("user_id", userId);

      if (error)
        return NextResponse.json({ error: "Failed to increment total_taps" }, { status: 500 });

      return NextResponse.json({ success: true });
    }

    if (action === "coop_join") {
      const { roomCode, userId } = body;
      if (!roomCode)
        return NextResponse.json({ error: "Room code is required" }, { status: 400 });
      if (!userId)
        return NextResponse.json({ error: "User ID is required" }, { status: 400 });

      const { data: sessions } = await supabase
        .from("boss_coop_sessions")
        .select("*")
        .eq("room_code", roomCode.toUpperCase())
        .eq("is_active", true);

      if (!sessions || sessions.length === 0)
        return NextResponse.json({ error: "Room not found or inactive" }, { status: 404 });

      const session = sessions[0];
      const currentPlayers = Array.isArray(session.players) ? session.players : [];

      if (currentPlayers.length >= 5 && !currentPlayers.includes(userId))
        return NextResponse.json({ error: "Room is full" }, { status: 400 });

      if (currentPlayers.includes(userId)) {
        return NextResponse.json({
          success: true,
          session: {
            ...session,
            boss_emoji: getBossEmoji(session.boss_level),
            coins_per_boss: getCoopCoinsPerBoss(session.boss_level),
          },
        });
      }

      const newPlayers = [...currentPlayers, userId];
      const { data: updatedSessionArr } = await supabase
        .from("boss_coop_sessions")
        .update({ players: newPlayers })
        .eq("room_code", session.room_code)
        .select();

      const updatedSession = updatedSessionArr[0];

      return NextResponse.json({
        success: true,
        session: {
          ...updatedSession,
          boss_emoji: getBossEmoji(updatedSession.boss_level),
          coins_per_boss: getCoopCoinsPerBoss(updatedSession.boss_level),
        },
      });
    }

    if (action === "coop_tap") {
      const { roomCode, userId, damage } = body;
      if (!roomCode)
        return NextResponse.json({ error: "Room code is required" }, { status: 400 });
      if (!userId)
        return NextResponse.json({ error: "User ID is required" }, { status: 400 });
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
      const players = Array.isArray(sessionData.players) ? sessionData.players : [];

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
      let updatedSession;

      if (!bossDefeated) {
        const { data: updateArr } = await supabase
          .from("boss_coop_sessions")
          .update({ boss_hp: newHp })
          .eq("room_code", sessionData.room_code)
          .select();
        updatedSession = updateArr[0];
   } else {
const newLevel = safe(sessionData.boss_level) + 1;
const totalTapPower = await getPlayersTotalTapPower(players);
const newBossHp = getCoopBossHP(newLevel, totalTapPower); // <<< FIX: pass newLevel, totalTapPower!


  // Grab current coins for all players
  const { data: playersCoinsData } = await supabase
    .from("game_saves")
    .select("user_id, coins")
    .in("user_id", players);
console.log("Players:", players);
console.log("playersCoinsData:", playersCoinsData);

  // For each player, calculate and update coins (+50% of their own coins)
  const rewards = [];
 await Promise.all(
  playersCoinsData.map(async (p) => {
    const reward = Math.floor(safe(p.coins) * 0.5);
    rewards.push({ user_id: p.user_id, reward });

    // Fetch total_coins_earned, defaulting to 0 if not present
    const { data: userRow } = await supabase
      .from("game_saves")
      .select("total_coins_earned")
      .eq("user_id", p.user_id)
      .single();
    const currentTotalEarned = safe(userRow?.total_coins_earned);

    await supabase
      .from("game_saves")
      .update({
        coins: safe(p.coins) + reward,
        total_coins_earned: currentTotalEarned + reward,
      })
      .eq("user_id", p.user_id);
  })
);


  // Move up a level and reset boss HP
  const { data: updateArr } = await supabase
    .from("boss_coop_sessions")
    .update({
      boss_level: newLevel,
      boss_hp: newBossHp,
      boss_max_hp: newBossHp,
    })
    .eq("room_code", sessionData.room_code)
    .select();

  const updatedSession = updateArr[0];

  return NextResponse.json({
    success: true,
    boss_defeated: true,
    rewards, // array of { user_id, reward }
    session: {
      ...updatedSession,
      boss_emoji: getBossEmoji(updatedSession.boss_level),
      coins_per_boss: getCoopCoinsPerBoss(updatedSession.boss_level),
    },
  });
}

      return NextResponse.json({
        success: true,
        boss_defeated: false,
        coins_earned: 0,
        session: {
          ...updatedSession,
          boss_emoji: getBossEmoji(updatedSession.boss_level),
          coins_per_boss: getCoopCoinsPerBoss(updatedSession.boss_level),
        },
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unknown error" },
      { status: 500 }
    );
  }
}
