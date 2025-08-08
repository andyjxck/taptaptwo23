import { createClient } from "@supabase/supabase-js";

// Save/load anonymous game progress by saveId
export async function POST(req) {
  try {
    const { action, saveId, gameData } = await req.json();

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "Supabase env vars missing" }), { status: 500 });
    }
    if (!action || !saveId) {
      return new Response(JSON.stringify({ error: "Missing action or saveId" }), { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    if (action === "save") {
      const { error } = await supabase
        .from("arcanesiege_progress")
        .upsert({
          save_id: saveId,
          game_data: gameData || null,
          updated_at: new Date().toISOString(),
        });
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    if (action === "load") {
      const { data, error } = await supabase
        .from("arcanesiege_progress")
        .select("game_data")
        .eq("save_id", saveId)
        .maybeSingle();
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      return new Response(JSON.stringify({ success: true, gameData: data?.game_data || null }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400 });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Bad request", details: String(err) }), { status: 400 });
  }
}
