// src/app/api/friends/search/route.js
import { NextResponse } from 'next/server';
import db from '../../auth-handler/db';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ error: 'Missing search query' }, { status: 400 });
    }

    // Search users by user_id LIKE %query%
    const result = await db.query(
      `SELECT user_id, profile_name FROM users WHERE user_id ILIKE $1 LIMIT 10`,
      [`%${query}%`]
    );

    return NextResponse.json({ users: result.rows });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
