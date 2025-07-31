"use client";
import React, { useState, useEffect } from "react";
import AdBanner from "@/components/AdBanner";
import { logPageview } from "@/utilities/logPageview";


// Season backgrounds: more lively, with animated gradient and overlay
const seasonBackgrounds = {
  Spring: "from-[#e0c3fc] via-[#8ec5fc] to-[#a1c4fd]",
  Summer: "from-[#fceabb] via-[#f8b500] to-[#fccb90]",
  Autumn: "from-[#ffecd2] via-[#fcb69f] to-[#ff6e7f]",
  Winter: "from-[#e0eafc] via-[#cfdef3] to-[#a1c4fd]"
};
const currentSeason = "Spring";

// Weather effects data for tables
const weatherEffects = [
  { name: "Clear", effect: "No effects – normal gameplay." },
  { name: "Rain", effect: "Slows tap speed, -10% earnings." },
  { name: "Windy", effect: "Boosts tap speed by +5%." },
  { name: "Sun", effect: "Increases coin gains by +15%." },
  { name: "Hail", effect: "Reduces earnings by 15%." },
  { name: "Sleet", effect: "Reduces earnings by 10%." },
  { name: "Cloudy", effect: "Slightly reduces earnings by 2%." },
  { name: "Thunder", effect: "Increases critical chance by +15%." },
  { name: "Lightning", effect: "Greatly increases critical chance by +25%." },
  { name: "Snow", effect: "Disables critical chance bonus." },
  { name: "Foggy", effect: "Lowers critical chance by 5%." }
];

// Glass table wrapper for consistent style
const GlassTable = ({ children }) => (
  <div className="rounded-xl shadow-lg overflow-x-auto bg-white/10 backdrop-blur-[8px] border border-white/30 my-2">
    <table className="min-w-full text-sm text-gray-700">
      {children}
    </table>
  </div>
);


