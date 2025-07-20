// src/app/api/friends/route.js

import { NextResponse } from 'next/server';
import { sql } from '../auth-handler/db'; // Adjust path if needed

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (!action) {
      return NextResponse.json({ error: 'Missing action parameter' }, { status: 400 });
    }

    switch (action) {
      case 'get': {
        const userId = searchParams.get('userId');
        if (!userId) {
          return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        const friends = await sql`
          SELECT gs.user_id AS friend_id,
                 gs.profile_name,
                 gs.total_taps,
                 gs.combined_upgrade_level,
                 gs.total_coins_earned,
          FROM friends f
          JOIN game_saves gs ON f.friend_id = gs.user_id
          WHERE f.user_id = ${userId} AND f.status = 'accepted'
        `;

        return NextResponse.json({ friends });
      }

      case 'pending': {
        const userId = searchParams.get('userId');
        if (!userId) {
          return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        const pending = await sql`
          SELECT f.user_id, gs.profile_name 
          FROM friends f
          JOIN game_saves gs ON f.user_id = gs.user_id
          WHERE f.friend_id = ${userId} AND f.status = 'pending'
        `;

        return NextResponse.json({ pending });
      }

      case 'search': {
        const query = searchParams.get('q');
        if (!query) {
          return NextResponse.json({ error: 'Missing search query' }, { status: 400 });
        }

        const users = await sql`
          SELECT user_id, profile_name 
          FROM game_saves 
          WHERE CAST(user_id AS TEXT) ILIKE ${'%' + query + '%'}
          LIMIT 10
        `;

        return NextResponse.json({ users });
      }

      default:
        return NextResponse.json({ error: 'Invalid action for GET' }, { status: 400 });
    }
  } catch (err) {
    console.error('API /friends GET error:', err);
    return NextResponse.json({ error: 'Server error', details: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (!action) {
      return NextResponse.json({ error: 'Missing action parameter' }, { status: 400 });
    }

    const body = await req.json();
    const { userId, friendId } = body;

    if (!userId || !friendId || userId === friendId) {
      return NextResponse.json({ error: 'Invalid user IDs' }, { status: 400 });
    }

    switch (action) {
      case 'accept': {
        const updateResult = await sql`
          UPDATE friends
          SET status = 'accepted'
          WHERE user_id = ${friendId} AND friend_id = ${userId} AND status = 'pending'
          RETURNING *
        `;

        if (updateResult.length === 0) {
          return NextResponse.json({ error: 'No pending request found' }, { status: 404 });
        }

        await sql`
          INSERT INTO friends (user_id, friend_id, status)
          VALUES (${userId}, ${friendId}, 'accepted')
        `;

        return NextResponse.json({ success: true });
      }

      case 'request': {
        const existing = await sql`
          SELECT * FROM friends WHERE user_id = ${userId} AND friend_id = ${friendId}
        `;

        if (existing.length > 0) {
          return NextResponse.json({ error: 'Friend request already exists' }, { status: 409 });
        }

        await sql`
          INSERT INTO friends (user_id, friend_id, status) 
          VALUES (${userId}, ${friendId}, 'pending')
        `;

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Invalid action for POST' }, { status: 400 });
    }
  } catch (err) {
    console.error('API /friends POST error:', err);
    return NextResponse.json({ error: 'Server error', details: err.message }, { status: 500 });
  }
}
