import { createClient } from "@supabase/supabase-js";

/**
 * Towers API – single POST route: {action: "load" | "save"}
 * Tables:
 * - game_saves (existing): renown_tokens, house_level, coins, [optional] tower_coins, user_id
 * - towers_progress (new): save_id text PK, game_data jsonb, updated_at timestamptz
 *
 * If `tower_coins` column doesn’t exist in game_saves, we skip updating it (compat-safe).
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req) {
  try {
    const payload = await req.json();
    const { action, saveId, gameData, userId, pin, renownGain, towerCoinGain, houseGain, coinGain } = payload || {};

    if (!supabaseUrl || !supabaseServiceKey) {
      return resp(500, { error: "Missing Supabase env vars" });
    }
    if (!action || !saveId) {
      return resp(400, { error: "Missing action or saveId" });
    }

    const db = createClient(supabaseUrl, supabaseServiceKey);

    // optional auth check
    if (userId !== undefined && pin !== undefined) {
      const pinStr = String(pin);
      const { data: userRow, error: userErr } = await db
        .from("users")
        .select("user_id")
        .eq("user_id", Number(userId))
        .eq("pin", pinStr)
        .maybeSingle();
      if (userErr || !userRow) return resp(403, { error: "Invalid credentials" });
    }

    if (action === "save") {
      if (!gameData) return resp(400, { error: "Missing gameData" });

      // upsert towers_progress
      const { error: upErr } = await db
        .from("towers_progress")
        .upsert({ save_id: saveId, game_data: gameData, updated_at: new Date().toISOString() });
      if (upErr) return resp(500, { error: upErr.message });

      // apply progression if logged-in
      if (userId !== undefined && pin !== undefined) {
        // load current profile
        let { data: row, error: getErr } = await db
          .from("game_saves")
          .select("renown_tokens, house_level, coins, tower_coins")
          .eq("user_id", Number(userId))
          .single();

        if (getErr) {
          // handle missing tower_coins column
          if (String(getErr.message || "").toLowerCase().includes("tower_coins")) {
            const { data: row2, error: getErr2 } = await db
              .from("game_saves")
              .select("renown_tokens, house_level, coins")
              .eq("user_id", Number(userId))
              .single();
            if (getErr2 || !row2) return resp(500, { error: getErr2?.message || "Failed fetch game_saves" });
            row = row2;
          } else {
            return resp(500, { error: getErr.message });
          }
        }

        const curRen = Number(row.renown_tokens) || 0;
        const curHou = Number(row.house_level) || 1;
        const curCoi = Number(row.coins) || 0;
        const curTow = row.tower_coins !== undefined ? (Number(row.tower_coins) || 0) : 0;

        const incRen = Number(renownGain) || 0;
        const incHou = Number(houseGain) || 0;
        const incCoi = Number(coinGain) || 0;
        const incTow = Number(towerCoinGain) || 0;

        const update = {
          renown_tokens: curRen + incRen,
          house_level:   curHou + incHou,
          coins:         curCoi + incCoi,
        };
        if (row.tower_coins !== undefined) update.tower_coins = curTow + incTow;

        const { error: updErr } = await db.from("game_saves").update(update).eq("user_id", Number(userId));
        if (updErr) return resp(500, { error: updErr.message });
      }

      return resp(200, { success: true });
    }

    if (action === "load") {
      const { data: prog, error: progErr } = await db
        .from("towers_progress")
        .select("game_data")
        .eq("save_id", saveId)
        .maybeSingle();
      if (progErr) return resp(500, { error: progErr.message });

      let gameDataOut = prog?.game_data || {};

      if (userId !== undefined && pin !== undefined) {
        let { data: row, error: getErr } = await db
          .from("game_saves")
          .select("renown_tokens, house_level, coins, tower_coins")
          .eq("user_id", Number(userId))
          .single();

        if (getErr) {
          if (String(getErr.message || "").toLowerCase().includes("tower_coins")) {
            const { data: row2, error: getErr2 } = await db
              .from("game_saves")
              .select("renown_tokens, house_level, coins")
              .eq("user_id", Number(userId))
              .single();
            if (!getErr2 && row2) row = row2;
          }
        }

        if (row) {
          gameDataOut.renownTokens = Number(row.renown_tokens) || 0;
          gameDataOut.houseLevel   = Number(row.house_level)   || 1;
          gameDataOut.tapCoins     = Number(row.coins)         || 0;
          gameDataOut.towerCoins   = row.tower_coins !== undefined ? (Number(row.tower_coins) || 0) : (gameDataOut.towerCoins ?? 0);
        }
      }

      return resp(200, { success: true, gameData: gameDataOut });
    }

    return resp(400, { error: "Invalid action" });
  } catch (e) {
    return resp(400, { error: "Bad request", details: String(e) });
  }
}

function resp(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}
