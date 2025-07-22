import { sql } from "../auth-handler/db";

async function handler({ action }) {
  switch (action) {
    case "getLeaderboard": {
      const coins = await sql`
        SELECT 
          user_id, 
          profile_name, 
          profile_icon, 
          total_coins_earned
        FROM game_saves
        WHERE total_coins_earned IS NOT NULL
        ORDER BY total_coins_earned DESC
        LIMIT 100
      `;

      const renown = await sql`
        SELECT user_id, profile_name, renown_tokens, profile_icon
        FROM game_saves
        ORDER BY renown_tokens DESC
        LIMIT 100
      `;

      const house = await sql`
        SELECT 
          user_id, 
          profile_name, 
          house_name, 
          profile_icon, 
          highest_house_level 
        FROM game_saves
        WHERE highest_house_level IS NOT NULL
        ORDER BY highest_house_level DESC
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
