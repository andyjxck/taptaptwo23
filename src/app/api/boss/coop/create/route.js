import sql from "@/app/api/utils/sql";

// Create a new co-op session
export async function POST(request) {
  try {
    const { userId = "demo_user" } = await request.json();

    // Generate a unique room code
    const roomCode = generateRoomCode();

    // Check if code already exists (very unlikely but just in case)
    const existing = await sql`
      SELECT id FROM coop_sessions 
      WHERE room_code = ${roomCode} AND is_active = true
      LIMIT 1
    `;

    if (existing.length > 0) {
      // Generate a new code if collision
      return await POST(request);
    }

    // Create new session
    const session = await sql`
      INSERT INTO coop_sessions (
        room_code, 
        player1_id, 
        current_boss_level, 
        current_boss_hp, 
        boss_max_hp, 
        total_coins_earned,
        max_players,
        is_active
      )
      VALUES (
        ${roomCode}, 
        ${userId}, 
        1, 
        ${getBossHP(1)}, 
        ${getBossHP(1)}, 
        0,
        5,
        true
      )
      RETURNING *
    `;

    return Response.json({
      success: true,
      session: {
        ...session[0],
        boss_emoji: getBossEmoji(1),
        coins_per_boss: getCoinsPerBoss(1),
      },
    });
  } catch (error) {
    console.error("Error creating co-op session:", error);
    return Response.json(
      { error: "Failed to create session" },
      { status: 500 },
    );
  }
}

function generateRoomCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function getBossHP(level) {
  return Math.floor(100 * Math.pow(1.2, level - 1));
}

function getCoinsPerBoss(level) {
  return Math.floor(10 * Math.pow(1.15, level - 1));
}

function getBossEmoji(level) {
  const emojis = ["👾", "🐲", "🦖", "🐙", "👻", "🤖", "🦈", "🕷️", "🐍", "🦅"];
  return emojis[(level - 1) % emojis.length];
}