const helpSections = [
  {
    id: 1,
    title: "How to Play",
    icon: "fas fa-hand-pointer",
    content: (
      <>
        <ul className="list-disc pl-5 space-y-2 mb-4">
          <li>Tap the <b>big button</b> on the main screen to earn coins. Tap fast to earn faster!</li>
          <li>The more you tap, the more coins you get – every tap matters.</li>
          <li>Spend coins to buy <b>upgrades</b> that boost your coin earnings, tapping speed, and more.</li>
          <li>Your progress continues even when offline – the <b>Auto Tapper</b> upgrade keeps earning for you.</li>
          <li>Keep upgrading, complete <b>quests</b>, and <b>reset</b> your progress to earn <span className="text-red-600 font-semibold">Renown Tokens</span> for permanent rewards.</li>
        </ul>
      </>
    ),
    last_updated: "30/07/2025"
  },
  {
    id: 2,
    title: "Upgrades",
    icon: "fas fa-bolt",
    content: (
      <>
        <p className="mb-3">Upgrades cost coins and improve your game. All prices scale up with each purchase:</p>
        <GlassTable>
          <thead>
            <tr className="bg-white/10 text-left">
              <th className="p-2 font-semibold">Upgrade</th>
              <th className="p-2 font-semibold">Effect</th>
              <th className="p-2 font-semibold">Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr className="hover:bg-white/10">
              <td className="p-2 font-semibold">Tap Power</td>
              <td className="p-2">Increases coins earned per tap.</td>
              <td className="p-2">Each level adds a flat amount. Cost: 20c +7%/level.</td>
            </tr>
            <tr className="hover:bg-white/10">
              <td className="p-2 font-semibold">Auto Tapper</td>
              <td className="p-2">Earn coins passively every second.</td>
              <td className="p-2">500c +6%/level.</td>
            </tr>
            <tr className="hover:bg-white/10">
              <td className="p-2 font-semibold">Critical Chance</td>
              <td className="p-2">Chance for 2.5× coin taps.</td>
              <td className="p-2">40c +6%/level (tougher after 84).</td>
            </tr>
            <tr className="hover:bg-white/10">
              <td className="p-2 font-semibold">Tap Speed Bonus</td>
              <td className="p-2">Lets you tap faster.</td>
              <td className="p-2">80c +6%/level (tougher after 250).</td>
            </tr>
            <tr className="hover:bg-white/10">
              <td className="p-2 font-semibold">House</td>
              <td className="p-2">Boosts ALL coin earnings.</td>
              <td className="p-2">+10%/level, cost: 1,000c +50%/level.</td>
            </tr>
          </tbody>
        </GlassTable>
        <ul className="list-disc pl-5 space-y-2">
          <li>You can buy upgrades in bulk using the <b>x1/x10/x100</b> buttons.</li>
          <li>Plan your spending: each upgrade gets more expensive!</li>
        </ul>
      </>
    ),
    last_updated: "30/07/2025"
  },
  {
    id: 3,
    title: "Seasons & Weather",
    icon: "fas fa-cloud-sun",
    content: (
      <>
        <p className="mb-3">The game cycles through <b>4 seasons</b> by default (Though this can be changed to a theme via the shop), each with unique weather patterns and effects:</p>
        <ul className="list-disc pl-5 mb-4 space-y-2">
          <li><span className="font-semibold text-green-400">Spring:</span> Balanced weather, light rain, clear skies.</li>
          <li><span className="font-semibold text-yellow-300">Summer:</span> Sunny and windy – boosts coins/tap speed.</li>
          <li><span className="font-semibold text-orange-400">Autumn:</span> More clouds, rain, fog – slightly lowers earnings/crit chance.</li>
          <li><span className="font-semibold text-blue-300">Winter:</span> Snow/hail common – some bonuses reduced, crits may be disabled.</li>
        </ul>
        <h3 className="text-base font-semibold text-gray-100 mb-2">Weather Effects</h3>
        <GlassTable>
          <thead>
            <tr>
              <th className="p-2 font-semibold">Weather</th>
              <th className="p-2 font-semibold">Effect</th>
            </tr>
          </thead>
          <tbody>
            {weatherEffects.map(({ name, effect }) => (
              <tr key={name} className="hover:bg-white/10">
                <td className="p-2">{name}</td>
                <td className="p-2">{effect}</td>
              </tr>
            ))}
          </tbody>
        </GlassTable>
        <p className="text-gray-300 text-xs">Weather temporarily boosts or reduces tap speed, coins, or crit chance as listed above.</p>
      </>
    ),
    last_updated: "30/07/2025"
  },
  {
    id: 4,
    title: "Quests",
    icon: "fas fa-scroll",
    content: (
      <>
        <p className="mb-3"><b>Quests</b> are goals that reward a <span className="text-green-300 font-semibold">10× coin boost for 10 min</span> when completed.</p>
        <p className="mb-2">Quest types include:</p>
        <ul className="list-disc pl-5 mb-3 space-y-2">
          <li>Combined Upgrade Level</li>
          <li>Tap Power / Auto Tapper / Crit Chance / Tap Speed /</li>
          <li>Earn a target amount of coins</li>
        </ul>
        <p>Progress only counts once the quest appears. You can refresh quests (but lose current progress). Remember to claim your reward when done!</p>
      </>
    ),
    last_updated: "30/07/2025"
  },
  {
    id: 5,
    title: "Reset & Renown",
    icon: "fas fa-sync-alt",
    content: (
      <>
        <p className="mb-3">Reset (prestige) wipes coins/upgrades (but not house level!) but earns <b>Renown Tokens</b> for permanent boosts and cosmetics.</p>
        <ul className="list-disc pl-5 mb-3 space-y-2">
          <li>1st token: <b>50,000,000 coins</b>. Each next token doubles the requirement.</li>
          <li>Each token: <span className="text-indigo-300 font-semibold">+1.5% all coin gains</span> (stacks forever).</li>
          <li>Tokens are kept on every future reset.</li>
        </ul>
        <p>Spend Renown in the Shop for cosmetics or permanent upgrades. <span className="text-pink-200 font-bold">Resetting does NOT erase Renown or purchases!</span></p>
      </>
    ),
    last_updated: "30/07/2025"
  },
  {
    id: 6,
    title: "Your House",
    icon: "fas fa-home",
    content: (
      <>
        <p className="mb-3">The <b>House</b> is your personal hub. Each level is <span className="text-blue-200 font-bold">+10% all coin earnings</span> (stacks).</p>
        <ul className="list-disc pl-5 mb-3 space-y-2">
          <li>Upgrade cost: 1,000c, increases +50%/level.</li>
          <li>Rename your house any time (cosmetic).</li>
          <li>If House is 2+, you can <span className="text-yellow-400">sacrifice 1 level</span> to double offline earnings.</li>
        </ul>
      </>
    ),
    last_updated: "30/07/2025"
  },
  {
    id: 7,
    title: "Offline & Sacrifice",
    icon: "fas fa-moon",
    content: (
      <>
        <p className="mb-3">Gain coins when offline (max 3h at a time). When you come back, you can double rewards by:</p>
        <ul className="list-disc pl-5 mb-3 space-y-2">
          <li>Sacrificing <b>10 levels</b> from any upgrade</li>
          <li>Or 1 <b>House level</b> (if House is 2+)</li>
        </ul>
        <p className="text-yellow-200">This is optional and offered once per offline claim. Any levels sacrificed are permanent.</p>
      </>
    ),
    last_updated: "30/07/2025"
  },
  {
    id: 8,
    title: "Daily Bonuses",
    icon: "fas fa-gift",
    content: (
      <>
        <p className="mb-3">Claim your daily bonus (resets 2PM server):</p>
        <ul className="list-disc pl-5 mb-3 space-y-2">
          <li>+1 to +10 free upgrade levels</li>
          <li>Bonus coins (+10%/25%/50%)</li>
          <li>+1 to +3 free House levels</li>
          <li>Temporary multipliers (up to 500% for 24h)</li>
        </ul>
        <p className="text-yellow-200">Tip: Daily bonuses speed up progress a lot.</p>
      </>
    ),
    last_updated: "30/07/2025"
  },
  {
    id: 9,
    title: "Friends & Guilds",
    icon: "fas fa-user-friends",
    content: (
      <>
        <p className="mb-3">Social features to connect:</p>
        <ul className="list-disc pl-5 mb-3 space-y-2">
          <li><b>Friends:</b> Search by username, send/accept/remove requests.</li>
          <li><b>Guilds:</b> Create or join. Guild leaders can invite/remove, disband.</li>
          <li><b>Guild Chat:</b> All members can chat. All guild members see each others’ <b>profile_name</b>.</li>
          <li><b>Guild Score:</b> Total of all members’ house level.</li>
        </ul>
        <div className="bg-yellow-900/70 border border-yellow-500/60 rounded-lg p-3 my-3 text-yellow-200 font-semibold shadow-inner">
          <i className="fas fa-exclamation-triangle mr-2" />
          <span>
            <b>Privacy Warning:</b> Your <u>profile name</u> is visible to guild members in chat and guild lists.
            Do <b>not</b> use your real name or any private info here.
          </span>
        </div>
        <p>Guild leaders can disband any time (removes all members). Leaving a guild does NOT erase progress.</p>
        <p className="text-gray-300 text-xs">Guild features may expand in the future. Your profile icon and name are visible in chats.</p>
      </>
    ),
    last_updated: "30/07/2025"
  },
  {
    id: 10,
    title: "Leaderboards & Profile",
    icon: "fas fa-trophy",
    content: (
      <>
        <p className="mb-3">Climb the global <b>Leaderboards</b>:</p>
        <ul className="list-disc pl-5 mb-3 space-y-2">
          <li>Renown: highest tokens</li>
          <li>Coins: highest earned</li>
        </ul>
        <p className="mb-3">In <b>Profile</b>:</p>
        <ul className="list-disc pl-5 mb-3 space-y-2">
          <li>Change display name (public)</li>
          <li>Change PIN (for login)</li>
          <li><b>Hard Reset:</b> wipes ALL progress (including Renown!). Be careful.</li>
        </ul>
        <p className="text-yellow-300">Keep your PIN safe. You’ll need it to log in.</p>
      </>
    ),
    last_updated: "30/07/2025"
  },
  {
    id: 11,
    title: "Battle Mode",
    icon: "fas fa-crosshairs",
    content: (
      <>
        <p className="mb-3"><b>Battle Mode</b>: Compete vs. friends or AI for the most coins in 3 min.</p>
        <ul className="list-disc pl-5 mb-3 space-y-2">
          <li>Win: +10 Renown, Tie: +5, Lose: +3</li>
          <li>Upgrade mid-battle, but spent coins don’t count for final score</li>
          <li>Play via room code (friends) or choose AI difficulty</li>
        </ul>
        <p className="text-gray-300 text-xs">Your Renown carries over between all modes. All progress is synced.</p>
      </>
    ),
    last_updated: "30/07/2025"
  },
  {
    id: 12,
    title: "Tips & Notes",
    icon: "fas fa-lightbulb",
    content: (
      <>
        <ul className="list-disc pl-5 mb-3 space-y-2">
          <li>Boosts stack (combine daily, quest, house, weather for big multipliers)</li>
          <li>Mobile tap streaks: faster/easier on phone/tablet</li>
          <li>Weather can impact your strategy—plan big upgrades around “good” weather</li>
          <li>Reset for multiple Renown at once (not just one at a time)</li>
          <li>Autosave runs often;</li>
          <li>Offline progress caps at 3h—check in to maximize</li>
          <li>Cosmetics in the shop can and will change</li>
        </ul>
        <p className="mb-2">Need more help? Use the in-game feedback or ask on the Discord server.</p>
      </>
    ),
    last_updated: "30/07/2025"
  }
];

