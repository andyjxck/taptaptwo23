"use client";
import React, { useState, useEffect } from "react";
import AdBanner from "@/components/AdBanner";

// Glassy card wrapper for logs
const GlassCard = ({ children }) => (
  <div className="rounded-3xl shadow-2xl bg-white/20 backdrop-blur-xl border border-white/40 px-4 py-5 mb-3">
    {children}
  </div>
);

const devLogs = [
  {
    id: "v2_1_guilds",
    date: "30/07/2025",
    title: "🎉 The Guild Update",
    emoji: "✨",
    highlights: [
       {
        icon: "🌟",
        label: "New Features & Improvements",
        text: [
          "Redesigned the /help and /notice-board pages! They now look much better and are easier to navigate.",
          "Added Guilds! You can now create or join a guild with your friends. Guilds show up in the Friends tab under 'Guilds'.",
          "Guilds have their own chat! ⚠️  Remember, your profile name is visible to other guild members in chat and the guild list. Please don’t use your real name or sensitive info.",
          "You can leave a guild any time, or disband it if you’re the leader. Guilds track total House Level as their score.",
          "Reminder: Battle Mode is LIVE! Try it out to earn extra Renown Tokens and test your tapping speed.",
          "We’re teasing something BIG: /boss mode is in the works! (No spoilers yet. Get your upgrades ready.)"
        ]
      },
      {
        icon: "🐛",
        label: "General Bug Fixes",
        text: [
          "Fixed Offline Earnings so they show up again. Removed the 'offline earnings' pop-up for a smoother experience.",
          "Fixed the AI in Battle Mode (still a work in progress, but it's smarter now!).",
          "Fixed how the Renown Multiplier is calculated and displayed across the game.",
          "Fixed some bugs with friends and guild features.",
          "General bug fixes and UI polish."
        ]
      }
    ],
    notes: [
      "If you find any bugs or want to suggest improvements, use the in-game feedback. We read every message!",
      "Thank you for playing Tap Tap: Two. Expect more soon! 🚀"
    ]
  },
  {
    id: "v2_0_battlemode",
    date: "16/07/2025",
    title: "🔥 Battle Mode, Weather, & More!",
    emoji: "🚀",
    highlights: [
      {
        icon: "⚔️",
        label: "Battle Mode",
        text: [
          "You can now battle friends or AI to compete for the highest coin total in 3 minutes!",
          "Play for fun or Renown rewards. Try different strategies to win."
        ]
      },
      {
        icon: "🌦️",
        label: "Seasons & Weather",
        text: [
          "Seasons and dynamic weather now change gameplay. Some weather boosts your earnings or tap speed, others might slow you down. Watch the skies!"
        ]
      },
      {
        icon: "🎨",
        label: "Cosmetics",
        text: [
          "New profile icons, house names, and themes added! Express yourself in style."
        ]
      }
    ],
    notes: [
      "Full details always in the Help Board. Enjoy the new content!"
    ]
  }
];

