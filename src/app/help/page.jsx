"use client";
import React from "react";

const seasonBackgrounds = {
  Spring: "from-[#d8b4fe] via-[#c084fc] to-[#a78bfa]", // pastel purple gradient
};

const SEASON_COLORS = {
  Spring: "#16a34a",
  Summer: "#eab308",
  Autumn: "#dc2626",
  Winter: "#2563eb",
};

// Responsive table cell style generator
function responsiveCellStyle(header = false) {
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 700;
  return {
    padding: isMobile ? "0.4rem" : "0.5rem 1rem",
    fontSize: isMobile ? "0.9rem" : "1.05rem",
    border: "1px solid #ccc",
    textAlign: "left",
    fontWeight: header ? 600 : 400,
    wordBreak: "break-word",
    whiteSpace: "normal",
    background: header ? (isMobile ? "#e9d5ff" : "#ddd") : undefined,
  };
}

// Render upgrade table
function UpgradeTable() {
  const upgrades = [
    {
      name: "Tap Power",
      desc: "Increases coins earned per tap.",
      notes: "Additive growth with each level.",
    },
    {
      name: "Auto Tapper",
      desc: "Generates coins automatically every second.",
      notes: "Gain coins passively over time.",
    },
    {
      name: "Critical Chance",
      desc: "Chance to get critical taps that multiply coins.",
      notes: "Critical taps multiply coins by 2.5x. Max 100%.",
    },
    {
      name: "Tap Speed Bonus",
      desc: "Increases your tap speed (more taps in less time).",
      notes: "Works best with consecutive taps. Weather affects it.",
    },
  ];
  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        tableLayout: "fixed",
        marginBottom: "1rem",
      }}
    >
      <thead>
        <tr>
          <th style={responsiveCellStyle(true)}>Upgrade</th>
          <th style={responsiveCellStyle(true)}>What it Does</th>
          <th style={responsiveCellStyle(true)}>Notes</th>
        </tr>
      </thead>
      <tbody>
        {upgrades.map((row) => (
          <tr key={row.name}>
            <td style={responsiveCellStyle()}>{row.name}</td>
            <td style={responsiveCellStyle()}>{row.desc}</td>
            <td style={responsiveCellStyle()}>{row.notes}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Render weather table
function WeatherTable() {
  const weather = [
    { name: "Clear", effect: "No effects; normal gameplay." },
    { name: "Rain", effect: "Slows tap speed and lowers earnings by 10%." },
    { name: "Windy", effect: "Boosts tap speed by 5%." },
    { name: "Sun", effect: "Increases coin gains by 15%." },
    { name: "Hail", effect: "Reduces earnings by 15%." },
    { name: "Sleet", effect: "Reduces earnings by 10%." },
    { name: "Cloudy", effect: "Slightly reduces earnings by 2%." },
    { name: "Thunder", effect: "Increases critical chance by 15%." },
    { name: "Lightning", effect: "Greatly increases critical chance by 25%." },
    { name: "Snow", effect: "Disables critical chance bonus." },
    { name: "Foggy", effect: "Lowers critical chance by 5%." },
  ];
  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        tableLayout: "fixed",
        marginBottom: "1rem",
      }}
    >
      <thead>
        <tr>
          <th style={responsiveCellStyle(true)}>Weather</th>
          <th style={responsiveCellStyle(true)}>Effect on Gameplay</th>
        </tr>
      </thead>
      <tbody>
        {weather.map((row) => (
          <tr key={row.name}>
            <td style={responsiveCellStyle()}>{row.name}</td>
            <td style={responsiveCellStyle()}>{row.effect}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Render renown info: new, progressive formula
function RenownInfo() {
  return (
    <div style={{ fontSize: "1.05rem", lineHeight: 1.7 }}>
      <b>How Renown Tokens Work:</b>
      <ul style={{ margin: "0.7em 0 0.9em 1.2em" }}>
        <li>
          <span style={{ color: "#a78bfa", fontWeight: 600 }}>First token</span>{" "}
          requires <b>50,000,000 coins earned</b> since last reset.
        </li>
        <li>
          <span style={{ color: "#a78bfa", fontWeight: 600 }}>
            Every further token
          </span>{" "}
          requires more coins than the last (cost increases progressively, so
          each is harder to get!).
        </li>
        <li>
          Formula: <b>Token Cost = 50,000,000 × 2^(tokens earned)</b>
          <br />
          Example: <b>2nd token = 100,000,000</b>,{" "}
          <b>3rd token = 200,000,000</b>, etc.
        </li>
        <li>
          <span style={{ color: "#16a34a", fontWeight: 600 }}>
            You can only reset when you have earned enough for at least one
            token.
          </span>
        </li>
      </ul>
      <b>Renown Multiplier:</b>{" "}
      <span style={{ color: "#4f46e5" }}>+1.5% per token</span> (applies to all
      future runs, forever, stacking multiplicatively).
      <br />
      <b>Spending Renown:</b> Use tokens in the Shop for exclusive{" "}
      <span style={{ color: "#a78bfa" }}>cosmetics</span> and powerful{" "}
      <span style={{ color: "#16a34a" }}>permanent upgrades</span>.<br />
      <b>Tip:</b> Tokens and their bonus never reset, but all other progress
      does!
    </div>
  );
}

// Render renown progressive cost table
function RenownTable() {
  // Example for first 6 tokens
  const tokens = [
    { num: 1, cost: 50000000 },
    { num: 2, cost: 100000000 },
    { num: 3, cost: 200000000 },
    { num: 4, cost: 400000000 },
    { num: 5, cost: 800000000 },
    { num: 6, cost: 1600000000 },
  ];
  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        tableLayout: "fixed",
        marginBottom: "1rem",
      }}
    >
      <thead>
        <tr>
          <th style={responsiveCellStyle(true)}>Token</th>
          <th style={responsiveCellStyle(true)}>Coins Needed</th>
          <th style={responsiveCellStyle(true)}>Total Multiplier</th>
        </tr>
      </thead>
      <tbody>
        {tokens.map((row) => (
          <tr key={row.num}>
            <td style={responsiveCellStyle()}>{row.num}</td>
            <td style={responsiveCellStyle()}>{row.cost.toLocaleString()}</td>
            <td style={responsiveCellStyle()}>
              {(1 + row.num * 0.015).toFixed(3)}x
            </td>
          </tr>
        ))}
        <tr>
          <td
            colSpan={3}
            style={{
              ...responsiveCellStyle(),
              color: "#a78bfa",
              fontWeight: 500,
              textAlign: "center",
            }}
          >
            <span>
              Cost continues doubling each token.
              <br />
              Multiplier stacks with every reset!
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function MainComponent() {
  // Add useEffect for pageview tracking at the top
  React.useEffect(() => {
    // Get userId from localStorage
    const userId = localStorage.getItem("userId");

    // Record pageview
    fetch("/api/record-pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        page_path: "/help",
        user_id: userId || null,
        user_agent: navigator.userAgent,
        referrer: document.referrer,
      }),
    }).catch(console.error);
  }, []); // Run once on mount

  const currentSeason = "Spring";

  const notes = [
    // Section 1: How to Play
    {
      id: 1,
      title: "How to Play & Upgrades Explained",
      content: (
        <div
          style={{
            fontFamily:
              "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            lineHeight: 1.7,
            color: "#2d3748",
            fontSize: "1.05rem",
            letterSpacing: "0.02em",
          }}
        >
          <section style={{ marginBottom: "2rem" }}>
            <h2
              style={{
                fontSize: "1.75rem",
                fontWeight: "600",
                borderBottom: "2px solid #a78bfa",
                paddingBottom: "0.3rem",
                color: "#6d28d9",
                marginBottom: "1rem",
              }}
            >
              1. How to Play
            </h2>
            <ul style={{ paddingLeft: "1.25rem", fontSize: "1.1rem" }}>
              <li>
                Tap the <b>big button</b> on the main screen to earn coins. Tap
                fast, earn fast!
              </li>
              <li>
                The more you tap, the more coins you get. Every tap matters.
              </li>
              <li>
                Spend coins to buy <b>upgrades</b> that boost your coin
                earnings, tapping speed, and more.
              </li>
              <li>
                Your progress grows even when you're offline—<b>Auto Tapper</b>{" "}
                keeps you earning.
              </li>
              <li>
                Keep upgrading, complete <b>quests</b>, and <b>reset</b> to earn{" "}
                <span style={{ color: "#a78bfa" }}>Renown Tokens</span> for
                powerful permanent rewards.
              </li>
            </ul>
          </section>
          <section style={{ marginBottom: "2rem" }}>
            <h2
              style={{
                fontSize: "1.75rem",
                fontWeight: "600",
                borderBottom: "2px solid #a78bfa",
                paddingBottom: "0.3rem",
                color: "#6d28d9",
                marginBottom: "1rem",
              }}
            >
              2. Upgrades Explained
            </h2>
            <p style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>
              Spend coins to buy upgrades that boost your coin earnings or
              tapping efficiency:
            </p>
            <div style={{ width: "100%" }}>
              <UpgradeTable />
            </div>
            <ul style={{ fontSize: "1.1rem", paddingLeft: "1.25rem" }}>
              <li>
                <b>Tip:</b> Most upgrades can be bought in multiples—use the{" "}
                <b>x1/x10/x100</b> buttons to save time!
              </li>
              <li>
                <b>Each upgrade increases in price</b> the higher the level.
              </li>
            </ul>
          </section>
        </div>
      ),
      last_updated: "15/07/2025",
    },

    // Section 2: Seasons & Weather Effects
    {
      id: 2,
      title: "Seasons & Weather Effects",
      content: (
        <div
          style={{
            fontFamily:
              "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            lineHeight: 1.7,
            color: "#2d3748",
            fontSize: "1.05rem",
            letterSpacing: "0.02em",
          }}
        >
          <section style={{ marginBottom: "2rem" }}>
            <h2
              style={{
                fontSize: "1.75rem",
                fontWeight: "600",
                borderBottom: "2px solid #a78bfa",
                paddingBottom: "0.3rem",
                color: "#6d28d9",
                marginBottom: "1rem",
              }}
            >
              3. Seasons & Weather Effects
            </h2>
            <p style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>
              The game cycles through <b>4 seasons</b>, each affecting weather,
              visuals, and gameplay:
            </p>
            <ul
              style={{
                marginBottom: "1rem",
                paddingLeft: "1.25rem",
                fontSize: "1.1rem",
              }}
            >
              {[
                {
                  name: "Spring",
                  color: SEASON_COLORS.Spring,
                  desc: "Balanced weather, light rain, clear skies.",
                },
                {
                  name: "Summer",
                  color: SEASON_COLORS.Summer,
                  desc: "Sunny & windy: boosts coin gain and tap speed.",
                },
                {
                  name: "Autumn",
                  color: SEASON_COLORS.Autumn,
                  desc: "More clouds/rain/fog—lowers earnings, crit chance.",
                },
                {
                  name: "Winter",
                  color: SEASON_COLORS.Winter,
                  desc: "Snow/hail: reduces some bonuses, disables crits.",
                },
              ].map(({ name, color, desc }) => (
                <li key={name} style={{ marginBottom: "0.7rem" }}>
                  <span style={{ color, fontWeight: "700" }}>{name}:</span>{" "}
                  {desc}
                </li>
              ))}
            </ul>
            <h3
              style={{
                fontWeight: "600",
                marginBottom: "0.7rem",
                color: "#4b5563",
                fontSize: "1.25rem",
              }}
            >
              Weather Types & Their Effects
            </h3>
            <div style={{ width: "100%" }}>
              <WeatherTable />
            </div>
          </section>
        </div>
      ),
      last_updated: "15/07/2025",
    },

    // Section 3: Quests
    {
      id: 3,
      title: "Quests",
      content: (
        <div
          style={{
            fontFamily:
              "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            lineHeight: 1.7,
            color: "#2d3748",
            fontSize: "1.05rem",
            letterSpacing: "0.02em",
          }}
        >
          <section style={{ marginBottom: "2rem" }}>
            <h2
              style={{
                fontSize: "1.75rem",
                fontWeight: "600",
                borderBottom: "2px solid #a78bfa",
                paddingBottom: "0.3rem",
                color: "#6d28d9",
                marginBottom: "1rem",
              }}
            >
              4. Quests
            </h2>
            <p style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>
              Quests give you special goals that reward a{" "}
              <span style={{ fontWeight: "700", color: "#10b981" }}>
                10x coin boost for 10 minutes
              </span>{" "}
              upon completion. They refresh regularly and keep gameplay
              exciting.
            </p>
            <ul
              style={{
                paddingLeft: "1.25rem",
                fontSize: "1.1rem",
                marginBottom: "1rem",
              }}
            >
              <li>
                <b>Combined Upgrade Level:</b> Reach a target sum of all upgrade
                levels.
              </li>
              <li>
                <b>Tap Power Upgrades:</b> Upgrade Tap Power a set number of
                times.
              </li>
              <li>
                <b>Auto Tapper Upgrades:</b> Upgrade Auto Tapper for passive
                coins.
              </li>
              <li>
                <b>Critical Chance Upgrades:</b> Increase your crit chance.
              </li>
              <li>
                <b>Tap Speed Bonus Upgrades:</b> Upgrade tap speed for faster
                tapping.
              </li>
              <li>
                <b>House Upgrades:</b> Upgrade your house to boost your
                multiplier.
              </li>
              <li>
                <b>Earn Coins:</b> Collect enough coins to complete the quest.
              </li>
            </ul>
            <p style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>
              Quests track progress from the moment you receive them—fair for
              all players!
            </p>
            <p
              style={{
                fontSize: "1.1rem",
                fontWeight: "600",
                marginBottom: "0.5rem",
              }}
            >
              You can refresh quests at any time, but{" "}
              <b>current progress is lost instantly</b>.
            </p>
            <p style={{ fontSize: "1.1rem", color: "#6b7280" }}>
              Remember to claim your reward once a quest is complete!
            </p>
          </section>
        </div>
      ),
      last_updated: "15/07/2025",
    },

    // Section 4: Reset & Renown Tokens (progressive formula, cosmetics, shop)
    {
      id: 4,
      title: "Reset & Renown Tokens",
      content: (
        <div
          style={{
            fontFamily:
              "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            lineHeight: 1.7,
            color: "#2d3748",
            fontSize: "1.05rem",
            letterSpacing: "0.02em",
          }}
        >
          <section style={{ marginBottom: "2rem" }}>
            <h2
              style={{
                fontSize: "1.75rem",
                fontWeight: "600",
                borderBottom: "2px solid #a78bfa",
                paddingBottom: "0.3rem",
                color: "#6d28d9",
                marginBottom: "1rem",
              }}
            >
              5. Reset & Renown Tokens
            </h2>
            <RenownInfo />
            <div style={{ width: "100%", margin: "1.5rem 0" }}>
              <RenownTable />
            </div>
            <ul
              style={{
                paddingLeft: "1.25rem",
                fontSize: "1.1rem",
                margin: "1rem 0",
              }}
            >
              <li>
                <b>Shop:</b> Spend Renown Tokens on exclusive{" "}
                <span style={{ color: "#a78bfa" }}>limited cosmetics</span> and
                powerful{" "}
                <span style={{ color: "#16a34a" }}>permanent upgrades</span> in
                the in-game shop!
              </li>
              <li>
                All earned Renown Tokens and their multipliers are permanent—
                <b>they never reset</b>.
              </li>
            </ul>
            <p
              style={{
                fontSize: "1.1rem",
                color: "#b91c1c",
                fontWeight: "700",
                marginTop: "1rem",
              }}
            >
              Warning: Resets are permanent—your coins and upgrades reset, but
              Renown and cosmetics remain.
            </p>
          </section>
        </div>
      ),
      last_updated: "15/07/2025",
    },

    // Section 5: House
    {
      id: 5,
      title: "Your House",
      content: (
        <div
          style={{
            fontFamily:
              "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            lineHeight: 1.7,
            color: "#2d3748",
            fontSize: "1.05rem",
            letterSpacing: "0.02em",
          }}
        >
          <section style={{ marginBottom: "2rem" }}>
            <h2
              style={{
                fontSize: "1.75rem",
                fontWeight: "600",
                borderBottom: "2px solid #a78bfa",
                paddingBottom: "0.3rem",
                color: "#6d28d9",
                marginBottom: "1rem",
              }}
            >
              6. Your House
            </h2>
            <p style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>
              Your cozy house grows as you progress. <b>Upgrading your house</b>{" "}
              improves your coin multiplier and shows off your style!
            </p>
            <ul
              style={{
                paddingLeft: "1.25rem",
                fontSize: "1.1rem",
                marginBottom: "1rem",
              }}
            >
              <li>
                Upgrade cost grows exponentially; every level costs more coins.
              </li>
              <li>
                Each level adds about <b>10%</b> to your house multiplier.
              </li>
              <li>
                You can <b>rename</b> your house anytime for personalization.
              </li>
              <li>
                <span style={{ color: "#ca8a04" }}>Sacrifice</span>: If you want
                to double offline earnings, you can sacrifice{" "}
                <b>1 house level (if above level 1)</b>.
              </li>
            </ul>
            <p
              style={{
                fontSize: "1.1rem",
                fontWeight: "600",
                color: "#2563eb",
              }}
            >
              Upgrade your house for bigger multipliers and an even cozier home!
            </p>
          </section>
        </div>
      ),
      last_updated: "15/07/2025",
    },

    // Section 6: Offline Earnings & Sacrifice
    {
      id: 6,
      title: "Offline Earnings & Sacrifice Option",
      content: (
        <div
          style={{
            fontFamily:
              "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            lineHeight: 1.7,
            color: "#2d3748",
            fontSize: "1.05rem",
            letterSpacing: "0.02em",
          }}
        >
          <section style={{ marginBottom: "2rem" }}>
            <h2
              style={{
                fontSize: "1.75rem",
                fontWeight: "600",
                borderBottom: "2px solid #a78bfa",
                paddingBottom: "0.3rem",
                color: "#6d28d9",
                marginBottom: "1rem",
              }}
            >
              7. Offline Earnings & Sacrifice Option
            </h2>
            <p style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>
              When you return after being offline, you will earn coins based on
              your Auto Tapper level and time away (<b>max 3 hours</b>).
            </p>
            <p style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>
              <b>Want double rewards?</b> Sacrifice either:
            </p>
            <ul
              style={{
                paddingLeft: "1.25rem",
                fontSize: "1.1rem",
                marginBottom: "1rem",
              }}
            >
              <li>
                <b>10 levels of any one upgrade</b> (Tap Power, Auto Tapper,
                Crit Chance, or Tap Speed Bonus)
              </li>
              <li>
                <b>1 house level</b> (if above level 1)
              </li>
            </ul>
            <p
              style={{
                fontSize: "1.1rem",
                color: "#ca8a04",
                fontWeight: "700",
              }}
            >
              Choose wisely! Sacrificed upgrades or house levels are lost
              permanently.
            </p>
          </section>
        </div>
      ),
      last_updated: "15/07/2025",
    },

    // Section 7: Daily Bonuses
    {
      id: 7,
      title: "Daily Bonuses",
      content: (
        <div
          style={{
            fontFamily:
              "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            lineHeight: 1.7,
            color: "#2d3748",
            fontSize: "1.05rem",
            letterSpacing: "0.02em",
          }}
        >
          <section style={{ marginBottom: "2rem" }}>
            <h2
              style={{
                fontSize: "1.75rem",
                fontWeight: "600",
                borderBottom: "2px solid #a78bfa",
                paddingBottom: "0.3rem",
                color: "#6d28d9",
                marginBottom: "1rem",
              }}
            >
              8. Daily Bonuses
            </h2>
            <p style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>
              Claim a bonus every 24 hours (resets at 2 PM server time)! Bonuses
              may include:
            </p>
            <ul
              style={{
                paddingLeft: "1.25rem",
                fontSize: "1.1rem",
                marginBottom: "1rem",
              }}
            >
              <li>Upgrade levels (+1 to +10)</li>
              <li>Bonus coins (10%, 25%, or 50% of current coins)</li>
              <li>House levels (+1 to +3)</li>
              <li>
                Temporary coin multipliers (10%, 50%, or 500% for 24 hours)
              </li>
            </ul>
            <p style={{ fontSize: "1.1rem", fontWeight: "600" }}>
              <span style={{ color: "#eab308" }}>Tip:</span> Claim daily for
              fast progress!
            </p>
          </section>
        </div>
      ),
      last_updated: "15/07/2025",
    },

    // Section 8: Leaderboards & Profile
    {
      id: 8,
      title: "Leaderboards & Profile",
      content: (
        <div
          style={{
            fontFamily:
              "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            lineHeight: 1.7,
            color: "#2d3748",
            fontSize: "1.05rem",
            letterSpacing: "0.02em",
          }}
        >
          <section style={{ marginBottom: "2rem" }}>
            <h2
              style={{
                fontSize: "1.75rem",
                fontWeight: "600",
                borderBottom: "2px solid #a78bfa",
                paddingBottom: "0.3rem",
                color: "#6d28d9",
                marginBottom: "1rem",
              }}
            >
              9. Leaderboards & Profile
            </h2>
            <p style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>
              Compete with other players for <b>Renown Tokens</b> and{" "}
              <b>Total Coins Earned</b>.
            </p>
            <ul
              style={{
                paddingLeft: "1.25rem",
                fontSize: "1.1rem",
                marginBottom: "1rem",
              }}
            >
              <li>
                <b>Leaderboards</b> show the top players for each stat.
              </li>
              <li>
                Use the <b>Profile tab</b> to view/change your display name,
                update your PIN, or perform a hard reset.
              </li>
              <li>
                <b>Logging out?</b> You'll need your PIN to log back in (keep it
                safe).
              </li>
            </ul>
            <p style={{ fontSize: "1.1rem", color: "#6b7280" }}>
              Leaderboards update regularly to show the latest standings.
            </p>
          </section>
        </div>
      ),
      last_updated: "15/07/2025",
    },

    // Section 9: Tips & Notes
    {
      id: 9,
      title: "Tips & Important Notes",
      content: (
        <div
          style={{
            fontFamily:
              "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            lineHeight: 1.7,
            color: "#2d3748",
            fontSize: "1.05rem",
            letterSpacing: "0.02em",
          }}
        >
          <section style={{ marginBottom: "3rem" }}>
            <h2
              style={{
                fontSize: "1.75rem",
                fontWeight: "600",
                borderBottom: "2px solid #a78bfa",
                paddingBottom: "0.3rem",
                color: "#6d28d9",
                marginBottom: "1rem",
              }}
            >
              10. Tips & Important Notes
            </h2>
            <ul style={{ paddingLeft: "1.25rem", fontSize: "1.1rem" }}>
              <li>
                <b>Boosts stack multiplicatively:</b> Quest rewards, daily
                bonuses, and house multipliers all multiply together.
              </li>
              <li>
                <b>Tap speed bonus:</b> On mobile, fewer taps needed to trigger
                the speed streak.
              </li>
              <li>
                <b>Weather effects:</b> Adjust your play to maximize gains—read
                the weather description!
              </li>
              <li>
                <b>Reset wisely:</b> Only reset when you have enough for
                multiple tokens.
              </li>
              <li>
                <b>Save often:</b> Game autosaves frequently, but you can also
                manually save via your profile.
              </li>
              <li>
                <b>Feedback & Support:</b> Use in-game feedback for help or to
                suggest improvements.
              </li>
              <li>
                <b>Offline cap:</b> You only earn offline coins for a maximum of
                3 hours away.
              </li>
              <li>
                <b>Cosmetics:</b> Check the shop for new limited-time house
                decorations, skins, and more!
              </li>
            </ul>
          </section>
        </div>
      ),
      last_updated: "15/07/2025",
    },
  ];

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${seasonBackgrounds[currentSeason]} p-2 transition-colors duration-700`}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="max-w-3xl mx-auto bg-white/30 backdrop-filter backdrop-blur-lg rounded-2xl p-2 shadow-lg">
        {/* 1. Back to Home button - very top, left aligned */}
        <div className="flex justify-start mb-4">
          <button
            onClick={() => {
              window.location.href = "/";
            }}
            className="px-5 py-3 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold transition"
          >
            ← Back to Home
          </button>
        </div>
        {/* 2. Logo - centered and large */}
        <div className="flex flex-col items-center justify-center mb-0">
          <img
            src="https://ucarecdn.com/7bdd361d-c411-41ce-b066-c1d20f88e3a7/-/format/auto/"
            alt="Tap Tap Two Logo"
            style={{
              height: "11rem",
              objectFit: "contain",
              margin: "0 auto",
              marginBottom: "-1.5rem",
              display: "block",
            }}
          />
        </div>
        {/* 3. Noticeboard Title - centered, right under logo */}
        <div className="flex flex-col items-center justify-center mt-0 mb-8">
          <h2
            style={{
              fontFamily: "'Crimson Text', serif",
              fontWeight: 700,
              fontSize: "2.5rem",
              color: "#2d3748",
              letterSpacing: "0.04em",
              textAlign: "center",
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            Help Board
          </h2>
        </div>
        {/* 4. Notices */}
        {notes.length === 0 ? (
          <div className="text-center text-[#4a5568] text-lg">
            There seems to be an error..
          </div>
        ) : (
          <div className="space-y-10">
            {notes.map((note) => (
              <article
                key={note.id}
                className="bg-white/70 rounded-2xl p-2 shadow-md border border-white/40"
              >
                <h3
                  style={{
                    fontFamily: "'Crimson Text', serif",
                    fontWeight: 600,
                    fontSize: "1.5rem",
                    color: "#2d3748",
                    marginBottom: "1rem",
                    letterSpacing: "0.04em",
                  }}
                >
                  {note.title}
                </h3>
                <div className="text-[#4a5568] whitespace-pre-wrap">
                  {note.content}
                </div>
                <footer className="text-sm text-[#718096] mt-6 text-right">
                  Last Updated: {note.last_updated}
                </footer>
              </article>
            ))}
          </div>
        )}
      </div>
      <footer
        style={{
          textAlign: "center",
          color: "#2d3748",
          fontSize: "0.9rem",
          marginTop: "2rem",
          borderTop: "1px solid #e5e7eb",
          paddingTop: "1rem",
        }}
      >
        &copy; 2025 Tap Tap Two by andysocial
      </footer>
    </div>
  );
}

export default MainComponent;
