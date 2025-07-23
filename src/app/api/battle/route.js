import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      action,
      code,
      userId,
      taps,
      profileName,
      winnerId,
      loserId,
      total_taps_ingame,
    } = body;

    if (!action) {
      return new Response(JSON.stringify({ error: 'Missing action' }), { status: 400 });
    }

    if (action === 'updateTaps') {
      if (!code || !userId || typeof taps !== 'number') {
        return new Response(JSON.stringify({ error: 'Missing parameters' }), { status: 400 });
      }

      const { data: rooms, error: selectError } = await supabase
        .from('battle_games')
        .select('*')
        .eq('room_code', code);

      if (selectError || !rooms || rooms.length === 0) {
        return new Response(JSON.stringify({ error: 'Room not found' }), { status: 404 });
      }

      const room = rooms[0];
      const isPlayer1 = room.player1_id === userId;

      const updates = isPlayer1
        ? { player1_score: room.player1_score + taps }
        : { player2_score: room.player2_score + taps };

      const { error: updateError } = await supabase
        .from('battle_games')
        .update(updates)
        .eq('room_code', code);

      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }), { status: 500 });
      }

      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    if (action === 'getRoomStatus') {
      if (!code) {
        return new Response(JSON.stringify({ error: 'Missing room code' }), { status: 400 });
      }

      const { data: rooms, error } = await supabase
        .from('battle_games')
        .select('*')
        .eq('room_code', code)
        .limit(1);

      if (error || !rooms || rooms.length === 0) {
        return new Response(JSON.stringify({ error: 'Room not found' }), { status: 404 });
      }

      return new Response(JSON.stringify({ room: rooms[0] }), { status: 200 });
    }

    if (action === 'getTapsInGame') {
      if (!code) {
        return new Response(JSON.stringify({ error: 'Missing room code' }), { status: 400 });
      }

      const { data: rooms, error } = await supabase
        .from('battle_games')
        .select('total_taps_ingame')
        .eq('room_code', code)
        .limit(1);

      if (error || !rooms || rooms.length === 0) {
        return new Response(JSON.stringify({ error: 'Room not found' }), { status: 404 });
      }

      return new Response(JSON.stringify({ totalTapsInGame: rooms[0].total_taps_ingame }), { status: 200 });
    }

    if (action === 'fetchProfile') {
      if (!userId) {
        return new Response(JSON.stringify({ error: 'Missing userId' }), { status: 400 });
      }

      const { data: profiles, error } = await supabase
        .from('game_saves')
        .select('profile_name, profile_icon, total_taps, renown_tokens')
        .eq('user_id', userId)
        .limit(1);

      if (error || !profiles || profiles.length === 0) {
        return new Response(JSON.stringify({ error: 'Profile not found' }), { status: 404 });
      }

      return new Response(JSON.stringify({ profile: profiles[0] }), { status: 200 });
    }
