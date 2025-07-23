import { NextResponse } from 'next/server';
import { sql } from '../auth-handler/db';

export async function POST(req) {
  try {
    const body = await req.json();
    const { action, code, userId, profileName, winnerId, loserId, taps } = body;

    if (!action || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

  if (action === 'getTapsInGame') {
  try {
    const { rows } = await sql`
      SELECT total_taps_ingame FROM battle_games WHERE room_code = ${code};
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    return NextResponse.json({ totalTapsInGame: rows[0].total_taps_ingame });
  } catch (error) {
    console.error('Error in getTapsInGame:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}


    if (action === 'fetchProfile') {
      if (!userId) {
        return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
      }

      const { rows } = await sql`
        SELECT 
          profile_name, 
          profile_icon, 
          total_taps, 
          renown_tokens 
        FROM game_saves 
        WHERE user_id = ${userId}
        LIMIT 1;
      `;

      if (rows.length === 0) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      }

      const profile = rows[0];
      return NextResponse.json({ profile });
    }

    if (action === 'create') {
      const roomCode = code || Math.random().toString(36).substring(2, 8).toUpperCase();
      const { rows } = await sql`
        INSERT INTO battle_games (room_code, player1_id, player1_ready)
        VALUES (${roomCode}, ${userId}, false)
        RETURNING id, room_code;
      `;
      return NextResponse.json({ roomId: rows[0].id, roomCode: rows[0].room_code });
    }

    if (action === 'join') {
      const { rows: roomRows } = await sql`
        SELECT * FROM battle_games WHERE room_code = ${code};
      `;
      const room = roomRows[0];

      if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
      if (room.player2_id) return NextResponse.json({ error: 'Room full' }, { status: 403 });

      await sql`
        UPDATE battle_games SET player2_id = ${userId}, player2_ready = false
        WHERE room_code = ${code};
      `;

      return NextResponse.json({ roomId: room.id, roomCode: code });
    }

    if (action === 'ready') {
      const { rows: roomRows } = await sql`
        SELECT * FROM battle_games WHERE room_code = ${code};
      `;
      const room = roomRows[0];
      if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

      const isPlayer1 = room.player1_id === userId;
      const playerColumn = isPlayer1 ? 'player1_ready' : 'player2_ready';

      await sql`
        UPDATE battle_games SET ${sql([playerColumn])} = true WHERE room_code = ${code};
      `;

      const { rows: updatedRows } = await sql`
        SELECT player1_ready, player2_ready FROM battle_games WHERE room_code = ${code};
      `;
      const updated = updatedRows[0];
      const bothReady = updated.player1_ready && updated.player2_ready;

      return NextResponse.json({ bothReady });
    }

    if (action === 'end') {
      await sql`
        UPDATE game_saves SET total_taps = total_taps + ${taps}
        WHERE user_id = ${winnerId} OR user_id = ${loserId};
      `;

      await sql`
        UPDATE game_saves
        SET renown_tokens = renown_tokens + CASE
          WHEN user_id = ${winnerId} THEN 5
          WHEN user_id = ${loserId} THEN 1
          ELSE 0
        END
        WHERE user_id IN (${winnerId}, ${loserId});
      `;

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('API /api/battle error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
} // <---- This closes the POST function
