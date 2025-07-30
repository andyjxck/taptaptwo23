"use client";
import React, { useState, useEffect } from "react";
import AdBanner from "../components/AdBanner";

// Dynamic background for seasons (using Spring as default here)
const seasonBackgrounds = {
  Spring: "from-[#d8b4fe] via-[#c084fc] to-[#a78bfa]",
  Summer: "from-[#fde68a] via-[#fcd34d] to-[#fbbf24]",
  Autumn: "from-[#fdba74] via-[#fb923c] to-[#f97316]",
  Winter: "from-[#bfdbfe] via-[#93c5fd] to-[#60a5fa]"
};
const currentSeason = "Spring";

// Weather effects data
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

// All help sections: id, title, icon, content, last update date
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
          <li>Keep upgrading, complete <b>quests</b>, and <b>reset</b> your progress to earn <span className="text-purple-600 font-semibold">Renown Tokens</span> for powerful permanent rewards.</li>
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
        <p className="mb-3">Upgrades cost coins and improve different aspects of your game:</p>
        <table className="w-full table-fixed border-collapse mb-3 text-sm">
          <thead>
            <tr className="bg-purple-100 text-left">
              <th className="p-2">Upgrade</th>
              <th className="p-2">Effect</th>
              <th className="p-2">Notes</th>
            </tr>
          </thead>
          <tbody className="bg-white/80">
            <tr>
              <td className="p-2 font-semibold">Tap Power</td>
              <td className="p-2">Increases coins earned per tap.</td>
              <td className="p-2">Each level adds a flat amount to coin gain.</td>
            </tr>
            <tr>
              <td className="p-2 font-semibold">Auto Tapper</td>
              <td className="p-2">Automatically generates coins every second.</td>
              <td className="p-2">Earn coins passively even when not tapping.</td>
            </tr>
            <tr>
              <td className="p-2 font-semibold">Critical Chance</td>
              <td className="p-2">Chance for taps to be "critical" and give bonus coins.</td>
              <td className="p-2">Critical taps give 2.5× coins. Max critical chance is 100%.</td>
            </tr>
            <tr>
              <td className="p-2 font-semibold">Tap Speed Bonus</td>
              <td className="p-2">Increases how quickly you can tap effectively.</td>
              <td className="p-2">Helps achieve tap streaks; weather can impact it.</td>
            </tr>
          </tbody>
        </table>
        <ul className="list-disc pl-5 space-y-2">
          <li><b>Tip:</b> You can buy most upgrades in bulk using the <b>x1/x10/x100</b> buttons for convenience.</li>
          <li>Each upgrade level increases in price as it gets higher, so plan your spending wisely.</li>
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
        <p className="mb-3">The game cycles through <b>4 seasons</b>, each with unique weather patterns and effects on gameplay:</p>
        <ul className="list-disc pl-5 mb-4 space-y-2">
          <li><span className="font-semibold text-green-700">Spring:</span> Balanced weather with light rain and clear skies.</li>
          <li><span className="font-semibold text-yellow-600">Summer:</span> Mostly sunny and windy – boosts coin gains and tap speed.</li>
          <li><span className="font-semibold text-red-600">Autumn:</span> More clouds, rain, and fog – slightly lowers earnings and critical chance.</li>
          <li><span className="font-semibold text-blue-600">Winter:</span> Snow and hail are common – some bonuses are reduced and critical taps may be disabled.</li>
        </ul>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Weather Effects</h3>
        <table className="w-full table-fixed border-collapse mb-2 text-sm">
          <thead>
            <tr className="bg-purple-100 text-left">
              <th className="p-2">Weather</th>
              <th className="p-2">Effect on Gameplay</th>
            </tr>
          </thead>
          <tbody className="bg-white/80">
            {weatherEffects.map(({ name, effect }) => (
              <tr key={name}>
                <td className="p-2 font-medium">{name}</td>
                <td className="p-2">{effect}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-gray-600 text-sm">*Weather can temporarily increase or decrease your tapping speed, coin earnings, or critical chance as listed above.</p>
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
        <p className="mb-3"><b>Quests</b> are special goals that challenge you and provide rewards. Completing a quest grants a <span className="text-green-600 font-semibold">10× coin boost for 10 minutes</span> as a reward.</p>
        <p className="mb-3">New quests appear regularly. Quest types include:</p>
        <ul className="list-disc pl-5 mb-3 space-y-2">
          <li><b>Combined Upgrade Level:</b> Reach a target total level across all upgrades.</li>
          <li><b>Tap Power Upgrades:</b> Purchase a certain number of Tap Power upgrades.</li>
          <li><b>Auto Tapper Upgrades:</b> Purchase a certain number of Auto Tapper upgrades.</li>
          <li><b>Critical Chance Upgrades:</b> Increase your Critical Chance upgrade to a target level.</li>
          <li><b>Tap Speed Bonus Upgrades:</b> Increase your Tap Speed Bonus upgrade to a target level.</li>
          <li><b>House Upgrades:</b> Upgrade your House a certain number of times.</li>
          <li><b>Earn Coins:</b> Accumulate a specified amount of coins.</li>
        </ul>
        <p className="mb-2">Quest progress starts counting from when the quest is received – everyone starts fresh for fairness.</p>
        <p className="mb-2"><b>You can refresh quests</b> to get new ones at any time, but note that current quest progress will be lost when you do.</p>
        <p className="mb-2 text-gray-700"><i>Remember to claim your quest reward</i> once a quest is complete, so you get that big coin boost!</p>
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
        <p className="mb-3">When you <b>reset</b> your game (often called a "prestige"), you lose all your coins and upgrades, but earn <b>Renown Tokens</b> in return. Renown Tokens give permanent bonuses and can be spent in the Shop.</p>
        <ul className="list-disc pl-5 mb-3 space-y-2">
          <li>The first token requires earning <b>50,000,000 coins</b> in one run. Each subsequent token requires <b>double</b> the coins of the previous (e.g. 2nd token at 100M, 3rd at 200M, etc.).</li>
          <li>You can only reset once you've earned enough for at least one token. It's best to wait until you can gain several tokens at once for a bigger boost.</li>
          <li>Each token gives a <span className="text-indigo-600 font-semibold">+1.5% permanent boost</span> to all future coin earnings (tokens stack multiplicatively with no cap).</li>
          <li>All Renown Tokens you earn are kept forever – they do <u>not</u> reset when you prestige again.</li>
        </ul>
        <p className="mb-3">Renown Tokens can be spent in the <b>Shop</b> to buy exclusive <span className="text-purple-600 font-semibold">cosmetics</span> (themes, icons, etc.) and powerful <span className="text-green-600 font-semibold">permanent upgrades</span>.</p>
        <p className="text-red-700 font-semibold">**Note:** Resetting wipes your coins and upgrades, but **Renown Tokens and any cosmetics** you've purchased remain safe.</p>
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
        <p className="mb-3">Your House is a special upgrade representing your home base. Upgrading your house increases your overall coin <b>multiplier</b>, so all coin earnings are boosted.</p>
        <ul className="list-disc pl-5 mb-3 space-y-2">
          <li>Each House level adds roughly <b>+10% to your coin earnings</b>, and these multipliers stack as your house grows.</li>
          <li>House upgrade costs increase exponentially with each level, so higher levels will be pricey.</li>
          <li>You can <b>rename your house</b> anytime just for fun (this is a cosmetic change).</li>
          <li>If your House is at least level 2, you have the option to <span className="text-yellow-700 font-semibold">sacrifice</span> 1 house level to double your next offline earnings (see Offline Earnings section).</li>
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
        <p className="mb-3">When you return to the game after being offline, you gain coins based on your Auto Tapper level and the time you were away (up to a max of 3 hours of offline gains).</p>
        <p className="mb-3"><b>Want to double those offline coins?</b> You can choose to <span className="text-yellow-700 font-semibold">sacrifice</span> some progress the moment you come back:</p>
        <ul className="list-disc pl-5 mb-3 space-y-2">
          <li><b>Option 1:</b> Sacrifice <b>10 levels</b> from one of your upgrades (Tap Power, Auto Tapper, Crit Chance, or Tap Speed Bonus).</li>
          <li><b>Option 2:</b> Sacrifice <b>1 House level</b> (only if your House is level 2 or above).</li>
        </ul>
        <p className="mb-3"><i>Choose wisely!</i> Any levels you sacrifice are lost permanently. This trade can be worth it for an immediate coin boost, but you'll need to rebuild those levels later.</p>
        <p className="text-gray-700 text-sm">*(The sacrifice option is only offered once per offline collection — right when you log back in.)*</p>
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
        <p className="mb-3">You can claim a free bonus once every 24 hours (the daily bonus resets at 2:00 PM server time). Daily bonuses can include:</p>
        <ul className="list-disc pl-5 mb-3 space-y-2">
          <li>Free upgrade levels (+1 to +10 to a random upgrade).</li>
          <li>Bonus coins (get an extra 10%, 25%, or 50% of your current coin total).</li>
          <li>Free House levels (+1 to +3 added to your House level).</li>
          <li>Temporary coin multipliers (earnings boosted by 10%, 50%, or even 500% for 24 hours).</li>
        </ul>
        <p><span className="text-yellow-600 font-semibold">Tip:</span> Check in daily to grab these bonuses – they significantly speed up your progress!</p>
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
        <p className="mb-3">Tap Tap Two includes social features so you can connect with other players:</p>
        <ul className="list-disc pl-5 mb-3 space-y-2">
          <li><b>Friends List:</b> Search for players by username to send friend requests. Once they accept, you'll see them in your friends list (and you can remove friends anytime).</li>
          <li><b>Guilds:</b> Guilds are player groups. You can create your own guild (choose a name and icon) or join a friend's guild by accepting an invite. Guild leaders can invite their friends to join.</li>
          <li><b>Guild Chat:</b> Each guild has a dedicated chat for members to talk to each other in-game.</li>
          <li><b>Guild Score:</b> Guilds accumulate a score based on members' contributions. It's a fun way to see your guild's combined progress (and maybe compete with other guilds in the future).</li>
        </ul>
        <p className="mb-2">If you create a guild, you become the Guild Leader. Leaders can invite friends and also have the ability to disband the guild. (Disbanding will remove all members and delete the guild.)</p>
        <p className="mb-2">If you're a guild member (not the leader), you can leave the guild at any time. The guild will continue on without you.</p>
        <p className="mb-2"><i>Note:</i> Guild membership doesn't directly boost earnings, but it's great for socializing. Future events or competitions might involve guilds, so stay tuned!</p>
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
        <p className="mb-3">Compete globally on the <b>Leaderboards</b>! There are rankings for who has the most Renown Tokens and who has earned the most coins. Strive for the top to show off your tapping prowess.</p>
        <ul className="list-disc pl-5 mb-3 space-y-2">
          <li>The <b>Renown Leaderboard</b> lists players with the highest total Renown (all tokens earned).</li>
          <li>The <b>Coins Leaderboard</b> lists players who have accumulated the most coins in total.</li>
        </ul>
        <p className="mb-3">In your <b>Profile</b>, you can manage personal settings:</p>
        <ul className="list-disc pl-5 mb-3 space-y-2">
          <li><b>Display Name:</b> The name shown to others (on leaderboards, to friends, etc.). You can change it any time.</li>
          <li><b>PIN:</b> A 4-digit code to secure your account. You'll need your PIN to log in, so keep it safe! You can change your PIN here if needed.</li>
          <li><b>Hard Reset:</b> This will erase <u>all</u> your progress and start your account over from scratch. (Unlike a normal reset, a hard reset removes your Renown and everything else. Use with caution!)</li>
        </ul>
        <p><i>Reminder:</i> Keep your PIN in a safe place. If you log out, you’ll need that PIN to log back in to your account.</p>
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
        <p className="mb-3"><b>Battle Mode</b> is a competitive mode where you face off against another player (or an AI) to see who can collect more coins in a short time!</p>
        <ul className="list-disc pl-5 mb-3 space-y-2">
          <li>Each battle lasts <b>3 minutes</b>. Tap as fast as possible and buy upgrades wisely during the match.</li>
          <li>The player with the most coins when time is up wins. (Coins you spend on upgrades during the battle <i>don’t</i> count toward your final score, so balance saving vs. upgrading!)</li>
          <li><b>Rewards:</b> Win a battle to earn <b>+10 Renown Tokens</b>. If it’s a tie, both players get 5 tokens. Even if you lose, you earn 3 tokens – you always get something.</li>
          <li>You can play with a <b>friend</b> by creating a room (you’ll get a code to share) or joining your friend’s room with their code. Or battle against an <b>AI opponent</b> (choose easy/medium/hard difficulty).</li>
          <li>Renown Tokens earned in Battle Mode are added to your total and can be used in the main game. (Your Renown and progress carry over between Battle mode and normal play.)</li>
        </ul>
        <p className="mb-2">To start a battle, tap the <b>Battle Mode (crosshairs)</b> button from the main menu. Choose to create or join a match, or select an AI to fight.</p>
        <p className="mb-2"><i>Note:</i> Battle Mode is a new feature – expect updates and improvements. It’s a fun way to earn extra Renown and test your tapping skills against others. Good luck!</p>
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
          <li><b>Boosts stack multiplicatively:</b> Temporary boosts (from quests, daily bonuses, house, etc.) multiply together, leading to huge bonuses when combined.</li>
          <li><b>Tap streaks on mobile:</b> On phones/tablets, you need fewer rapid taps to trigger the tap-speed streak bonus (easier on a touchscreen than a mouse).</li>
          <li><b>Mind the weather:</b> Weather affects your performance – for example, if it's raining (earnings down), it might be smart to wait on big spending until skies clear.</li>
          <li><b>Plan resets:</b> Try to reset (prestige) only when you can gain multiple Renown Tokens in one go for a bigger long-term boost.</li>
          <li><b>Autosave:</b> The game saves progress frequently. You can also manually save via the Profile if you want extra assurance before closing the game.</li>
          <li><b>Support & feedback:</b> Use the in-game feedback option to get help or suggest ideas – the developer actively listens to the community!</li>
          <li><b>Offline cap:</b> Offline earnings stop accumulating after 3 hours, so check back in periodically to maximize gains.</li>
          <li><b>Cosmetics:</b> Keep an eye on the Shop for new limited-time themes, house skins, and profile icons. They don't boost gameplay, but they let you personalize your experience.</li>
        </ul>
        <p className="mb-2">Enjoy Tap Tap Two and happy tapping! 🎉 If you're ever unsure about something, this Help Guide has the answers.</p>
      </>
    ),
    last_updated: "30/07/2025"
  }
];

