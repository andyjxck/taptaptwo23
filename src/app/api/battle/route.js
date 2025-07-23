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
      playerScore,
      opponentScore,
    } = body;

    if (!action) {
      return new Response(JSON.stringify({ error: 'Missing action' }), { status: 400 });
    }

    // ---------------------------
    // UPDATE AI STATS + PLAYER SCORE
    // ---------------------------
    if (action === 'updateAIStats') {
      if (!code) {
        return new Response(JSON.stringify({ error: 'Missing room code' }), { status: 400 });
      }

      const {
        ai_coins,
        ai_tap_power,
        ai_tap_power_level,
        ai_crit_chance,
        ai_crit_level,
        ai_tap_speed_bonus,
        ai_tap_speed_level,
        ai_auto_tapper,
        ai_auto_tapper_level,
        player_score,
      } = body;

      if (
        ai_coins === undefined ||
        ai_tap_power === undefined ||
        ai_tap_power_level === undefined ||
        ai_crit_chance === undefined ||
        ai_crit_level === undefined ||
        ai_tap_speed_bonus === undefined ||
        ai_tap_speed_level === undefined ||
        ai_auto_tapper === undefined ||
        ai_auto_tapper_level === undefined ||
        player_score === undefined ||
        !userId
      ) {
        return new Response(JSON.stringify({ error: 'Missing AI stats or player_score or userId' }), { status: 400 });
      }

      const { data: roomData, error: roomError } = await supabase
        .from('battle_games')
        .select('player1_id, player2_id')
        .eq('room_code', code)
        .single();

      if (roomError || !roomData) {
        return new Response(JSON.stringify({ error: roomError?.message || 'Room not found' }), { status: 404 });
      }

      const updates = {
        ai_coins,
        ai_tap_power,
        ai_tap_power_level,
        ai_crit_chance,
        ai_crit_level,
        ai_tap_speed_bonus,
        ai_tap_speed_level,
        ai_auto_tapper,
        ai_auto_tapper_level,
      };

      if (roomData.player1_id === userId) {
        updates.player1_score = player_score;
      } else if (roomData.player2_id === userId) {
        updates.player2_score = player_score;
      } else {
        return new Response(JSON.stringify({ error: 'User not part of the room' }), { status: 400 });
      }

      const { error: updateError } = await supabase
        .from('battle_games')
        .update(updates)
        .eq('room_code', code);

      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }), { status: 500 });
      }

      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    // ---------------------------
    // CREATE ROOM
    // ---------------------------
    if (action === 'create') {
      if (!userId || !profileName) {
        return new Response(JSON.stringify({ error: 'Missing userId or profileName' }), { status: 400 });
      }

      const roomCode = code || Math.random().toString(36).substring(2, 8).toUpperCase();

      const { data: createdRoom, error: insertError } = await supabase
        .from('battle_games')
        .insert([{
          room_code: roomCode,
          player1_id: userId,
          player1_ready: false,
          player1_name: profileName,
        }])
        .select('id, room_code')
        .single();

      if (insertError || !createdRoom) {
        console.error('Create Room Insert Error:', insertError);
        console.error('Insert Data:', {
          room_code: roomCode,
          player1_id: userId,
          player1_ready: false,
          player1_name: profileName,
        });
        return new Response(JSON.stringify({ error: insertError?.message || 'Failed to create battle room' }), { status: 500 });
      }

      return new Response(JSON.stringify({ roomId: createdRoom.id, roomCode: createdRoom.room_code }), { status: 200 });
    }

    // ---------------------------
    // JOIN ROOM
    // ---------------------------
    if (action === 'join') {
      if (!code || !userId || !profileName) {
        return new Response(JSON.stringify({ error: 'Missing code, userId, or profileName' }), { status: 400 });
      }

      const { data: rooms, error: fetchError } = await supabase
        .from('battle_games')
        .select('*')
        .eq('room_code', code);

      if (fetchError || !rooms || rooms.length === 0) {
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
          player2_name: profileName,
        })
        .eq('room_code', code);

      if (updateError) {
        console.error('Join Room Error:', updateError);
        return new Response(JSON.stringify({ error: updateError.message }), { status: 500 });
      }

      return new Response(JSON.stringify({ roomId: room.id, roomCode: code }), { status: 200 });
    }

    // ---------------------------
    // UPDATE TAPS
    // ---------------------------
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

    // ---------------------------
    // GET ROOM STATUS
    // ---------------------------
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

    // ---------------------------
    // GET TAPS IN GAME
    // ---------------------------
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

    // ---------------------------
    // FETCH PROFILE
    // ---------------------------
    if (action === 'fetchProfile') {
      if (!userId) {
        return new Response(JSON.stringify({ error: 'Missing userId' }), { status: 400 });
      }

      const { data: profiles, error } = await supabase
        .from('game_saves')
        .select('user_id, profile_name, profile_icon, total_taps, renown_tokens')
        .eq('user_id', userId)
        .limit(1);

      if (error || !profiles || profiles.length === 0) {
        return new Response(JSON.stringify({ error: 'Profile not found' }), { status: 404 });
      }

      return new Response(JSON.stringify({ profile: profiles[0] }), { status: 200 });
    }

    // ---------------------------
    // READY / UNREADY
    // ---------------------------
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

    // ---------------------------
    // END GAME
    // ---------------------------
    if (action === 'end') {
      if (
        typeof total_taps_ingame !== 'number' ||
        !winnerId ||
        !loserId ||
        !code ||
        playerScore === undefined ||
        opponentScore === undefined
      ) {
        return new Response(
          JSON.stringify({ error: 'Missing or invalid parameters for end action' }),
          { status: 400 }
        );
      }

      const { error: updateBattleGamesError } = await supabase
        .from('battle_games')
        .update({ total_taps_ingame })
        .eq('room_code', code);

      if (updateBattleGamesError) {
        return new Response(JSON.stringify({ error: updateBattleGamesError.message }), { status: 500 });
      }

      let winnerRenown = 10;
      let loserRenown = 3;
      if (playerScore === opponentScore) {
        winnerRenown = 5;
        loserRenown = 5;
      }

      const { data: winnerStats, error: fetchWinnerError } = await supabase
        .from('game_saves')
        .select('total_taps, renown_tokens')
        .eq('user_id', winnerId)
        .single();

      if (fetchWinnerError) {
        return new Response(JSON.stringify({ error: fetchWinnerError.message }), { status: 500 });
      }

      const { data: loserStats, error: fetchLoserError } = await supabase
        .from('game_saves')
        .select('total_taps, renown_tokens')
        .eq('user_id', loserId)
        .single();

      if (fetchLoserError) {
        return new Response(JSON.stringify({ error: fetchLoserError.message }), { status: 500 });
      }

      const newTotalTapsWinner = (winnerStats.total_taps || 0) + total_taps_ingame;
      const newRenownTokensWinner = (winnerStats.renown_tokens || 0) + winnerRenown;

      const newTotalTapsLoser = (loserStats.total_taps || 0) + total_taps_ingame;
      const newRenownTokensLoser = (loserStats.renown_tokens || 0) + loserRenown;

      const { error: updateWinnerError } = await supabase
        .from('game_saves')
        .update({
          total_taps: newTotalTapsWinner,
          renown_tokens: newRenownTokensWinner,
        })
        .eq('user_id', winnerId);

      if (updateWinnerError) {
        return new Response(JSON.stringify({ error: updateWinnerError.message }), { status: 500 });
      }

      const { error: updateLoserError } = await supabase
        .from('game_saves')
        .update({
          total_taps: newTotalTapsLoser,
          renown_tokens: newRenownTokensLoser,
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
