// src/app/api/friends/route.js

import { NextResponse } from 'next/server';
import db from '../../auth-handler/db';

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

        const result = await db.query(
          `SELECT friend_id FROM friends WHERE user_id = $1 AND status = 'accepted'`,
          [userId]
        );
        const friendIds = result.rows.map(row => row.friend_id);
        return NextResponse.json({ friends: friendIds });
      }

      case 'pending': {
        const userId = searchParams.get('userId');
        if (!userId) {
          return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        const result = await db.query(
          `SELECT friends.user_id, users.profile_name 
           FROM friends
           JOIN users ON friends.user_id = users.user_id
           WHERE friends.friend_id = $1 AND friends.status = 'pending'`,
          [userId]
        );
        return NextResponse.json({ pending: result.rows });
      }

      case 'search': {
        const query = searchParams.get('q');
        if (!query) {
          return NextResponse.json({ error: 'Missing search query' }, { status: 400 });
        }

        const result = await db.query(
          `SELECT user_id, profile_name FROM users WHERE user_id ILIKE $1 LIMIT 10`,
          [`%${query}%`]
        );
        return NextResponse.json({ users: result.rows });
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
        // Update the request to accepted
        const result = await db.query(
          `UPDATE friends
           SET status = 'accepted'
           WHERE user_id = $1 AND friend_id = $2 AND status = 'pending'`,
          [friendId, userId] // friendId sent the request originally
        );

        if (result.rowCount === 0) {
          return NextResponse.json({ error: 'No pending request found' }, { status: 404 });
        }

        // Mirror the accepted relationship
        await db.query(
          `INSERT INTO friends (user_id, friend_id, status)
           VALUES ($1, $2, 'accepted')`,
          [userId, friendId]
        );

        return NextResponse.json({ success: true });
      }

      case 'request': {
        // Check if request already exists
        const existing = await db.query(
          `SELECT * FROM friends WHERE user_id = $1 AND friend_id = $2`,
          [userId, friendId]
        );

        if (existing.rows.length > 0) {
          return NextResponse.json({ error: 'Friend request already exists' }, { status: 409 });
        }

        // Insert pending friend request
        await db.query(
          `INSERT INTO friends (user_id, friend_id, status) VALUES ($1, $2, 'pending')`,
          [userId, friendId]
        );

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
