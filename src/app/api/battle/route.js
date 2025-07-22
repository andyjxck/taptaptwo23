import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  const body = await request.json()
  const { action } = body

  if (!action) {
    return NextResponse.json({ error: 'Missing action field' }, { status: 400 })
  }

  // 1. Send invite
  if (action === 'invite') {
    const { from_user_id, to_user_id } = body
    if (!from_user_id || !to_user_id) {
      return NextResponse.json({ error: 'Missing from_user_id or to_user_id' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('battle_invites')
      .insert([{ from_user_id, to_user_id, status: 'pending' }])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ invite: data })
  }

  // 2. Respond to invite (accept or decline)
  if (action === 'respond') {
    const { invite_id, accept } = body
    if (invite_id === undefined || accept === undefined) {
      return NextResponse.json({ error: 'Missing invite_id or accept boolean' }, { status: 400 })
    }

    const status = accept ? 'accepted' : 'declined'

    const { data: inviteData, error: inviteError } = await supabase
      .from('battle_invites')
      .update({ status })
      .eq('id', invite_id)
      .select()
      .single()

    if (inviteError) {
      return NextResponse.json({ error: inviteError.message }, { status: 500 })
    }

    // If accepted, create a new battle row
    if (accept) {
      const { from_user_id, to_user_id } = inviteData
      const { data: battleData, error: battleError } = await supabase
        .from('battles')
        .insert([
          {
            player1_id: from_user_id,
            player2_id: to_user_id,
            status: 'active',
            start_time: new Date().toISOString()
          }
        ])
        .select()
        .single()

      if (battleError) {
        return NextResponse.json({ error: battleError.message }, { status: 500 })
      }

      return NextResponse.json({ invite: inviteData, battle: battleData })
    }

    return NextResponse.json({ invite: inviteData })
  }

  // 3. Both players press play to start the game officially
  if (action === 'start_game') {
    const { battle_id, player_id } = body
    if (!battle_id || !player_id) {
      return NextResponse.json({ error: 'Missing battle_id or player_id' }, { status: 400 })
    }

    // We'll track started players in a separate "battle_players_started" table or in-memory (not implemented here)
    // For simplicity, just return success for now
    // Frontend can handle waiting for both players to press play

    return NextResponse.json({ message: 'Player ready', battle_id, player_id })
  }

  // 4. Record a tap/move (score increment)
  if (action === 'record_move') {
    const { battle_id, player_id, score_increment } = body
    if (!battle_id || !player_id || typeof score_increment !== 'number') {
      return NextResponse.json({ error: 'Missing battle_id, player_id or score_increment' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('battle_moves')
      .insert([{ battle_id, player_id, score_increment }])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ move: data })
  }

  // 5. End game, calculate winner and update battle row
  if (action === 'end_game') {
    const { battle_id } = body
    if (!battle_id) {
      return NextResponse.json({ error: 'Missing battle_id' }, { status: 400 })
    }

    // Sum scores per player for this battle
    const { data: scores, error: scoreError } = await supabase
      .from('battle_moves')
      .select('player_id, score_increment')
      .eq('battle_id', battle_id)

    if (scoreError) {
      return NextResponse.json({ error: scoreError.message }, { status: 500 })
    }

    if (!scores || scores.length === 0) {
      return NextResponse.json({ error: 'No moves found for this battle' }, { status: 400 })
    }

    // Calculate total scores
    const scoreMap = {}
    for (const move of scores) {
      scoreMap[move.player_id] = (scoreMap[move.player_id] || 0) + move.score_increment
    }

    // Determine winner by max score
    let winner_id = null
    let maxScore = -Infinity
    for (const playerId in scoreMap) {
      if (scoreMap[playerId] > maxScore) {
        maxScore = scoreMap[playerId]
        winner_id = playerId
      }
    }

    // Update battle as finished with winner and end_time
    const { data: battleData, error: battleError } = await supabase
      .from('battles')
      .update({ status: 'finished', winner_id, end_time: new Date().toISOString() })
      .eq('id', battle_id)
      .select()
      .single()

    if (battleError) {
      return NextResponse.json({ error: battleError.message }, { status: 500 })
    }

    return NextResponse.json({ battle: battleData, winner_id, maxScore })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
