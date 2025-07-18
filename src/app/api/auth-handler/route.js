import { sql } from '../auth-handler/db';

async function handler({ userId, pin, action }) {
  // Early input validation
  if (!action || typeof action !== 'string') {
    return { error: "Missing or invalid action" };
  }

  // Parse userId strictly as integer if present
  const userIdInt = Number.isInteger(userId) ? userId : parseInt(userId, 10);
  const pinStr = typeof pin === 'string' ? pin : String(pin || "");

  // For actions that require userId & pin, validate upfront
  const needsAuth = ["login", "signup", "createUser", "checkUserId"];
  if (needsAuth.includes(action)) {
    if (!userIdInt || Number.isNaN(userIdInt)) {
      return { error: "Invalid or missing userId" };
    }
    if (action === "login" && (!pinStr || pinStr.length === 0)) {
      return { error: "Missing PIN for login" };
    }
  }

  try {
    switch (action) {
      case "getNextUserId": {
        const result = await sql`SELECT get_next_user_id() AS next_id;`;
        return { userId: result[0]?.next_id ?? null };
      }

      case "checkUserId": {
        const rows = await sql`
          SELECT user_id FROM users WHERE user_id = ${userIdInt}
        `;
        return { available: rows.length === 0 };
      }

      case "login": {
        const rows = await sql`
          SELECT user_id FROM users WHERE user_id = ${userIdInt} AND pin = ${pinStr}
        `;
        if (rows.length === 0) {
          return { error: "Invalid credentials" };
        }
        return { success: true };
      }

      case "signup":
      case "createUser": {
        const existing = await sql`
          SELECT user_id FROM users WHERE user_id = ${userIdInt}
        `;
        if (existing.length > 0) {
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
  } catch (err) {
    console.error("Auth handler error:", err);
    return { error: "Authentication failed: " + err.message };
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
  } catch (err) {
    console.error("[/api/auth-handler] Server error:", err);
    return new Response(
      JSON.stringify({ error: "Server error", details: err.message || String(err) }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  }
}
