import { NextResponse } from 'next/server';
import db from '../../auth-handler/db'; // adjust path if needed

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const result = await db.query(
      `SELECT friend_id FROM friends
       WHERE user_id = $1 AND status = 'accepted'`,
      [userId]
    );

    const friendIds = result.rows.map(row => row.friend_id);

    return NextResponse.json({ friends: friendIds });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