function HelpGuide() {
  const [activeId, setActiveId] = useState(helpSections[0].id);

  // Scroll to top whenever a new section is selected (improves experience on mobile)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeId]);

  const activeSection = helpSections.find(sec => sec.id === activeId);

  return (
    <div className={`min-h-screen bg-gradient-to-br ${seasonBackgrounds[currentSeason]} p-4`}>
      <div className="max-w-4xl mx-auto bg-white/30 backdrop-blur-lg rounded-2xl shadow-lg flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar Navigation */}
        <nav className="md:w-1/3 p-4 md:p-6 bg-white/10 md:border-r md:border-white/50">
          <ul className="space-y-2">
            {helpSections.map(sec => (
              <li key={sec.id}>
                <button
                  onClick={() => setActiveId(sec.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center transition-colors duration-200 ${
                    activeId === sec.id 
                      ? "bg-white/80 text-gray-800 font-semibold" 
                      : "text-gray-800/70 hover:bg-white/20"
                  }`}
                >
                  <i className={`${sec.icon} mr-2`}></i> {sec.title}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        {/* Active Section Content */}
        <div className="md:w-2/3 p-4 md:p-6 text-gray-800">
          <h2 className="text-2xl font-bold text-purple-800 mb-4">{activeSection.title}</h2>
          <div className="text-[1.05rem] leading-relaxed">
            {activeSection.content}
          </div>
          <div className="text-right text-sm text-gray-600 mt-4">
            Last Updated: {activeSection.last_updated}
          </div>
        </div>
      </div>
      {/* Ad banner at bottom */}
      <div className="mt-6 text-center">
        <AdBanner />
      </div>
    </div>
  );
}

export default HelpGuide;
