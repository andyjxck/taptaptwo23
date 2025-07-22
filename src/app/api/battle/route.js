// app/api/battle/route.js

import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(req) {
  const { action, code, userId, profileName } = await req.json();

  if (!action || !userId || !profileName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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

    const playerColumn = room.player1_id === userId ? 'player1_ready' : 'player2_ready';
    await sql`
      UPDATE battle_games SET ${sql([playerColumn])} = true WHERE room_code = ${code};
    `;

    const bothReady = room.player1_ready && room.player2_ready;
    return NextResponse.json({ bothReady });
  }

  if (action === 'end') {
    const { winnerId, loserId, taps } = await req.json();

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
}
