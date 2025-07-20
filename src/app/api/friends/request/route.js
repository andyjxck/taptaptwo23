// src/app/api/friends/request/route.js

import { NextResponse } from 'next/server';
import db from '../../auth-handler/db'; // adjust if it's not exactly like this

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, friendId } = body;

    if (!userId || !friendId || userId === friendId) {
      return NextResponse.json({ error: 'Invalid user IDs' }, { status: 400 });
    }

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
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
