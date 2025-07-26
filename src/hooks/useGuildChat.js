import { useEffect, useState } from 'react';
import { supabase } from '@/utilities/supabaseClient';

export const useGuildChat = (guildId) => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!guildId) return;

    // Fetch existing
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("guild_chat")
        .select("*")
        .eq("guild_id", guildId)
        .order("inserted_at", { ascending: true })
        .limit(100);

      if (!error) setMessages(data);
    };

    fetchMessages();

    // Realtime subscribe
    const channel = supabase
      .channel(`guild_chat:guild_${guildId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'guild_chat',
        filter: `guild_id=eq.${guildId}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [guildId]);

  return messages;
};
