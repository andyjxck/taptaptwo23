import React from "react"; 
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export async function POST(req) {
  try {
    const body = await req.json();
    const { action, code, userId, taps, profileName, winnerId, loserId } = body;

    if (!action) {
      return new Response(JSON.stringify({ error: 'Missing action' }), { status: 400 });
    }

    if (action === 'updateTaps') {
      if (!code || !userId || typeof taps !== 'number') {
        return new Response(JSON.stringify({ error: 'Missing parameters' }), { status: 400 });
      }

      // Fetch battle room
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
      if (!userId) {
        return new Response(JSON.stringify({ error: 'Missing userId' }), { status: 400 });
      }

      const roomCode = code || Math.random().toString(36).substring(2, 8).toUpperCase();

      const { data: createdRooms, error } = await supabase
        .from('battle_games')
        .insert([{ room_code: roomCode, player1_id: userId, player1_ready: false }])
        .select('id, room_code')
        .single();

      if (error || !createdRooms) {
        return new Response(JSON.stringify({ error: 'Failed to create battle room' }), { status: 500 });
      }

      return new Response(JSON.stringify({ roomId: createdRooms.id, roomCode: createdRooms.room_code }), { status: 200 });
    }

    if (action === 'join') {
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
      if (room.player2_id) {
        return new Response(JSON.stringify({ error: 'Room full' }), { status: 403 });
      }

      const { error: updateError } = await supabase
        .from('battle_games')
        .update({ player2_id: userId, player2_ready: false })
        .eq('room_code', code);

      if (updateError) {
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

      const readyValue = action === 'ready' ? true : false;

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
      if (typeof taps !== 'number' || !winnerId || !loserId) {
        return new Response(JSON.stringify({ error: 'Missing or invalid taps, winnerId, or loserId' }), { status: 400 });
      }

      // Update total taps for winner and loser
      const { error: updateTapsError } = await supabase.rpc('increment_total_taps', {
        winner_id: winnerId,
        loser_id: loserId,
        taps,
      });

      // If you don't have a Postgres RPC function increment_total_taps, you can do two separate updates:

      if (updateTapsError) {
        return new Response(JSON.stringify({ error: updateTapsError.message }), { status: 500 });
      }

      // Update renown tokens for winner and loser
      const { error: updateRenownError } = await supabase
        .from('game_saves')
        .update({
          renown_tokens: supabase
            .rpc('calculate_renown_tokens', { winner_id: winnerId, loser_id: loserId }),
        })
        .in('user_id', [winnerId, loserId]);

      if (updateRenownError) {
        return new Response(JSON.stringify({ error: updateRenownError.message }), { status: 500 });
      }

      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
  } catch (error) {
    console.error('API /api/battle error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500 });
  }
}
