import { sql } from '../auth-handler/db';

async function handler({
  action,
  userId,
  pin,
  gameState,
  itemId,
  itemType,
  price,
  newPin,
  code,
}) {
  // Always treat userId as integer everywhere
  const userIdInt = userId !== undefined && userId !== null ? parseInt(userId, 10) : null;
  const pinStr = pin !== undefined && pin !== null ? String(pin) : "";

  // Only allow getNextUserId without userId
  if (action !== "getNextUserId" && !userIdInt) {
    console.error("[HANDLER] Missing userId");
    return { error: "Missing userId" };
  }

  // Helper to parse JSON safely
  const safeParse = (str, fallback = []) => {
    try {
      if (typeof str !== "string") return fallback;
      return JSON.parse(str);
    } catch {
      return fallback;
    }
  };

  try {
    // --- getNextUserId ---
    if (action === "getNextUserId") {
      const rows = await sql`
        SELECT user_id FROM users ORDER BY user_id ASC
      `;
      let nextId = 1;
      for (const row of rows) {
        const currentId = parseInt(row.user_id, 10);
        if (currentId === nextId) {
          nextId++;
        } else if (currentId > nextId) {
          break;
        }
      }
      return { userId: nextId };
    }

    // --- Credential check for all protected actions ---
    if (
      action === "buyRegularItem" ||
      action === "buyLimitedItem" ||
      action === "save" ||
      action === "load" ||
      action === "getLeaderboard" ||
      action === "changePin" ||
      action === "hardReset" ||
      action === "redeemReferral"
    ) {
      const userResult = await sql`
        SELECT user_id, used_codes FROM users
        WHERE user_id = ${userIdInt} AND pin = ${pinStr}
      `;
      if (!userResult || userResult.length === 0) {
        return { error: "Invalid credentials" };
      }
    }

    // --- BUY REGULAR ITEM ---
    if (action === "buyRegularItem") {
      if (!itemId || !itemType || typeof price !== "number") {
        return { error: "Missing itemId, itemType, or price" };
      }
      const saveRows = await sql`
        SELECT owned_profile_icons, owned_themes, owned_boosts, renown_tokens
        FROM game_saves WHERE user_id = ${userIdInt}
      `;
      if (!saveRows || saveRows.length === 0) {
        return { error: "No save data found for user" };
      }
      const save = saveRows[0];
      const ownedProfileIcons = safeParse(save.owned_profile_icons);
      const ownedThemes = safeParse(save.owned_themes);
      const ownedBoosts = safeParse(save.owned_boosts);
      const currentTokens = Number(save.renown_tokens) || 0;
      if (currentTokens < price) {
        return { error: "Insufficient Renown Tokens" };
      }
      if (itemType === "profileIcon") {
        if (ownedProfileIcons.includes(itemId)) return { error: "You already own this item" };
        ownedProfileIcons.push(itemId);
      } else if (itemType === "theme") {
        if (ownedThemes.includes(itemId)) return { error: "You already own this item" };
        ownedThemes.push(itemId);
      } else if (itemType === "boost") {
        if (ownedBoosts.includes(itemId)) return { error: "You already own this item" };
        ownedBoosts.push(itemId);
      } else {
        return { error: "Invalid itemType" };
      }
      await sql`
        UPDATE game_saves
        SET
          owned_profile_icons = ${JSON.stringify(ownedProfileIcons)},
          owned_themes = ${JSON.stringify(ownedThemes)},
          owned_boosts = ${JSON.stringify(ownedBoosts)},
          renown_tokens = ${currentTokens - price}
        WHERE user_id = ${userIdInt}
      `;
      return { success: true };
    }

    // --- BUY LIMITED ITEM ---
    if (action === "buyLimitedItem") {
      if (!itemId || !itemType || typeof price !== "number") {
        return { error: "Missing itemId, itemType, or price" };
      }
      const stockRows = await sql`
        SELECT total_stock, sold_count FROM limited_item_stock
        WHERE item_id = ${itemId} AND item_type = ${itemType}
      `;
      if (!stockRows || stockRows.length === 0) {
        return { error: "Limited item not found" };
      }
      const { total_stock, sold_count } = stockRows[0];
      if (sold_count >= total_stock) {
        return { error: "Item is out of stock" };
      }
      const saveRows = await sql`
        SELECT owned_profile_icons, owned_themes, owned_boosts, renown_tokens
        FROM game_saves WHERE user_id = ${userIdInt}
      `;
      if (!saveRows || saveRows.length === 0) {
        return { error: "No save data found for user" };
      }
      const save = saveRows[0];
      const ownedProfileIcons = safeParse(save.owned_profile_icons);
      const ownedThemes = safeParse(save.owned_themes);
      const ownedBoosts = safeParse(save.owned_boosts);
      const currentTokens = Number(save.renown_tokens) || 0;
      if (currentTokens < price) {
        return { error: "Insufficient Renown Tokens" };
      }
      if (itemType === "profileIcon") {
        if (ownedProfileIcons.includes(itemId)) return { error: "You already own this item" };
        ownedProfileIcons.push(itemId);
      } else if (itemType === "theme") {
        if (ownedThemes.includes(itemId)) return { error: "You already own this item" };
        ownedThemes.push(itemId);
      } else if (itemType === "boost") {
        if (ownedBoosts.includes(itemId)) return { error: "You already own this item" };
        ownedBoosts.push(itemId);
      } else {
        return { error: "Invalid itemType" };
      }
      const updated = await sql`
        UPDATE limited_item_stock
        SET sold_count = sold_count + 1
        WHERE item_id = ${itemId} AND item_type = ${itemType} AND sold_count < total_stock
        RETURNING sold_count
      `;
      if (!updated || updated.length === 0) {
        return { error: "Failed to purchase: item may be out of stock" };
      }
      await sql`
        UPDATE game_saves
        SET
          owned_profile_icons = ${JSON.stringify(ownedProfileIcons)},
          owned_themes = ${JSON.stringify(ownedThemes)},
          owned_boosts = ${JSON.stringify(ownedBoosts)},
          renown_tokens = ${currentTokens - price}
        WHERE user_id = ${userIdInt}
      `;
      return { success: true };
    }

    // --- SAVE GAME STATE ---
    if (action === "save") {
      if (!gameState || typeof gameState !== "object") {
        return { error: "Invalid game state" };
      }
      if (gameState.house_name && String(gameState.house_name).length > 30) {
        return { error: "House name too long" };
      }
      const combinedUpgradeLevel =
        (Number(gameState.tap_power_upgrades) || 0) +
        (Number(gameState.auto_tapper_upgrades) || 0) +
        (Number(gameState.crit_chance_upgrades) || 0) +
        (Number(gameState.tap_speed_bonus_upgrades) || 0);
      const currentQuestText = gameState.currentQuest
        ? JSON.stringify(gameState.currentQuest)
        : null;
      const canClaimQuestBool = !!gameState.canClaimQuest;
      const ownedProfileIconsJSON = JSON.stringify(gameState.ownedProfileIcons || []);
      const profileIcon = gameState.profileIcon || null;
      const coinsEarnedThisRun = Number(gameState.coinsEarnedThisRun) || 0;
      await sql`
        INSERT INTO game_saves (
          user_id,
          coins,
          tap_power,
          auto_tapper,
          crit_chance,
          tap_speed_bonus,
          total_taps,
          total_coins_earned,
          resets,
          permanent_multiplier,
          current_season,
          total_upgrade_levels,
          house_level,
          house_decorations,
          house_theme,
          house_coins_multiplier,
          has_first_reset,
          boost_active_until,
          tap_power_upgrades,
          auto_tapper_upgrades,
          crit_chance_upgrades,
          tap_speed_bonus_upgrades,
          combined_upgrade_level,
          current_weather,
          current_year,
          house_name,
          current_quest,
          can_claim_quest,
          profile_name,
          renown_tokens,
          owned_profile_icons,
          profile_icon,
          coins_earned_this_run,
          owned_themes,
          owned_boosts,
          equipped_theme
        ) VALUES (
          ${userIdInt},
          ${Number(gameState.coins) || 0},
          ${Number(gameState.tap_power) || 1},
          ${Number(gameState.auto_tapper) || 0},
          ${Number(gameState.crit_chance) || 0},
          ${Number(gameState.tap_speed_bonus) || 0},
          ${Number(gameState.total_taps) || 0},
          ${Number(gameState.total_coins_earned) || 0},
          ${Number(gameState.resets) || 0},
          ${Number(gameState.permanent_multiplier) || 1},
          ${Number(gameState.current_season) || 0},
          ${Number(gameState.total_upgrade_levels) || 0},
          ${Number(gameState.house_level) || 1},
          ${JSON.stringify(gameState.house_decorations || [])},
          ${String(gameState.house_theme || "cottage")},
          ${Number(gameState.house_coins_multiplier) || 0},
          ${Boolean(gameState.has_first_reset)},
          ${gameState.boost_active_until || null},
          ${Number(gameState.tap_power_upgrades) || 0},
          ${Number(gameState.auto_tapper_upgrades) || 0},
          ${Number(gameState.crit_chance_upgrades) || 0},
          ${Number(gameState.tap_speed_bonus_upgrades) || 0},
          ${combinedUpgradeLevel},
          ${String(gameState.current_weather || "Clear")},
          ${Number(gameState.current_year) || 0},
          ${String(gameState.houseName || "My Cozy Home")},
          ${currentQuestText},
          ${canClaimQuestBool},
          ${String(gameState.profile_name || "Player")},
          ${Number(gameState.renownTokens) || 0},
          ${ownedProfileIconsJSON},
          ${profileIcon},
          ${Math.floor(coinsEarnedThisRun)},
          ${JSON.stringify(gameState.ownedThemes || ["seasons"])},
          ${JSON.stringify(gameState.ownedBoosts || [])},
          ${String(gameState.equippedTheme || "seasons")}
        )
        ON CONFLICT (user_id) DO UPDATE SET
          coins = EXCLUDED.coins,
          tap_power = EXCLUDED.tap_power,
          auto_tapper = EXCLUDED.auto_tapper,
          crit_chance = EXCLUDED.crit_chance,
          tap_speed_bonus = EXCLUDED.tap_speed_bonus,
          total_taps = EXCLUDED.total_taps,
          total_coins_earned = EXCLUDED.total_coins_earned,
          resets = EXCLUDED.resets,
          permanent_multiplier = EXCLUDED.permanent_multiplier,
          current_season = EXCLUDED.current_season,
          total_upgrade_levels = EXCLUDED.total_upgrade_levels,
          house_level = EXCLUDED.house_level,
          house_decorations = EXCLUDED.house_decorations,
          house_theme = EXCLUDED.house_theme,
          house_coins_multiplier = EXCLUDED.house_coins_multiplier,
          has_first_reset = EXCLUDED.has_first_reset,
          boost_active_until = EXCLUDED.boost_active_until,
          tap_power_upgrades = EXCLUDED.tap_power_upgrades,
          auto_tapper_upgrades = EXCLUDED.auto_tapper_upgrades,
          crit_chance_upgrades = EXCLUDED.crit_chance_upgrades,
          tap_speed_bonus_upgrades = EXCLUDED.tap_speed_bonus_upgrades,
          combined_upgrade_level = EXCLUDED.combined_upgrade_level,
          current_weather = EXCLUDED.current_weather,
          current_year = EXCLUDED.current_year,
          house_name = EXCLUDED.house_name,
          current_quest = EXCLUDED.current_quest,
          can_claim_quest = EXCLUDED.can_claim_quest,
          profile_name = EXCLUDED.profile_name,
          renown_tokens = EXCLUDED.renown_tokens,
          owned_profile_icons = EXCLUDED.owned_profile_icons,
          profile_icon = EXCLUDED.profile_icon,
          coins_earned_this_run = EXCLUDED.coins_earned_this_run,
          owned_themes = EXCLUDED.owned_themes,
          owned_boosts = EXCLUDED.owned_boosts,
          equipped_theme = EXCLUDED.equipped_theme,
          last_saved = CURRENT_TIMESTAMP
      `;
      await sql`
        INSERT INTO leaderboard (user_id, total_resets, total_coins_earned)
        VALUES (
          ${userIdInt},
          ${Number(gameState.resets) || 0},
          ${Number(gameState.total_coins_earned) || 0}
        )
        ON CONFLICT (user_id) DO UPDATE SET
          total_resets = EXCLUDED.total_resets,
          total_coins_earned = EXCLUDED.total_coins_earned,
          updated_at = CURRENT_TIMESTAMP
      `;
      return { success: true };
    }

    // --- LOAD GAME STATE ---
    if (action === "load") {
      const rows = await sql`
        SELECT * FROM game_saves WHERE user_id = ${userIdInt}
      `;
      if (!rows || rows.length === 0) {
        return { gameState: null };
      }
      let stockRows = [];
      try {
        stockRows = await sql`
          SELECT item_id, total_stock, sold_count FROM limited_item_stock
        `;
      } catch {}
      const limitedStock = {};
      stockRows.forEach(({ item_id, total_stock, sold_count }) => {
        limitedStock[item_id] = total_stock - sold_count;
      });
      let currentQuestObj = null;
      if (rows[0].current_quest) {
        try {
          currentQuestObj = JSON.parse(rows[0].current_quest);
        } catch {}
      }
      let ownedProfileIconsArr = [];
      try {
        ownedProfileIconsArr = rows[0].owned_profile_icons
          ? JSON.parse(rows[0].owned_profile_icons)
          : [];
      } catch {}
      let ownedBoostArr = [];
      try {
        ownedBoostArr = rows[0].owned_boosts
          ? JSON.parse(rows[0].owned_boosts)
          : [];
      } catch {}
      let ownedThemes = ["seasons"];
      if (rows[0].owned_themes) {
        if (Array.isArray(rows[0].owned_themes)) {
          ownedThemes = rows[0].owned_themes;
        } else if (typeof rows[0].owned_themes === "string") {
          try {
            const parsed = JSON.parse(rows[0].owned_themes);
            if (Array.isArray(parsed)) ownedThemes = parsed;
          } catch {}
        }
      }
      const equippedTheme = rows[0].equipped_theme || "seasons";
      return {
        gameState: {
          ...rows[0],
          houseLevel: rows[0].house_level ?? 1,
          renownTokens: rows[0].renown_tokens ?? 0,
          totalCoinsEarned: Number(rows[0].total_coins_earned) || 0,
          coinsEarnedThisRun: Number(rows[0].coins_earned_this_run) || 0,
          currentQuest: currentQuestObj,
          canClaimQuest: !!rows[0].can_claim_quest,
          ownedProfileIcons: ownedProfileIconsArr,
          profileIcon: rows[0].profile_icon || null,
          ownedThemes,
          ownedBoosts: ownedBoostArr,
          equippedTheme,
          limitedStock,
        },
      };
    }

    // --- GET LEADERBOARD ---
    if (action === "getLeaderboard") {
      const topCoins = await sql`
        SELECT l.user_id, l.total_coins_earned, g.profile_name, g.profile_icon
        FROM leaderboard l
        LEFT JOIN game_saves g ON l.user_id = g.user_id
        ORDER BY l.total_coins_earned DESC
        LIMIT 10
      `;
      const topRenown = await sql`
        SELECT l.user_id, g.renown_tokens, g.profile_name, g.profile_icon
        FROM leaderboard l
        LEFT JOIN game_saves g ON l.user_id = g.user_id
        ORDER BY g.renown_tokens DESC
        LIMIT 10
      `;
      return {
        coins: topCoins.map((row) => ({
          user_id: row.user_id,
          total_coins_earned: row.total_coins_earned,
          profile_name: row.profile_name || "Player",
          profile_icon: row.profile_icon || null,
        })),
        renown: topRenown.map((row) => ({
          user_id: row.user_id,
          renown_tokens: row.renown_tokens,
          profile_name: row.profile_name || "Player",
          profile_icon: row.profile_icon || null,
        })),
      };
    }

    // --- CHANGE PIN ---
    if (action === "changePin") {
      if (!pin || !userIdInt || !newPin) {
        return { error: "Missing parameters" };
      }
      await sql`
        UPDATE users
        SET pin = ${newPin}
        WHERE user_id = ${userIdInt}
      `;
      return { success: true };
    }

    // --- HARD RESET ---
    if (action === "hardReset") {
      await sql`
        DELETE FROM game_saves WHERE user_id = ${userIdInt}
      `;
      await sql`
        DELETE FROM leaderboard WHERE user_id = ${userIdInt}
      `;
      return { success: true };
    }

// --- REDEEM REFERRAL / PROMO CODES ---
if (action === "redeemReferral") {
  const allIcons = [
    "tree","seedling","cloudMoon","sun","star","alien","fire","ghost","cat","unicorn","robot","crown",
    "icecream","rocket","rainbow","mouse","frog","fox","penguin","bunny","duck","hamster","owl","hedgehog",
    "panda","monkey","logo","maddox","bee","butterfly","ladybug","chick","dog","bear","dolphin","whale",
    "snail","peach","avocado","mushroom","cherry","cookie","diamond","dragon","mermaid","wizard",
    "crystalball","cactus","volcano","jellyfish","starstruck","medal",
  ];
  const allThemes = [
    "heaven","hell","maddoxtheme","space","city_night","midnight","island","barn","city","forest","beach","seasons",
  ];

  const codeName = typeof code === "string" ? code.toLowerCase().trim() : "";
  if (!codeName) return { error: "No code provided" };

  // Always parse userId to integer for SQL lookups
  const userIdInt = userId !== undefined && userId !== null ? parseInt(userId, 10) : null;
  if (!userIdInt) return { error: "Missing or invalid user ID" };

  // 1. Load game_saves row
  let saveRows;
  try {
    saveRows = await sql`SELECT * FROM game_saves WHERE user_id = ${userIdInt}`;
  } catch (err) {
    return { error: "Database error fetching game save" };
  }
  if (!saveRows || saveRows.length === 0) {
    return { error: "Game save not found" };
  }
  const save = saveRows[0];

  // 2. Load used codes for this user (for one-time redemption)
  let usedCodes = [];
  try {
    const userInfo = await sql`SELECT used_codes FROM users WHERE user_id = ${userIdInt}`;
    if (userInfo && userInfo.length > 0 && userInfo[0].used_codes) {
      usedCodes = JSON.parse(userInfo[0].used_codes);
    }
  } catch {}
  if (!Array.isArray(usedCodes)) usedCodes = [];

  // Prevent repeat usage
  if (usedCodes.includes(codeName)) {
    return { error: "Code already used" };
  }

  // --- Maddox code ---
  if (codeName === "maddox") {
    let houseLevel = (Number(save.house_level) || 1) + 5;
    let tap_power_upgrades = Number(save.tap_power_upgrades) || 0;
    let auto_tapper_upgrades = Number(save.auto_tapper_upgrades) || 0;
    let crit_chance_upgrades = Number(save.crit_chance_upgrades) || 0;
    let tap_speed_bonus_upgrades = Number(save.tap_speed_bonus_upgrades) || 0;
    let house_coins_multiplier = (Number(save.house_coins_multiplier) || 0) + 0.5;

    // Distribute 10 random upgrade points
    let remain = 10;
    const upgKeys = ["tap_power_upgrades", "auto_tapper_upgrades", "crit_chance_upgrades", "tap_speed_bonus_upgrades"];
    const upgradeValues = [0, 0, 0, 0];
    for (let i = 0; i < upgKeys.length; i++) {
      if (i === upgKeys.length - 1) {
        upgradeValues[i] = remain;
      } else {
        const rand = Math.floor(Math.random() * (remain + 1));
        upgradeValues[i] = rand;
        remain -= rand;
      }
    }
    tap_power_upgrades += upgradeValues[0];
    auto_tapper_upgrades += upgradeValues[1];
    crit_chance_upgrades += upgradeValues[2];
    tap_speed_bonus_upgrades += upgradeValues[3];

    // Icons
    let ownedProfileIcons = [];
    try {
      ownedProfileIcons = save.owned_profile_icons
        ? JSON.parse(save.owned_profile_icons)
        : [];
    } catch {}
    if (!Array.isArray(ownedProfileIcons)) ownedProfileIcons = [];
    if (!ownedProfileIcons.includes("maddox"))
      ownedProfileIcons.push("maddox");
    const availableRandomIcons = allIcons.filter(
      (x) => x !== "maddox" && !ownedProfileIcons.includes(x)
    );
    if (availableRandomIcons.length > 0) {
      const randIcon =
        availableRandomIcons[
          Math.floor(Math.random() * availableRandomIcons.length)
        ];
      ownedProfileIcons.push(randIcon);
    }
    const profileIcon = "maddox";

    // Themes
    let ownedThemes = [];
    try {
      ownedThemes = save.owned_themes
        ? typeof save.owned_themes === "string"
          ? JSON.parse(save.owned_themes)
          : save.owned_themes
        : [];
    } catch {}
    if (!Array.isArray(ownedThemes)) ownedThemes = [];
    if (!ownedThemes.includes("seasons")) ownedThemes.push("seasons");
    if (!ownedThemes.includes("maddoxtheme")) ownedThemes.push("maddoxtheme");
    const availableThemes = allThemes.filter(
      (t) => t !== "maddoxtheme" && t !== "seasons" && !ownedThemes.includes(t)
    );
    if (availableThemes.length > 0) {
      const randTheme = availableThemes[Math.floor(Math.random() * availableThemes.length)];
      ownedThemes.push(randTheme);
    }

    const renownTokens = (Number(save.renown_tokens) || 0) + 10;
    const coins = (Number(save.coins) || 0) + 10000;
    usedCodes.push(codeName);

    try {
      await sql`
        UPDATE game_saves
        SET
          house_level = ${houseLevel},
          house_coins_multiplier = ${house_coins_multiplier},
          tap_power_upgrades = ${tap_power_upgrades},
          auto_tapper_upgrades = ${auto_tapper_upgrades},
          crit_chance_upgrades = ${crit_chance_upgrades},
          tap_speed_bonus_upgrades = ${tap_speed_bonus_upgrades},
          owned_profile_icons = ${JSON.stringify(ownedProfileIcons)},
          profile_icon = ${profileIcon},
          owned_themes = ${JSON.stringify(ownedThemes)},
          equipped_theme = 'maddoxtheme',
          renown_tokens = ${renownTokens},
          coins = ${coins},
          profile_name = ${save.profile_name || "Player"}
        WHERE user_id = ${userIdInt}
      `;
      await sql`
        UPDATE users SET used_codes = ${JSON.stringify(usedCodes)}
        WHERE user_id = ${userIdInt}
      `;

      // --- RECALCULATE CORE STATS AFTER UPDATES ---
      const newSaveRows = await sql`SELECT * FROM game_saves WHERE user_id = ${userIdInt}`;
      if (newSaveRows && newSaveRows.length > 0) {
        const n = newSaveRows[0];
        const tapPower =
          (1 + (Number(n.tap_power_upgrades) || 0)) *
          (Number(n.permanent_multiplier) || 1) *
          (1 + (Number(n.house_coins_multiplier) || 0));
        const autoTapper =
          (Number(n.auto_tapper_upgrades) || 0) *
          (Number(n.permanent_multiplier) || 1) *
          (1 + (Number(n.house_coins_multiplier) || 0));
        const critChance = (Number(n.crit_chance_upgrades) || 0) * 0.25;
        const tapSpeedBonus =
          (Number(n.tap_speed_bonus_upgrades) || 0) * 0.05;

        await sql`
          UPDATE game_saves
          SET
            tap_power = ${tapPower},
            auto_tapper = ${autoTapper},
            crit_chance = ${critChance},
            tap_speed_bonus = ${tapSpeedBonus}
          WHERE user_id = ${userIdInt}
        `;
      }
    } catch (err) {
      return { error: "Database error applying code" };
    }
    return { success: true, message: "Maddox promo code applied!" };
  }

  // --- Andysocial code ---
  else if (codeName === "andysocial") {
    let houseLevel = (Number(save.house_level) || 1) + 10;
    let tap_power_upgrades = Number(save.tap_power_upgrades) || 0;
    let auto_tapper_upgrades = Number(save.auto_tapper_upgrades) || 0;
    let crit_chance_upgrades = Number(save.crit_chance_upgrades) || 0;
    let tap_speed_bonus_upgrades = Number(save.tap_speed_bonus_upgrades) || 0;
    let house_coins_multiplier = (Number(save.house_coins_multiplier) || 0) + 0.75;

    // Give 20 points to two random upgrade stats
    const upgKeys = [
      "tap_power_upgrades",
      "auto_tapper_upgrades",
      "crit_chance_upgrades",
      "tap_speed_bonus_upgrades",
    ];
    const selected = [];
    while (selected.length < 2) {
      const rand = Math.floor(Math.random() * upgKeys.length);
      if (!selected.includes(rand)) selected.push(rand);
    }
    const upgAdd = [0, 0, 0, 0];
    const randVal = Math.floor(Math.random() * 21);
    upgAdd[selected[0]] = randVal;
    upgAdd[selected[1]] = 20 - randVal;
    tap_power_upgrades += upgAdd[0];
    auto_tapper_upgrades += upgAdd[1];
    crit_chance_upgrades += upgAdd[2];
    tap_speed_bonus_upgrades += upgAdd[3];

    const renownTokens = (Number(save.renown_tokens) || 0) + 100;

    let ownedProfileIcons = [];
    try {
      ownedProfileIcons = save.owned_profile_icons
        ? JSON.parse(save.owned_profile_icons)
        : [];
    } catch {}
    if (!Array.isArray(ownedProfileIcons)) ownedProfileIcons = [];
    const iconPool = allIcons.filter(
      (x) => x !== "maddox" && !ownedProfileIcons.includes(x)
    );
    for (let i = 0; i < 3 && iconPool.length > 0; i++) {
      const idx = Math.floor(Math.random() * iconPool.length);
      ownedProfileIcons.push(iconPool[idx]);
      iconPool.splice(idx, 1);
    }

    let ownedThemes = [];
    try {
      ownedThemes = save.owned_themes
        ? typeof save.owned_themes === "string"
          ? JSON.parse(save.owned_themes)
          : save.owned_themes
        : [];
    } catch {}
    if (!Array.isArray(ownedThemes)) ownedThemes = [];
    if (!ownedThemes.includes("seasons")) ownedThemes.push("seasons");
    const themePool = allThemes.filter(
      (t) =>
        t !== "maddoxtheme" &&
        !ownedThemes.includes(t) &&
        !t.toLowerCase().includes("limited")
    );
    let randTheme = null;
    if (themePool.length > 0) {
      randTheme = themePool[Math.floor(Math.random() * themePool.length)];
      ownedThemes.push(randTheme);
    }

    usedCodes.push(codeName);

    try {
      await sql`
        UPDATE game_saves
        SET
          house_level = ${houseLevel},
          house_coins_multiplier = ${house_coins_multiplier},
          tap_power_upgrades = ${tap_power_upgrades},
          auto_tapper_upgrades = ${auto_tapper_upgrades},
          crit_chance_upgrades = ${crit_chance_upgrades},
          tap_speed_bonus_upgrades = ${tap_speed_bonus_upgrades},
          owned_profile_icons = ${JSON.stringify(ownedProfileIcons)},
          owned_themes = ${JSON.stringify(ownedThemes)},
          renown_tokens = ${renownTokens}
        WHERE user_id = ${userIdInt}
      `;
      await sql`
        UPDATE users SET used_codes = ${JSON.stringify(usedCodes)}
        WHERE user_id = ${userIdInt}
      `;

      // --- RECALCULATE CORE STATS AFTER UPDATES ---
      const newSaveRows = await sql`SELECT * FROM game_saves WHERE user_id = ${userIdInt}`;
      if (newSaveRows && newSaveRows.length > 0) {
        const n = newSaveRows[0];
        const tapPower =
          (1 + (Number(n.tap_power_upgrades) || 0)) *
          (Number(n.permanent_multiplier) || 1) *
          (1 + (Number(n.house_coins_multiplier) || 0));
        const autoTapper =
          (Number(n.auto_tapper_upgrades) || 0) *
          (Number(n.permanent_multiplier) || 1) *
          (1 + (Number(n.house_coins_multiplier) || 0));
        const critChance = (Number(n.crit_chance_upgrades) || 0) * 0.25;
        const tapSpeedBonus =
          (Number(n.tap_speed_bonus_upgrades) || 0) * 0.05;

        await sql`
          UPDATE game_saves
          SET
            tap_power = ${tapPower},
            auto_tapper = ${autoTapper},
            crit_chance = ${critChance},
            tap_speed_bonus = ${tapSpeedBonus}
          WHERE user_id = ${userIdInt}
        `;
      }
    } catch (err) {
      return { error: "Database error applying code" };
    }

    return {
      success: true,
      message: "Andysocial promo code applied!",
    };
  }

  // ---- Add more codes here if you want in future! ----

  return { error: "Invalid or unsupported code" };
}


  } catch (err) {
    return {
      error: "Internal server error",
      details: err?.message || String(err),
      stack: err?.stack,
    };
  }
}

export async function POST(request) {
  const json = await request.json();
  return handler(json);
}
