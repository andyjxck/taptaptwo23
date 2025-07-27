import sql from "@/app/api/utils/sql";

// Handle boss tap in solo mode
export async function POST(request) {
  try {
    const { userId = "demo_user", isAutoTap = false } = await request.json();

    // Get current progress and upgrades
    const [progress] = await sql`
      SELECT * FROM boss_progress 
      WHERE user_id = ${userId} 
      LIMIT 1
    `;

    const [upgrades] = await sql`
      SELECT * FROM upgrades 
      WHERE user_id = ${userId} 
      LIMIT 1
    `;

    if (!progress) {
      return Response.json(
        { error: "User progress not found" },
        { status: 404 },
      );
    }

    // Get or create upgrades if they don't exist
    let userUpgrades = upgrades;
    if (!userUpgrades) {
      [userUpgrades] = await sql`
        INSERT INTO upgrades (user_id) 
        VALUES (${userId}) 
        RETURNING *
      `;
    }

    // Calculate current boss HP and max HP
    const currentLevel = progress.current_level;
    const bossMaxHp = getBossHP(currentLevel);
    let currentBossHp = progress.boss_hp || bossMaxHp;

    // Calculate actual damage based on upgrades and tap type
    let actualDamage;
    let isCrit = false;

    if (isAutoTap) {
      // Auto-tapper uses auto_tapper_level as base damage (DPS)
      actualDamage = userUpgrades.auto_tapper_level;
    } else {
      // Manual tap uses tap_power_level as base damage
      actualDamage = userUpgrades.tap_power_level;

      // Apply crit chance (only for manual taps)
      const critChance = Math.min(userUpgrades.crit_chance_level * 5, 100);
      isCrit = Math.random() * 100 < critChance;
      if (isCrit) {
        actualDamage *= 3; // 3x damage on crit
      }
    }

    // Apply damage to boss
    const newBossHp = Math.max(0, currentBossHp - actualDamage);
    const isBossDefeated = newBossHp === 0;

    // Update boss HP in progress table
    if (!isBossDefeated) {
      await sql`
        UPDATE boss_progress 
        SET boss_hp = ${newBossHp}, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${userId}
      `;
    }

    // Track session stats (only for manual taps to avoid skewing tap speed bonus)
    if (!isAutoTap) {
      const now = new Date();
      await sql`
        INSERT INTO session_stats (user_id, session_type, taps_this_session, damage_dealt_this_session, last_tap_time)
        VALUES (${userId}, 'solo', 1, ${actualDamage}, ${now.toISOString()})
        ON CONFLICT (user_id, session_type) 
        DO UPDATE SET 
          taps_this_session = session_stats.taps_this_session + 1,
          damage_dealt_this_session = session_stats.damage_dealt_this_session + ${actualDamage},
          last_tap_time = ${now.toISOString()}
      `;
    }

    // If boss is defeated, handle level progression
    if (isBossDefeated) {
      const coinsPerBoss = getCoinsPerBoss(currentLevel);
      const newCoins = progress.total_coins_earned + coinsPerBoss;
      const newLevel = currentLevel + 1;
      const newWeeklyBest = Math.max(progress.weekly_best_level, newLevel);
      const newBossHp = getBossHP(newLevel);

      // Update progress in database
      await sql`
        UPDATE boss_progress 
        SET current_level = ${newLevel},
            boss_hp = ${newBossHp},
            total_coins_earned = ${newCoins},
            weekly_best_level = ${newWeeklyBest},
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${userId}
      `;

      // Update weekly stats
      const weekStart = getWeekStart(new Date());
      await sql`
        INSERT INTO weekly_stats (user_id, week_start_date, max_level_reached, total_bosses_defeated, total_coins_earned)
        VALUES (${userId}, ${weekStart}, ${newLevel}, 1, ${coinsPerBoss})
        ON CONFLICT (user_id, week_start_date)
        DO UPDATE SET 
          max_level_reached = GREATEST(weekly_stats.max_level_reached, ${newLevel}),
          total_bosses_defeated = weekly_stats.total_bosses_defeated + 1,
          total_coins_earned = weekly_stats.total_coins_earned + ${coinsPerBoss},
          updated_at = CURRENT_TIMESTAMP
      `;

      // Reset session stats for new boss
      await sql`
        UPDATE session_stats 
        SET taps_this_session = 0, 
            damage_dealt_this_session = 0,
            coins_earned_this_session = coins_earned_this_session + ${coinsPerBoss}
        WHERE user_id = ${userId} AND session_type = 'solo'
      `;

      // Return new boss info
      return Response.json({
        success: true,
        boss_defeated: true,
        coins_earned: coinsPerBoss,
        total_coins: newCoins,
        new_level: newLevel,
        current_boss_hp: newBossHp,
        boss_max_hp: newBossHp,
        boss_emoji: getBossEmoji(newLevel),
        weekly_best: newWeeklyBest,
        damage_dealt: actualDamage,
        was_crit: isCrit,
        is_auto_tap: isAutoTap,
      });
    }

    // Regular tap response - return current HP
    return Response.json({
      success: true,
      damage_dealt: actualDamage,
      was_crit: isCrit,
      boss_defeated: false,
      current_boss_hp: newBossHp,
      boss_max_hp: bossMaxHp,
      is_auto_tap: isAutoTap,
    });
  } catch (error) {
    console.error("Error handling boss tap:", error);
    return Response.json({ error: "Failed to process tap" }, { status: 500 });
  }
}

// Helper functions (same as progress route)
function getBossHP(level) {
  return Math.floor(100 * Math.pow(1.2, level - 1));
}

function getCoinsPerBoss(level) {
  return Math.floor(500 * Math.pow(1.15, level - 1)); // Start at 500 coins instead of 10
}

function getBossEmoji(level) {
  const emojis = ["👾", "🐲", "🦖", "🐙", "👻", "🤖", "🦈", "🕷️", "🐍", "🦅"];
  return emojis[(level - 1) % emojis.length];
}

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  const weekStart = new Date(d.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);
  return weekStart.toISOString().split("T")[0];
}
