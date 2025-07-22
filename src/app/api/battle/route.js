import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with Service Role Key (server-side only)
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

  if (action === 'respond') {
    const { invite_id, accept } = body
    if (invite_id === undefined || accept === undefined) {
      return NextResponse.json({ error: 'Missing invite_id or accept boolean' }, { status: 400 })
    }

    const status = accept ? 'accepted' : 'declined'

    const { data, error } = await supabase
      .from('battle_invites')
      .update({ status })
      .eq('id', invite_id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ invite: data })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
