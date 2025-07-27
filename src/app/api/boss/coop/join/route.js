import sql from "@/app/api/utils/sql";

// Join an existing co-op session
export async function POST(request) {
  try {
    const { roomCode, userId = 'demo_user' } = await request.json();

    if (!roomCode) {
      return Response.json({ error: 'Room code is required' }, { status: 400 });
    }

    // Find the session
    const session = await sql`
      SELECT * FROM coop_sessions 
      WHERE room_code = ${roomCode.toUpperCase()} AND is_active = true
      LIMIT 1
    `;

    if (session.length === 0) {
      return Response.json({ error: 'Room not found or inactive' }, { status: 404 });
    }

    const sessionData = session[0];

    // Check if session is full
    if (sessionData.player1_id && sessionData.player2_id) {
      return Response.json({ error: 'Room is full' }, { status: 400 });
    }

    // Check if user is already in this session
    if (sessionData.player1_id === userId || sessionData.player2_id === userId) {
      // User is already in session, just return session data
      return Response.json({
        success: true,
        session: {
          ...sessionData,
          boss_emoji: getBossEmoji(sessionData.current_boss_level),
          coins_per_boss: getCoinsPerBoss(sessionData.current_boss_level)
        }
      });
    }

    // Add user as player2
    const updatedSession = await sql`
      UPDATE coop_sessions 
      SET player2_id = ${userId}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${sessionData.id}
      RETURNING *
    `;

    return Response.json({
      success: true,
      session: {
        ...updatedSession[0],
        boss_emoji: getBossEmoji(updatedSession[0].current_boss_level),
        coins_per_boss: getCoinsPerBoss(updatedSession[0].current_boss_level)
      }
    });

  } catch (error) {
    console.error('Error joining co-op session:', error);
    return Response.json({ error: 'Failed to join session' }, { status: 500 });
  }
}

function getCoinsPerBoss(level) {
  return Math.floor(10 * Math.pow(1.15, level - 1));
}

function getBossEmoji(level) {
  const emojis = ['👾', '🐲', '🦖', '🐙', '👻', '🤖', '🦈', '🕷️', '🐍', '🦅'];
  return emojis[(level - 1) % emojis.length];
}