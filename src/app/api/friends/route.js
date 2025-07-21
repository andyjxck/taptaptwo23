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
                 gs.profile_icon,       -- <== included here
                 gs.total_taps,
                 gs.combined_upgrade_level,
                 gs.total_coins_earned
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
          SELECT f.user_id, gs.profile_name, gs.profile_icon, gs.house_name,
                 gs.total_taps, gs.combined_upgrade_level, gs.total_coins_earned
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
          SELECT user_id, profile_name, profile_icon, house_name, total_taps, combined_upgrade_level, total_coins_earned
          FROM game_saves
          WHERE CAST(user_id AS TEXT) = ${query}
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
