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

      const taps = await sql`
        SELECT user_id, profile_name, total_taps, profile_icon
        FROM game_saves
        ORDER BY total_taps DESC
        LIMIT 100
      `;

      const guilds = await sql`
        SELECT 
          g.name AS guild_name,
          SUM(u.house_level) AS guild_score
        FROM users u
        JOIN guilds g ON u.guild_id = g.id
        WHERE u.guild_id IS NOT NULL
        GROUP BY g.name
        ORDER BY guild_score DESC
        LIMIT 100
      `;

      return { coins, renown, taps, guilds };
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
