'use client';
import { useState } from 'react';
import { useGuildChat } from '@/hooks/useGuildChat';
import { supabase } from '@/lib/supabaseClient';

export default function GuildChat({ guildId, userId, profile_name, profile_icon }) {
  const messages = useGuildChat(guildId);
  const [input, setInput] = useState('');

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    const { error } = await supabase.from("guild_chat").insert({
      guild_id: guildId,
      user_id: userId,
      profile_name,
      profile_icon,
      message: trimmed.slice(0, 200),
    });

    if (!error) setInput('');
    else console.error("Send failed:", error);
  };

  return (
    <div className="flex flex-col h-[400px] bg-white/10 rounded-lg p-4">
      <div className="flex-1 overflow-y-auto space-y-2">
        {messages.map((msg) => (
          <div key={msg.id} className="text-sm">
            <span className="font-bold">{msg.profile_name}:</span> {msg.message}
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} className="mt-4 flex gap-2">
        <input
          className="flex-1 rounded-lg px-3 py-2 bg-white/20 text-white border border-white/30"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
        />
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Send
        </button>
      </form>
    </div>
  );
}
