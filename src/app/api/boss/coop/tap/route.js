import sql from "@/app/api/utils/sql";

// Handle boss tap in co-op mode
export async function POST(request) {
  try {
    const { roomCode, userId = 'demo_user', damage = 1 } = await request.json();

    if (!roomCode) {
      return Response.json({ error: 'Room code is required' }, { status: 400 });
    }

    // Get current session
    const session = await sql`
      SELECT * FROM coop_sessions 
      WHERE room_code = ${roomCode.toUpperCase()} AND is_active = true
      LIMIT 1
    `;

    if (session.length === 0) {
      return Response.json({ error: 'Session not found' }, { status: 404 });
    }

    const sessionData = session[0];

    // Verify user is in this session
    if (sessionData.player1_id !== userId && sessionData.player2_id !== userId) {
      return Response.json({ error: 'User not in this session' }, { status: 403 });
    }

    // Calculate new HP after damage
    const newHp = Math.max(0, sessionData.current_boss_hp - damage);
    const bossDefeated = newHp === 0;

    let updatedSession;
    let coinsEarned = 0;

    if (bossDefeated) {
      // Boss defeated - level up and reset HP
      const newLevel = sessionData.current_boss_level + 1;
      const newBossHp = getBossHP(newLevel);
      coinsEarned = getCoinsPerBoss(sessionData.current_boss_level);
      const newTotalCoins = sessionData.total_coins_earned + coinsEarned;

      updatedSession = await sql`
        UPDATE coop_sessions 
        SET current_boss_level = ${newLevel},
            current_boss_hp = ${newBossHp},
            boss_max_hp = ${newBossHp},
            total_coins_earned = ${newTotalCoins},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${sessionData.id}
        RETURNING *
      `;

      // Log the boss defeat event
      await sql`
        INSERT INTO battle_events (session_id, user_id, damage_dealt, coins_earned, boss_level, event_type)
        VALUES (${sessionData.id}, ${userId}, ${damage}, ${coinsEarned}, ${sessionData.current_boss_level}, 'boss_defeated')
      `;

    } else {
      // Just damage, update HP
      updatedSession = await sql`
        UPDATE coop_sessions 
        SET current_boss_hp = ${newHp},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${sessionData.id}
        RETURNING *
      `;

      // Log the tap event
      await sql`
        INSERT INTO battle_events (session_id, user_id, damage_dealt, coins_earned, boss_level, event_type)
        VALUES (${sessionData.id}, ${userId}, ${damage}, 0, ${sessionData.current_boss_level}, 'tap')
      `;
    }

    return Response.json({
      success: true,
      boss_defeated: bossDefeated,
      coins_earned: coinsEarned,
      session: {
        ...updatedSession[0],
        boss_emoji: getBossEmoji(updatedSession[0].current_boss_level),
        coins_per_boss: getCoinsPerBoss(updatedSession[0].current_boss_level)
      }
    });

  } catch (error) {
    console.error('Error handling co-op tap:', error);
    return Response.json({ error: 'Failed to process tap' }, { status: 500 });
  }
}

// Get current session state (for syncing between players)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomCode = searchParams.get('roomCode');
    const userId = searchParams.get('userId') || 'demo_user';

    if (!roomCode) {
      return Response.json({ error: 'Room code is required' }, { status: 400 });
    }

    const session = await sql`
      SELECT * FROM coop_sessions 
      WHERE room_code = ${roomCode.toUpperCase()} AND is_active = true
      LIMIT 1
    `;

    if (session.length === 0) {
      return Response.json({ error: 'Session not found' }, { status: 404 });
    }

    const sessionData = session[0];

    // Verify user is in this session
    if (sessionData.player1_id !== userId && sessionData.player2_id !== userId) {
      return Response.json({ error: 'User not in this session' }, { status: 403 });
    }

    return Response.json({
      success: true,
      session: {
        ...sessionData,
        boss_emoji: getBossEmoji(sessionData.current_boss_level),
        coins_per_boss: getCoinsPerBoss(sessionData.current_boss_level)
      }
    });

  } catch (error) {
    console.error('Error getting session state:', error);
    return Response.json({ error: 'Failed to get session' }, { status: 500 });
  }
}

function getBossHP(level) {
  return Math.floor(100 * Math.pow(1.2, level - 1));
}

function getCoinsPerBoss(level) {
  return Math.floor(10 * Math.pow(1.15, level - 1));
}

function getBossEmoji(level) {
  const emojis = ['👾', '🐲', '🦖', '🐙', '👻', '🤖', '🦈', '🕷️', '🐍', '🦅'];
  return emojis[(level - 1) % emojis.length];
}