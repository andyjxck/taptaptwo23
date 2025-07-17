import { sql } from '../auth-handler/db'; // Adjust import based on your setup

async function handler({ userId, pin, action }) {
  try {
    if (!action) {
      return { error: "Missing action" };
    }

    switch (action) {
      case "getNextUserId": {
        const result = await sql`SELECT get_next_user_id() AS next_id`;
        return { userId: result[0]?.next_id ?? null };
      }

      case "checkUserId": {
        if (!userId) {
          return { error: "Missing userId" };
        }
        // Use string for safe comparison
        const userIdStr = String(userId);
        const existingUser = await sql`
          SELECT user_id FROM users WHERE user_id::text = ${userIdStr}
        `;
        return { available: existingUser.length === 0 };
      }

      case "login": {
        if (!userId || !pin) {
          return { error: "Missing userId or pin" };
        }
        // Use string for safe comparison
        const userIdStr = String(userId);
        const pinStr = String(pin);
        const users = await sql`
          SELECT user_id FROM users WHERE user_id::text = ${userIdStr} AND pin::text = ${pinStr}
        `;
        if (users.length === 0) {
          return { error: "Invalid credentials" };
        }
        return { success: true };
      }

      case "signup":
      case "createUser": {
        if (!userId || !pin) {
          return { error: "Missing userId or pin" };
        }
        // Use string for safe comparison
        const userIdStr = String(userId);
        const pinStr = String(pin);
        const existingUser = await sql`
          SELECT user_id FROM users WHERE user_id::text = ${userIdStr}
        `;
        if (existingUser.length > 0) {
          return { error: "User ID already exists" };
        }
        await sql`
          INSERT INTO users (user_id, pin) VALUES (${userIdStr}, ${pinStr})
        `;
        return { success: true };
      }

      default:
        return { error: "Invalid action" };
    }
  } catch (error) {
    console.error("Auth error:", error);
    return { error: "Authentication failed: " + error.message };
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const result = await handler(body);
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[/api/auth-handler] Uncaught error:", error);
    return new Response(JSON.stringify({ error: "Server error", details: error.message || String(error) }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
}