if (action === 'create') {
  if (!userId || !profileName) {
    return new Response(JSON.stringify({ error: 'Missing userId or profileName' }), { status: 400 });
  }

  const roomCode = code || Math.random().toString(36).substring(2, 8).toUpperCase();

  const { data: createdRoom, error } = await supabase
    .from('battle_games')
    .insert([{
      room_code: roomCode,
      player1_id: userId,
      player1_ready: false,
      player1_name: profileName, // ✅ this line is required now
    }])
    .select('id, room_code')
    .single();

  if (error || !createdRoom) {
    console.error(error); // ✅ log error for debugging
    return new Response(JSON.stringify({ error: 'Failed to create battle room' }), { status: 500 });
  }

  return new Response(JSON.stringify({ roomId: createdRoom.id, roomCode: createdRoom.room_code }), { status: 200 });
}
if (action === 'join') {
  if (!code || !userId || !profileName) {
    return new Response(JSON.stringify({ error: 'Missing code, userId, or profileName' }), { status: 400 });
  }

  const { data: rooms, error } = await supabase
    .from('battle_games')
    .select('*')
    .eq('room_code', code);

  if (error || !rooms || rooms.length === 0) {
    return new Response(JSON.stringify({ error: 'Room not found' }), { status: 404 });
  }

  const room = rooms[0];
  if (room.player2_id) {
    return new Response(JSON.stringify({ error: 'Room full' }), { status: 403 });
  }

  const { error: updateError } = await supabase
    .from('battle_games')
    .update({
      player2_id: userId,
      player2_ready: false,
      player2_name: profileName, // ✅ also store opponent name
    })
    .eq('room_code', code);

  if (updateError) {
    console.error(updateError); // ✅ log for debugging
    return new Response(JSON.stringify({ error: updateError.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ roomId: room.id, roomCode: code }), { status: 200 });
}
    if (action === 'ready' || action === 'unready') {
      if (!code || !userId) {
        return new Response(JSON.stringify({ error: 'Missing code or userId' }), { status: 400 });
      }

      const { data: rooms, error } = await supabase
        .from('battle_games')
        .select('*')
        .eq('room_code', code);

      if (error || !rooms || rooms.length === 0) {
        return new Response(JSON.stringify({ error: 'Room not found' }), { status: 404 });
      }

      const room = rooms[0];
      const isPlayer1 = room.player1_id === userId;
      const playerColumn = isPlayer1 ? 'player1_ready' : 'player2_ready';

      const readyValue = action === 'ready';

      const updatePayload = {};
      updatePayload[playerColumn] = readyValue;

      const { error: updateError } = await supabase
        .from('battle_games')
        .update(updatePayload)
        .eq('room_code', code);

      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }), { status: 500 });
      }

      if (action === 'ready') {
        const { data: updatedRows, error } = await supabase
          .from('battle_games')
          .select('player1_ready, player2_ready')
          .eq('room_code', code)
          .limit(1);

        if (error || !updatedRows || updatedRows.length === 0) {
          return new Response(JSON.stringify({ error: 'Failed to fetch updated ready status' }), { status: 500 });
        }

        return new Response(
          JSON.stringify({
            player1_ready: updatedRows[0].player1_ready,
            player2_ready: updatedRows[0].player2_ready,
          }),
          { status: 200 }
        );
      }

      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    if (action === 'end') {
      if (typeof total_taps_ingame !== 'number' || !winnerId || !loserId || !code) {
        return new Response(
          JSON.stringify({ error: 'Missing or invalid total_taps_ingame, winnerId, loserId, or code' }),
          { status: 400 }
        );
      }

      // 1. Update battle_games.total_taps_ingame for this room
      const { error: updateBattleGamesError } = await supabase
        .from('battle_games')
        .update({ total_taps_ingame })
        .eq('room_code', code);

      if (updateBattleGamesError) {
        return new Response(JSON.stringify({ error: updateBattleGamesError.message }), { status: 500 });
      }

      // 2. Add total_taps_ingame to winner's total_taps and add renown_tokens
      const { error: updateWinnerError } = await supabase
        .from('game_saves')
        .update({
          total_taps: supabase.raw('total_taps + ?', [total_taps_ingame]),
          renown_tokens: supabase.raw('renown_tokens + 5'),
        })
        .eq('user_id', winnerId);

      if (updateWinnerError) {
        return new Response(JSON.stringify({ error: updateWinnerError.message }), { status: 500 });
      }

      // 3. Add total_taps_ingame to loser's total_taps and add renown_tokens
      const { error: updateLoserError } = await supabase
        .from('game_saves')
        .update({
          total_taps: supabase.raw('total_taps + ?', [total_taps_ingame]),
          renown_tokens: supabase.raw('renown_tokens + 1'),
        })
        .eq('user_id', loserId);

      if (updateLoserError) {
        return new Response(JSON.stringify({ error: updateLoserError.message }), { status: 500 });
      }

      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
  } catch (error) {
    console.error('API /api/battle error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500 });
  }
}