function NoticeBoard() {
  const [activeId, setActiveId] = useState(devLogs[0].id);

  useEffect(() => { window.scrollTo(0, 0); }, [activeId]);
  const activeLog = devLogs.find(log => log.id === activeId);

  // Only show the personal message on the latest log
  const showPersonalMsg = activeLog.id === devLogs[0].id;

  return (
    <div className="min-h-screen w-full relative fade-gradient-bg">
      {/* Blurred background lights */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-1/4 top-12 w-56 h-56 bg-pink-300 rounded-full opacity-20 blur-3xl" />
        <div className="absolute right-8 bottom-12 w-60 h-60 bg-purple-400 rounded-full opacity-15 blur-2xl" />
        <div className="absolute left-4 bottom-24 w-32 h-32 bg-blue-200 rounded-full opacity-20 blur-2xl" />
      </div>
      {/* Main container */}
      <div className="relative z-10 max-w-4xl mx-auto px-2 pb-8 pt-8 flex flex-col items-center">
        {/* Title */}
        <h1 className="text-[2.3rem] md:text-4xl font-bold mb-2 text-gray-900 drop-shadow-lg tracking-tight" style={{fontFamily: "Crimson Text, serif"}}>Notice Board</h1>
        <button
          className="mb-4 px-6 py-2 rounded-xl bg-white/40 text-purple-900 font-semibold shadow-md border border-white/30 hover:bg-white/70 transition"
          onClick={() => window.location.href = "/"}
        >
          ← Return to Tap Tap: Two
        </button>
        {/* Card */}
        <div className="flex flex-col md:flex-row w-full gap-4 md:gap-8 bg-white/20 rounded-3xl shadow-2xl backdrop-blur-xl border border-white/40 px-1 pt-2 pb-4 md:p-6">
          {/* Sidebar */}
          <nav className="md:w-1/3 mb-2 md:mb-0 flex flex-row md:flex-col overflow-x-auto gap-2 md:gap-2 p-2 md:p-0">
            <ul className="w-full">
              {devLogs.map(log => (
                <li key={log.id} className="mb-1">
                  <button
                    onClick={() => setActiveId(log.id)}
                    className={`w-full flex items-center px-3 py-2 rounded-xl font-semibold transition-colors duration-200 ${
                      activeId === log.id
                        ? "bg-white/80 text-purple-900 shadow"
                        : "text-gray-700 hover:bg-white/30"
                    }`}
                  >
                    <span className="text-xl mr-2">{log.emoji}</span>
                    <span className="truncate">{log.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          {/* Content */}
          <div className="flex-1 min-w-0 px-2 py-1">
            <GlassCard>
              {/* Personal message at the top of the newest update */}
              {showPersonalMsg && (
                <div className="mb-4 text-gray-500 italic text-base">
                  Hey guys. I'm working hard to make this whole site look a bit better. I've started with some of the back pages, and I'm so happy with how it's coming along.<br />
                  <span className="font-semibold">Happy Tapping! Andy</span>
                </div>
              )}
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{activeLog.emoji}</span>
                  <span className="text-lg md:text-xl font-bold text-purple-900 drop-shadow">{activeLog.title}</span>
                </div>
                <div className="text-sm text-gray-500 mb-2">{activeLog.date}</div>
              </div>
              {activeLog.highlights.map(({ icon, label, text }) => (
                <div key={label} className="mb-3">
                  <div className="flex items-center gap-1 font-semibold text-gray-800 mb-1">
                    <span className="text-lg">{icon}</span>
                    <span>{label}</span>
                  </div>
                  <ul className="list-disc pl-7 space-y-1">
                    {text.map((t, i) => (
                      <li key={i} className="text-gray-700">{t}</li>
                    ))}
                  </ul>
                </div>
              ))}
              {activeLog.notes && (
                <div className="mt-4 pt-2 border-t border-white/10 text-purple-900">
                  {activeLog.notes.map((note, i) => (
                    <div key={i} className="mb-2 flex items-center">
                      <span className="mr-2">💡</span>
                      <span className="text-gray-700">{note}</span>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
            <div className="text-right text-xs text-gray-500 mt-2">Last Updated: {activeLog.date}</div>
          </div>
        </div>
        {/* AdBanner at bottom */}
        <div className="mt-8 w-full max-w-3xl">
          <AdBanner />
        </div>
      </div>
      <style>{`
        /* Pastel color cycling background, smooth fade */
        .fade-gradient-bg {
          position: relative;
          min-height: 100vh;
          width: 100%;
          /* Default fallback */
          background: linear-gradient(135deg, #d8b4fe, #c084fc, #a78bfa);
          animation: pastel-cycle 40s ease-in-out infinite;
          background-size: 400% 400%;
        }
        @keyframes pastel-cycle {
          0% {
            background: linear-gradient(135deg, #d8b4fe, #c084fc, #a78bfa);
          }
          16% {
            background: linear-gradient(120deg, #b9fffc, #f7d1ba, #a1c4fd);
          }
          33% {
            background: linear-gradient(120deg, #ffe0ac, #a8edea, #fcb69f);
          }
          50% {
            background: linear-gradient(135deg, #fbc2eb, #a6c1ee, #fcb69f);
          }
          66% {
            background: linear-gradient(120deg, #e0c3fc, #f7d1ba, #b6e0fe);
          }
          83% {
            background: linear-gradient(120deg, #fbc2eb, #fdc7b7, #b6e0fe);
          }
          100% {
            background: linear-gradient(135deg, #d8b4fe, #c084fc, #a78bfa);
          }
        }
        .animate-gradient-x {
          background-size: 300% 300%;
          animation: gradient-x 25s ease-in-out infinite;
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
}

export default NoticeBoard;
