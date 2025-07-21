import { sql } from "../auth-handler/db";

async function handler({ action }) {
  switch (action) {
    case "getLeaderboard": {
      const coins = await sql`
        SELECT user_id, profile_name, total_coins_earned, profile_icon
        FROM game_saves
        ORDER BY total_coins_earned DESC
        LIMIT 100
      `;

      const renown = await sql`
        SELECT user_id, profile_name, renown_tokens, profile_icon
        FROM game_saves
        ORDER BY renown_tokens DESC
        LIMIT 100
      `;

      // Fixed house leaderboard query to JOIN leaderboard table for highest_house_level
      const house = await sql`
        SELECT 
          gs.user_id, 
          gs.profile_name, 
          gs.house_name, 
          gs.profile_icon, 
          lb.highest_house_level 
        FROM game_saves gs
        JOIN leaderboard lb ON gs.user_id = lb.user_id
        WHERE lb.highest_house_level IS NOT NULL
        ORDER BY lb.highest_house_level DESC
        LIMIT 100
      `;

      const taps = await sql`
        SELECT user_id, profile_name, total_taps, profile_icon
        FROM game_saves
        ORDER BY total_taps DESC
        LIMIT 100
      `;

      return { coins, renown, house, taps };
    }

    default:
      return { error: "Invalid action" };
  }
}

export async function POST(request) {
  const result = await handler(await request.json());
  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
}
