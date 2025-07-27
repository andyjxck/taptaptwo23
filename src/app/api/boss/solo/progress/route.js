import sql from "@/app/api/utils/sql";

// Get solo boss progress for a user
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || "demo_user";

  try {
    // Check if user progress exists
    let [progress] = await sql`
      SELECT * FROM boss_progress 
      WHERE user_id = ${userId} 
      LIMIT 1
    `;

    // Create new progress if doesn't exist
    if (!progress) {
      const bossHp = getBossHP(1);
      [progress] = await sql`
        INSERT INTO boss_progress (user_id, current_level, boss_hp, total_coins_earned, weekly_best_level, last_reset_date)
        VALUES (${userId}, 1, ${bossHp}, 0, 1, CURRENT_DATE)
        RETURNING *
      `;
    }

    // If boss_hp is null (from old data), initialize it
    if (progress.boss_hp === null) {
      const bossHp = getBossHP(progress.current_level);
      await sql`
        UPDATE boss_progress 
        SET boss_hp = ${bossHp}
        WHERE user_id = ${userId}
      `;
      progress.boss_hp = bossHp;
    }

    // Calculate derived stats
    const bossMaxHp = getBossHP(progress.current_level);
    const coinsPerBoss = getCoinsPerBoss(progress.current_level);
    const bossEmoji = getBossEmoji(progress.current_level);

    // Calculate next weekly reset date
    const nextReset = getNextWeeklyReset();

    return Response.json({
      success: true,
      current_level: progress.current_level,
      boss_hp: progress.boss_hp,
      boss_max_hp: bossMaxHp,
      boss_emoji: bossEmoji,
      total_coins_earned: progress.total_coins_earned,
      weekly_best_level: progress.weekly_best_level,
      coins_per_boss: coinsPerBoss,
      next_reset: nextReset,
      last_reset_date: progress.last_reset_date,
    });
  } catch (error) {
    console.error("Error fetching boss progress:", error);
    return Response.json(
      { error: "Failed to fetch progress" },
      { status: 500 },
    );
  }
}

// Helper functions
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

function getNextWeekReset() {
  const now = new Date();
  const nextWeek = new Date(now);
  const daysUntilSunday = 7 - now.getDay();
  nextWeek.setDate(now.getDate() + daysUntilSunday);
  nextWeek.setHours(0, 0, 0, 0);
  return nextWeek.toISOString();
}

function getNextWeeklyReset() {
  const now = new Date();
  const nextWeek = new Date(now);
  const daysUntilSunday = 7 - now.getDay();
  nextWeek.setDate(now.getDate() + daysUntilSunday);
  nextWeek.setHours(0, 0, 0, 0);
  return nextWeek.toISOString();
}