function HelpGuide() {
  
useEffect(() => {
  // Tries to grab userId from localStorage, but will work anonymously too
  const userId = localStorage.getItem("userId");
  logPageview({
    userId: userId ? parseInt(userId, 10) : null, // or leave out for anonymous
    // Optionally, set pagePath: "/help" or "/notice-board" for clarity
  });
}, []);
  const [activeId, setActiveId] = useState(helpSections[0].id);

  useEffect(() => { window.scrollTo(0, 0); }, [activeId]);
  const activeSection = helpSections.find(sec => sec.id === activeId);

 return (
    <div className={`min-h-screen w-full bg-gradient-to-br ${seasonBackgrounds[currentSeason]} animate-gradient-x relative`}>
      {/* Blurred background lights */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-1/4 top-12 w-64 h-64 bg-pink-300 rounded-full opacity-20 blur-3xl" />
        <div className="absolute right-8 bottom-12 w-72 h-72 bg-purple-400 rounded-full opacity-15 blur-2xl" />
        <div className="absolute left-4 bottom-24 w-36 h-36 bg-blue-200 rounded-full opacity-20 blur-2xl" />
      </div>
      {/* Main container */}
      <div className="relative z-10 max-w-4xl mx-auto px-2 pb-8 pt-8 flex flex-col items-center">
        {/* Title */}
        <h1 className="text-[2.3rem] md:text-4xl font-bold mb-2 text-gray-900 drop-shadow-lg tracking-tight" style={{fontFamily: "Crimson Text, serif"}}>Help Board</h1>
        {/* Return Button */}
        <button
          className="mb-4 px-6 py-2 rounded-xl bg-white/40 text-gray-800 font-semibold shadow-md border border-white/30 hover:bg-white/70 transition"
          onClick={() => window.location.href = "/"}
        >
          ← Return to Tap Tap: Two
        </button>
        {/* Card */}
        <div className="flex flex-col md:flex-row w-full gap-4 md:gap-8 bg-white/20 rounded-3xl shadow-2xl backdrop-blur-xl border border-white/40 px-1 pt-2 pb-4 md:p-6">
          {/* Sidebar */}
          <nav className="md:w-1/3 mb-2 md:mb-0 flex flex-row md:flex-col overflow-x-auto gap-2 md:gap-2 p-2 md:p-0">
            <ul className="w-full">
              {helpSections.map(sec => (
                <li key={sec.id} className="mb-1">
                  <button
                    onClick={() => setActiveId(sec.id)}
                    className={`w-full flex items-center px-3 py-2 rounded-xl font-semibold transition-colors duration-200 ${
                      activeId === sec.id
                        ? "bg-white/80 text-gray-900 shadow"
                        : "text-gray-700 hover:bg-white/30"
                    }`}
                  >
                    <i className={`${sec.icon} mr-2 opacity-90`} /> {sec.title}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          {/* Content */}
          <div className="flex-1 min-w-0 px-2 py-1">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 tracking-tight drop-shadow">{activeSection.title}</h2>
            <div className="text-base md:text-lg text-gray-700" style={{lineHeight: "1.7"}}>
              {activeSection.content}
            </div>
            <div className="text-right text-xs text-gray-500 mt-2">
              Last Updated: {activeSection.last_updated}
            </div>
          </div>
        </div>
        {/* AdBanner at bottom */}
        <div className="mt-8 w-full max-w-3xl">
          <AdBanner />
        </div>
      </div>
      <style>{`
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

useEffect(() => {
  // Tries to grab userId from localStorage, but will work anonymously too
  const userId = localStorage.getItem("userId");
  logPageview({
    userId: userId ? parseInt(userId, 10) : null, // or leave out for anonymous
    // Optionally, set pagePath: "/help" or "/notice-board" for clarity
  });
}, []);

export default HelpGuide;
