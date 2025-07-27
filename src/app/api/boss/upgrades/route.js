import sql from "@/app/api/utils/sql";

// Get user upgrades
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return Response.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get or create user upgrades
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

    // Calculate current stats based on levels
    const tapPower = upgrades.tap_power_level;
    const autoTapperDps = upgrades.auto_tapper_level > 0 ? Math.floor(upgrades.auto_tapper_level * 0.5) : 0;
    const critChance = Math.min(upgrades.crit_chance_level * 5, 100); // 5% per level, max 100%
    const tapSpeedBonus = upgrades.tap_speed_bonus_level * 30; // 30% per level

    // Calculate upgrade costs (exponential growth)
    const tapPowerCost = Math.floor(10 * Math.pow(1.5, upgrades.tap_power_level));
    const autoTapperCost = Math.floor(50 * Math.pow(1.8, upgrades.auto_tapper_level));
    const critChanceCost = Math.floor(100 * Math.pow(2.0, upgrades.crit_chance_level));
    const tapSpeedBonusCost = Math.floor(75 * Math.pow(1.7, upgrades.tap_speed_bonus_level));

    return Response.json({
      upgrades,
      stats: {
        tapPower,
        autoTapperDps,
        critChance,
        tapSpeedBonus
      },
      costs: {
        tapPowerCost,
        autoTapperCost,
        critChanceCost,
        tapSpeedBonusCost
      }
    });

  } catch (error) {
    console.error('Error fetching upgrades:', error);
    return Response.json({ error: 'Failed to fetch upgrades' }, { status: 500 });
  }
}

// Purchase upgrade
export async function POST(request) {
  try {
    const { userId, upgradeType } = await request.json();
    
    if (!userId || !upgradeType) {
      return Response.json({ error: 'User ID and upgrade type required' }, { status: 400 });
    }

    // Get current upgrades and user progress
    const [upgrades] = await sql`
      SELECT * FROM upgrades WHERE user_id = ${userId}
    `;

    const [progress] = await sql`
      SELECT total_coins_earned FROM boss_progress WHERE user_id = ${userId}
    `;

    if (!upgrades || !progress) {
      return Response.json({ error: 'User data not found' }, { status: 404 });
    }

    const availableCoins = progress.total_coins_earned - upgrades.total_coins_spent;

    // Calculate cost based on upgrade type and current level
    let cost = 0;
    let updateField = '';
    let currentLevel = 0;

    switch (upgradeType) {
      case 'tapPower':
        currentLevel = upgrades.tap_power_level;
        cost = Math.floor(10 * Math.pow(1.5, currentLevel));
        updateField = 'tap_power_level';
        break;
      case 'autoTapper':
        currentLevel = upgrades.auto_tapper_level;
        cost = Math.floor(50 * Math.pow(1.8, currentLevel));
        updateField = 'auto_tapper_level';
        break;
      case 'critChance':
        currentLevel = upgrades.crit_chance_level;
        if (currentLevel >= 20) { // Max 100% crit chance (20 levels * 5%)
          return Response.json({ error: 'Maximum crit chance reached' }, { status: 400 });
        }
        cost = Math.floor(100 * Math.pow(2.0, currentLevel));
        updateField = 'crit_chance_level';
        break;
      case 'tapSpeedBonus':
        currentLevel = upgrades.tap_speed_bonus_level;
        cost = Math.floor(75 * Math.pow(1.7, currentLevel));
        updateField = 'tap_speed_bonus_level';
        break;
      default:
        return Response.json({ error: 'Invalid upgrade type' }, { status: 400 });
    }

    if (availableCoins < cost) {
      return Response.json({ error: 'Insufficient coins' }, { status: 400 });
    }

    // Purchase upgrade
    const updateQuery = `
      UPDATE upgrades 
      SET ${updateField} = ${updateField} + 1, 
          total_coins_spent = total_coins_spent + $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $2 
      RETURNING *
    `;

    const [updatedUpgrades] = await sql(updateQuery, [cost, userId]);

    return Response.json({
      success: true,
      upgrades: updatedUpgrades,
      costPaid: cost,
      remainingCoins: availableCoins - cost
    });

  } catch (error) {
    console.error('Error purchasing upgrade:', error);
    return Response.json({ error: 'Failed to purchase upgrade' }, { status: 500 });
  }
}