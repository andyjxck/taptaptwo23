import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { userId, action, gameData } = await req.json();

  if (!userId) {
    return new Response(JSON.stringify({ error: "Missing userId" }), { status: 400 });
  }

  if (action === "save") {
    const { data, error } = await supabase
      .from("towers_progress")
      .upsert({ user_id: userId, game_data: gameData, updated_at: new Date() });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  }

  if (action === "load") {
    const { data, error } = await supabase
      .from("towers_progress")
      .select("game_data")
      .eq("user_id", userId)
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
    return new Response(JSON.stringify({ success: true, gameData: data?.game_data || null }), { status: 200 });
  }

  return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400 });
}
