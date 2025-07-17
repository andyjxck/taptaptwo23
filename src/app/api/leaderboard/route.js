import { sql } from "../auth-handler/db";


async function handler({ action }) {
  switch (action) {
    case "getLeaderboard": {
      const result = await sql`
        SELECT user_id, profile_name, total_coins_earned
        FROM users
        ORDER BY total_coins_earned DESC
        LIMIT 100
      `;
      return { coins: result };
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