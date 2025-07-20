// src/app/api/friends/accept/route.js

import { NextResponse } from 'next/server';

import db from '../../../auth-handler/db';


export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, friendId } = body;

    if (!userId || !friendId || userId === friendId) {
      return NextResponse.json({ error: 'Invalid user IDs' }, { status: 400 });
    }

    // Update the request to accepted
    const result = await db.query(
      `UPDATE friends
       SET status = 'accepted'
       WHERE user_id = $1 AND friend_id = $2 AND status = 'pending'`,
      [friendId, userId] // friendId originally sent the request
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
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
