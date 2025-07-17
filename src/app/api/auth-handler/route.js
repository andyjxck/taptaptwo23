import { sql } from '../auth-handler/db'; // Adjust import based on your setup

async function handler({ userId, pin, action }) {
  try {
    if (!action) {
      return { error: "Missing action" };
    }

    // Correct types: integer for user_id, string for pin
    const userIdInt = userId !== undefined && userId !== null ? parseInt(userId, 10) : null;
    const pinStr = pin !== undefined && pin !== null ? String(pin) : "";

    switch (action) {
      case "getNextUserId": {
        const result = await sql`SELECT get_next_user_id() AS next_id`;
        return { userId: result[0]?.next_id ?? null };
      }

      case "checkUserId": {
        if (!userIdInt) {
          return { error: "Missing userId" };
        }
        const existingUser = await sql`
          SELECT user_id FROM users WHERE user_id = ${userIdInt}
        `;
        return { available: existingUser.length === 0 };
      }

      case "login": {
        if (!userIdInt || !pinStr) {
          return { error: "Missing userId or pin" };
        }
        const users = await sql`
          SELECT user_id FROM users WHERE user_id = ${userIdInt} AND pin = ${pinStr}
        `;
        if (users.length === 0) {
          return { error: "Invalid credentials" };
        }
        return { success: true };
      }

      case "signup":
      case "createUser": {
        if (!userIdInt || !pinStr) {
          return { error: "Missing userId or pin" };
        }
        const existingUser = await sql`
          SELECT user_id FROM users WHERE user_id = ${userIdInt}
        `;
        if (existingUser.length > 0) {
          return { error: "User ID already exists" };
        }
        await sql`
          INSERT INTO users (user_id, pin) VALUES (${userIdInt}, ${pinStr})
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
