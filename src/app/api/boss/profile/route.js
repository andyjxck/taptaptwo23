import sql from "@/app/api/utils/sql";

// Get user profile and stats
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'demo_user';

    // Get or create user profile
    let [profile] = await sql`
      SELECT * FROM user_profiles WHERE user_id = ${userId}
    `;

    if (!profile) {
      // Create default profile
      [profile] = await sql`
        INSERT INTO user_profiles (user_id, profile_name, profile_icon) 
        VALUES (${userId}, 'Fire Warrior', '🔥') 
        RETURNING *
      `;
    }

    // Get boss progress
    let [progress] = await sql`
      SELECT * FROM boss_progress WHERE user_id = ${userId}
    `;

    if (!progress) {
      // Create default progress
      [progress] = await sql`
        INSERT INTO boss_progress (user_id, current_level, total_coins_earned) 
        VALUES (${userId}, 1, 0) 
        RETURNING *
      `;
    }

    // Get upgrades
    let [upgrades] = await sql`
      SELECT * FROM upgrades WHERE user_id = ${userId}
    `;

    if (!upgrades) {
      // Create default upgrades
      [upgrades] = await sql`
        INSERT INTO upgrades (user_id) 
        VALUES (${userId}) 
        RETURNING *
      `;
    }

    // Calculate total level (boss level + upgrade levels)
    const upgradeLevel = upgrades.tap_power_level + upgrades.auto_tapper_level + 
                        upgrades.crit_chance_level + upgrades.tap_speed_bonus_level;
    const totalLevel = progress.current_level + upgradeLevel;

    // Calculate available coins
    const availableCoins = progress.total_coins_earned - upgrades.total_coins_spent;

    // Update profile total level
    await sql`
      UPDATE user_profiles 
      SET total_level = ${totalLevel}, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${userId}
    `;

    return Response.json({
      profile: {
        ...profile,
        total_level: totalLevel
      },
      stats: {
        bossLevel: progress.current_level,
        totalCoins: progress.total_coins_earned,
        availableCoins: availableCoins,
        upgradeLevel: upgradeLevel,
        weeklyBest: progress.weekly_best_level
      }
    });

  } catch (error) {
    console.error('Error fetching profile:', error);
    return Response.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

// Update user profile
export async function POST(request) {
  try {
    const { userId, profileName, profileIcon } = await request.json();
    
    if (!userId) {
      return Response.json({ error: 'User ID required' }, { status: 400 });
    }

    const [updatedProfile] = await sql`
      UPDATE user_profiles 
      SET profile_name = COALESCE(${profileName}, profile_name),
          profile_icon = COALESCE(${profileIcon}, profile_icon),
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${userId}
      RETURNING *
    `;

    if (!updatedProfile) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    return Response.json({
      success: true,
      profile: updatedProfile
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    return Response.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}