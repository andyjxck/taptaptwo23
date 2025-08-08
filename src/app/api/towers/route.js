import { createClient } from "@supabase/supabase-js";

/**
 * Tap Tap: Towers API – Save/Load with integration to Tap Tap: Two progression
 * Requires a Supabase table "towers_progress" (save_id text PK, game_data jsonb, updated_at timestamptz).
 * Also uses "game_saves" table for global progression (renown_tokens, house_level, coins, tower_coins).
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req) {
  try {
    const { action, saveId, gameData, userId, pin, renownGain, towerCoinGain, houseGain, coinGain } = await req.json();

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: "Supabase env vars missing" }), { status: 500 });
    }
    if (!action || !saveId) {
      return new Response(JSON.stringify({ error: "Missing action or saveId" }), { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Helper: verify user credentials if provided
    if (userId !== undefined && pin !== undefined) {
      const pinStr = String(pin);
      const { data: userRow, error: userError } = await supabase
        .from("users")
        .select("user_id")
        .eq("user_id", Number(userId))
        .eq("pin", pinStr)
        .maybeSingle();
      if (userError || !userRow) {
        return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 403 });
      }
    }

    if (action === "save") {
      // Ensure game data is provided
      if (!gameData) {
        return new Response(JSON.stringify({ error: "Missing gameData for save" }), { status: 400 });
      }
      // Upsert towers game state to towers_progress table
      const { error: upsertError } = await supabase
        .from("towers_progress")
        .upsert({
          save_id: saveId,
          game_data: gameData || null,
          updated_at: new Date().toISOString(),
        });
      if (upsertError) {
        return new Response(JSON.stringify({ error: upsertError.message }), { status: 500 });
      }

      // If logged in user, update global progression in game_saves
      if (userId !== undefined && pin !== undefined) {
        // Fetch current profile values
        let { data: saveRow, error: fetchError } = await supabase
          .from("game_saves")
          .select("renown_tokens, house_level, coins, tower_coins")
          .eq("user_id", Number(userId))
          .single();
        if (fetchError) {
          // If tower_coins column is not present or any fetch error, try without it
          if (fetchError.message && fetchError.message.toLowerCase().includes("tower_coins")) {
            const { data: saveRow2, error: fetchError2 } = await supabase
              .from("game_saves")
              .select("renown_tokens, house_level, coins")
              .eq("user_id", Number(userId))
              .single();
            if (fetchError2 || !saveRow2) {
              return new Response(JSON.stringify({ error: fetchError2?.message || "Failed to fetch game save" }), { status: 500 });
            }
            saveRow = saveRow2;
          } else {
            return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 });
          }
        }
        // Calculate new totals by adding gains
        const currentRenown = Number(saveRow.renown_tokens) || 0;
        const currentHouse = Number(saveRow.house_level) || 1;
        const currentCoins = Number(saveRow.coins) || 0;
        const currentTower = saveRow.tower_coins !== undefined ? (Number(saveRow.tower_coins) || 0) : 0;
        const incRenown = Number(renownGain) || 0;
        const incHouse = Number(houseGain) || 0;
        const incCoins = Number(coinGain) || 0;
        const incTower = Number(towerCoinGain) || 0;
        const newRenown = currentRenown + incRenown;
        const newHouse = currentHouse + incHouse;
        const newCoins = currentCoins + incCoins;
        const newTower = currentTower + incTower;
        // Prepare update object
        const updateData = {
          renown_tokens: newRenown,
          house_level: newHouse,
          coins: newCoins,
        };
        if (saveRow.tower_coins !== undefined) {
          updateData.tower_coins = newTower;
        }
        const { error: updateError } = await supabase
          .from("game_saves")
          .update(updateData)
          .eq("user_id", Number(userId));
        if (updateError) {
          return new Response(JSON.stringify({ error: updateError.message }), { status: 500 });
        }
      }

      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    if (action === "load") {
      // Fetch saved towers game state (if any)
      const { data, error: loadError } = await supabase
        .from("towers_progress")
        .select("game_data")
        .eq("save_id", saveId)
        .maybeSingle();
      if (loadError) {
        return new Response(JSON.stringify({ error: loadError.message }), { status: 500 });
      }
      let gameData = data?.game_data || {};
      // If logged in, fetch global progression and merge into gameData
      if (userId !== undefined && pin !== undefined) {
        let { data: saveRow, error: fetchError } = await supabase
          .from("game_saves")
          .select("renown_tokens, house_level, coins, tower_coins")
          .eq("user_id", Number(userId))
          .single();
        if (fetchError) {
          if (fetchError.message && fetchError.message.toLowerCase().includes("tower_coins")) {
            const { data: saveRow2, error: fetchError2 } = await supabase
              .from("game_saves")
              .select("renown_tokens, house_level, coins")
              .eq("user_id", Number(userId))
              .single();
            if (!fetchError2 && saveRow2) {
              saveRow = saveRow2;
            }
          }
          // If user not found or other error, just proceed without global data
        }
        if (saveRow) {
          gameData.renownTokens = Number(saveRow.renown_tokens) || 0;
          gameData.houseLevel = Number(saveRow.house_level) || 1;
          gameData.tapCoins = Number(saveRow.coins) || 0;
          if (saveRow.tower_coins !== undefined) {
            gameData.towerCoins = Number(saveRow.tower_coins) || 0;
          } else {
            gameData.towerCoins = gameData.towerCoins ?? 0;
          }
        }
      }
      return new Response(JSON.stringify({ success: true, gameData: gameData }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400 });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Bad request", details: String(err) }), { status: 400 });
  }
}
