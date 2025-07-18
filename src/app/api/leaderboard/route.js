import { sql } from "../auth-handler/db";


async function handler({ action }) {
  switch (action) {
   case "getLeaderboard": {
  const coins = await sql`
    SELECT user_id, profile_name, total_coins_earned, profile_icon
    FROM users
    ORDER BY total_coins_earned DESC
    LIMIT 100
  `;
  const renown = await sql`
    SELECT user_id, profile_name, renown_tokens, profile_icon
    FROM users
    ORDER BY renown_tokens DESC
    LIMIT 100
  `;
  const house = await sql`
    SELECT user_id, profile_name, house_name, house_level, profile_icon
    FROM users
    WHERE house_name IS NOT NULL AND house_level IS NOT NULL
    ORDER BY house_level DESC
    LIMIT 100
  `;
  return { coins, renown, house };
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
