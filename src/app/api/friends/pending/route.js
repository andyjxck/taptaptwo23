// src/app/api/friends/pending/route.js

import { NextResponse } from 'next/server';

import db from '../../auth-handler/db';


export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Get pending friend requests sent TO this user
    const result = await db.query(
      `SELECT friends.user_id, users.profile_name 
       FROM friends
       JOIN users ON friends.user_id = users.user_id
       WHERE friends.friend_id = $1 AND friends.status = 'pending'`,
      [userId]
    );

    return NextResponse.json({ pending: result.rows });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
