import { NextResponse } from 'next/server';
import { sql } from '../auth-handler/db';

export async function POST(req) {
  try {
    const body = await req.json();
    console.log('API /api/battle POST body:', body);

    const { action, code, userId, profileName, winnerId, loserId, taps } = body;

    if (!action) {
      console.error('Missing action in request body');
      return NextResponse.json({ error: 'Missing action' }, { status: 400 });
    }

    // userId might be required for many actions but not all, so check where needed
if (action === "getRoomStatus") {
  if (!code) {
    return NextResponse.json({ error: "Missing room code" }, { status: 400 });
  }

  const rows = await sql`
    SELECT * FROM battle_games WHERE room_code = ${code} LIMIT 1;
  `;

  if (!rows || rows.length === 0) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  return NextResponse.json({ room: rows[0] });
}

    if (action === 'getTapsInGame') {
      try {
        if (!code) {
          console.error('getTapsInGame: Missing room code');
          return NextResponse.json({ error: 'Missing room code' }, { status: 400 });
        }
        const rows = await sql`
          SELECT total_taps_ingame FROM battle_games WHERE room_code = ${code};
        `;
        console.log('getTapsInGame SQL result:', rows);

        if (!rows || rows.length === 0) {
          console.warn('getTapsInGame: Room not found for code:', code);
          return NextResponse.json({ error: 'Room not found' }, { status: 404 });
        }

        return NextResponse.json({ totalTapsInGame: rows[0].total_taps_ingame });
      } catch (error) {
        console.error('Error in getTapsInGame:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
      }
    }

    if (action === 'fetchProfile') {
      try {
        if (!userId) {
          console.error('fetchProfile: Missing userId');
          return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        const rows = await sql`
          SELECT 
            profile_name, 
            profile_icon, 
            total_taps, 
            renown_tokens 
          FROM game_saves 
          WHERE user_id = ${userId}
          LIMIT 1;
        `;
        console.log('fetchProfile SQL result:', rows);

        if (!rows || rows.length === 0) {
          console.warn('fetchProfile: Profile not found for userId:', userId);
          return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        const profile = rows[0];
        return NextResponse.json({ profile });
      } catch (error) {
        console.error('Error in fetchProfile:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
      }
    }

    if (action === 'create') {
      try {
        if (!userId) {
          console.error('create: Missing userId');
          return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }
        const roomCode = code || Math.random().toString(36).substring(2, 8).toUpperCase();
        const rows = await sql`
          INSERT INTO battle_games (room_code, player1_id, player1_ready)
          VALUES (${roomCode}, ${userId}, false)
          RETURNING id, room_code;
        `;
        console.log('create SQL insert result:', rows);

        if (!rows || rows.length === 0) {
          console.error('create: Failed to create battle room');
          return NextResponse.json({ error: 'Failed to create battle room' }, { status: 500 });
        }

        return NextResponse.json({ roomId: rows[0].id, roomCode: rows[0].room_code });
      } catch (error) {
        console.error('Error in create:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
      }
    }

    if (action === 'join') {
      try {
        if (!code || !userId) {
          console.error('join: Missing code or userId');
          return NextResponse.json({ error: 'Missing code or userId' }, { status: 400 });
        }

        const roomRows = await sql`
          SELECT * FROM battle_games WHERE room_code = ${code};
        `;
        console.log('join SQL select result:', roomRows);

        const room = roomRows[0];
        if (!room) {
          console.warn('join: Room not found for code:', code);
          return NextResponse.json({ error: 'Room not found' }, { status: 404 });
        }
        if (room.player2_id) {
          console.warn('join: Room full for code:', code);
          return NextResponse.json({ error: 'Room full' }, { status: 403 });
        }

        await sql`
          UPDATE battle_games SET player2_id = ${userId}, player2_ready = false
          WHERE room_code = ${code};
        `;
        console.log('join: Updated battle_games for room_code:', code, 'with player2_id:', userId);

        return NextResponse.json({ roomId: room.id, roomCode: code });
      } catch (error) {
        console.error('Error in join:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
      }
    }
if (action === 'ready') {
  try {
    if (!code || !userId) {
      return NextResponse.json({ error: 'Missing code or userId' }, { status: 400 });
    }

    const roomRows = await sql`
      SELECT * FROM battle_games WHERE room_code = ${code};
    `;

    const room = roomRows[0];
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const isPlayer1 = room.player1_id === userId;
    const playerColumn = isPlayer1 ? 'player1_ready' : 'player2_ready';

    await sql`
      UPDATE battle_games SET ${sql([playerColumn])} = true WHERE room_code = ${code};
    `;

    const updatedRows = await sql`
      SELECT player1_ready, player2_ready FROM battle_games WHERE room_code = ${code};
    `;
    const updated = updatedRows[0];

    return NextResponse.json({ player1_ready: updated.player1_ready, player2_ready: updated.player2_ready });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

    if (action === 'unready') {
  try {
    if (!code || !userId) {
      return NextResponse.json({ error: 'Missing code or userId' }, { status: 400 });
    }

    const roomRows = await sql`
      SELECT * FROM battle_games WHERE room_code = ${code};
    `;

    const room = roomRows[0];
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const isPlayer1 = room.player1_id === userId;
    const playerColumn = isPlayer1 ? 'player1_ready' : 'player2_ready';

    await sql`
      UPDATE battle_games SET ${sql([playerColumn])} = false WHERE room_code = ${code};
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

    

    if (action === 'end') {
      try {
        if (typeof taps !== 'number' || !winnerId || !loserId) {
          console.error('end: Missing or invalid taps, winnerId, or loserId');
          return NextResponse.json({ error: 'Missing or invalid taps, winnerId, or loserId' }, { status: 400 });
        }

        await sql`
          UPDATE game_saves SET total_taps = total_taps + ${taps}
          WHERE user_id = ${winnerId} OR user_id = ${loserId};
        `;
        console.log('end: Updated total_taps for winner and loser');

        await sql`
          UPDATE game_saves
          SET renown_tokens = renown_tokens + CASE
            WHEN user_id = ${winnerId} THEN 5
            WHEN user_id = ${loserId} THEN 1
            ELSE 0
          END
          WHERE user_id IN (${winnerId}, ${loserId});
        `;
        console.log('end: Updated renown_tokens for winner and loser');

        return NextResponse.json({ success: true });
      } catch (error) {
        console.error('Error in end:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
      }
    }

    console.warn('Invalid action:', action);
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('API /api/battle general error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
