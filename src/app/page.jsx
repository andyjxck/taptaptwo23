"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";

// Generate 25 static stars (adjust count as you wish)
const STATIC_STARS = Array.from({ length: 25 }, (_, i) => {
  const size = Math.random() * 3 + 1.5; // px thickness/size between 1.5 and 4.5
  const opacity = Math.random() * 0.5 + 0.5; // brightness between 0.5 and 1
  return {
    id: `static-star-${i}`,
    top: `${Math.random() * 95 + 2}%`,
    left: `${Math.random() * 95 + 2}%`,
    size,
    opacity,
  };
});

const CUSTOM_THEME_WEATHER_RENAMES = {
  hell: {
    Rain: "Hot Rain",
    Snow: "Ashfall",
    Hail: "Ashstorm",
    Sun: "Heatwave",
    Clear: "Scorched Skies",
    Cloudy: "Smoke Haze",
    Foggy: "Ash Fog",
    Sleet: "Lava Drizzle",
    Thunder: "Magma Rumble",
    Lightning: "Firestorm",
    Windy: "Scorchwind",
  },
  heaven: {
    Rain: "Gentle Showers",
    Snow: "Stardust",
    Hail: "Glitterfall",
    Sun: "Radiance",
    Clear: "Celestial Calm",
    Cloudy: "Halo Mist",
    Foggy: "Light Haze",
    Sleet: "Gracefall",
    Thunder: "Choir Roar",
    Lightning: "Divine Flash",
    Windy: "Wind Gust",
  },
  // Add more custom themes here
};

const BOOSTS = [
  {
    id: "autotapper_24h",
    name: "2x Auto Tapper (24h)",
    description:
      "Doubles your auto tapper output for 24 hours. Stackable, but cannot be active twice at once.",
    effect: "autoTapper",
    multiplier: 2,
    price: 200,
    duration: 24 * 60 * 60 * 1000, // 24 hours in ms
    isPermanent: false,
    isLimited: false,
  },
  {
    id: "tappower_24h",
    name: "2x Tap Power (24h)",
    description:
      "Doubles your tap power output for 24 hours. Stackable, but cannot be active twice at once.",
    effect: "tapPower",
    multiplier: 2,
    price: 200,
    duration: 24 * 60 * 60 * 1000, // 24 hours in ms
    isPermanent: false,
    isLimited: false,
  },
  {
    id: "renown_24h",
    name: "2x Renown (24h)",
    description:
      "Doubles Renown for 24h. Can be stacked with Tap Power and Auto Tapper",
    effect: "renownTokens",
    multiplier: 2,
    price: 250,
    duration: 24 * 60 * 60 * 1000, // 24 hours in ms
    isPermanent: false,
    isLimited: true,
  },
  {
    id: "tappower_p",
    name: "2x Tap Power (permanent)",
    description:
      "Doubles your Tap Power output permanently. Cannot be stacked with 24h Boosts. Disables upon enabling a 24h Boost.",
    effect: "tapPowerPerm",
    multiplier: 2,
    price: 200,
    duration: null,
    isPermanent: true,
    isLimited: true,
  },
];

const CUSTOM_THEMES = {
  heaven: {
    id: "heaven",
    name: "Heaven",
    icon: "😇",
    background: "linear-gradient(to top, #fdf6e3, #f9fafb)",
    image:
      "https://ucarecdn.com/ea04768a-e0bc-4264-9996-40886d180622/-/format/auto/",
  },
  hell: {
    id: "hell",
    name: "Hell",
    icon: "😈",
    background: "linear-gradient(to top, #191414, #b31313)",
    image:
      "https://ucarecdn.com/003799a5-9e32-4513-aecc-64e2a5ac8c50/-/format/auto/",
  },
  maddoxtheme: {
    id: "maddoxtheme",
    name: "Maddox",
    icon: "⚽",
    background: "linear-gradient(to top, #191414, #b31313)",
    image:
      "https://ucarecdn.com/84914766-781c-4ddf-8b52-3d2036bdf8cb/-/format/auto/",
  },
  space: {
    id: "space",
    name: "Space",
    icon: "👽",
    background: "linear-gradient(to bottom, #0f2027, #2c5364)",
    image:
      "https://ucarecdn.com/7e944ad0-caae-4e57-9939-be47b1d0c6d2/-/format/auto/",
  },
  city_night: {
    id: "city_night",
    name: "City (Night)",
    icon: "🌃",
    background: "linear-gradient(to bottom, #232526, #314755)",
    image:
      "https://ucarecdn.com/1ea6edb2-4d02-45e1-b63d-2fc1df696c97/-/format/auto/",
  },
  midnight: {
    id: "midnight",
    name: "Midnight",
    icon: "🌑",
    background: "linear-gradient(to bottom, #232526, #757F9A)",
    image:
      "https://ucarecdn.com/e46d7093-11a2-4713-9945-95530c92b359/-/format/auto/",
  },
  island: {
    id: "island",
    name: "Island",
    icon: "🏝️",
    background: "linear-gradient(to bottom, #2193b0, #6dd5ed)",
    image:
      "https://ucarecdn.com/b6412e56-1414-4e59-8aac-1e490ece3b86/-/format/auto/",
  },
  barn: {
    id: "barn",
    name: "Barn",
    icon: "🏠",
    background: "linear-gradient(to bottom, #a8e063, #f6d365)",
    image:
      "https://ucarecdn.com/5db6f2e7-7e8c-4490-98a5-536c71d6938b/-/format/auto/",
  },
  city: {
    id: "city",
    name: "City",
    icon: "🏙️",
    background: "linear-gradient(to bottom, #8e9eab, #eef2f3)",
    image:
      "https://ucarecdn.com/2696ec93-7f3e-4194-88af-18a4bc68b0ed/-/format/auto/",
  },
};

const PROFILE_ICONS = [
  {
    id: "tree",
    name: "Tree",
    emoji: "🌳",
    price: 1,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "seedling",
    name: "Seedling",
    emoji: "🌱",
    price: 1,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "cloudMoon",
    name: "Cloud Moon",
    emoji: "🌜",
    price: 1,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "sun",
    name: "Sun",
    emoji: "🌞",
    price: 1,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "star",
    name: "Star Icon",
    emoji: "⭐",
    price: 2,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "alien",
    name: "Alien",
    emoji: "👽",
    price: 2,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "fire",
    name: "Fire",
    emoji: "🔥",
    price: 2,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "ghost",
    name: "Ghost",
    emoji: "👻",
    price: 3,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "cat",
    name: "Cat Face",
    emoji: "🐱",
    price: 3,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "unicorn",
    name: "Unicorn",
    emoji: "🦄",
    price: 3,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "robot",
    name: "Robot",
    emoji: "🤖",
    price: 4,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "crown",
    name: "Crown",
    emoji: "👑",
    price: 5,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "icecream",
    name: "Ice Cream",
    emoji: "🍦",
    price: 4,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "rocket",
    name: "Rocket",
    emoji: "🚀",
    price: 5,
    currency: "renownTokens",
    isLimited: false, // This one is limited
  },
  {
    id: "rainbow",
    name: "Rainbow",
    emoji: "🌈",
    price: 4,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "mouse",
    name: "Mouse",
    emoji: "🐭",
    price: 1,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "frog",
    name: "Frog",
    emoji: "🐸",
    price: 1,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "fox",
    name: "Fox",
    emoji: "🦊",
    price: 2,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "penguin",
    name: "Penguin",
    emoji: "🐧",
    price: 2,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "bunny",
    name: "Bunny",
    emoji: "🐰",
    price: 2,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "duck",
    name: "Duck",
    emoji: "🦆",
    price: 1,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "hamster",
    name: "Hamster",
    emoji: "🐹",
    price: 2,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "owl",
    name: "Owl",
    emoji: "🦉",
    price: 2,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "hedgehog",
    name: "Hedgehog",
    emoji: "🦔",
    price: 2,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "panda",
    name: "Panda",
    emoji: "🐼",
    price: 2,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "monkey",
    name: "Monkey",
    emoji: "🐵",
    price: 2,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "logo",
    name: "Special Logo",
    emoji: null,
    image:
      "https://ucarecdn.com/7bdd361d-c411-41ce-b066-c1d20f88e3a7/-/format/auto/",
    price: 1500,
    currency: "renownTokens",
    isLimited: true,
    limitedStock: 2,
  },
  {
    id: "maddox",
    name: "Maddox Logo",
    emoji: null,
    image:
      "https://ucarecdn.com/7eaeaf25-2192-4082-a415-dd52f360d379/-/format/auto/",
    price: 1000,
    currency: "renownTokens",
    isLimited: true,
    limitedStock: 10,
  },
  {
    id: "bee",
    name: "Bee",
    emoji: "🐝",
    price: 1,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "butterfly",
    name: "Butterfly",
    emoji: "🦋",
    price: 1,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "ladybug",
    name: "Ladybug",
    emoji: "🐞",
    price: 1,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "chick",
    name: "Chick",
    emoji: "🐤",
    price: 1,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "dog",
    name: "Dog",
    emoji: "🐶",
    price: 2,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "bear",
    name: "Bear",
    emoji: "🐻",
    price: 2,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "dolphin",
    name: "Dolphin",
    emoji: "🐬",
    price: 2,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "whale",
    name: "Whale",
    emoji: "🐳",
    price: 2,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "snail",
    name: "Snail",
    emoji: "🐌",
    price: 1,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "peach",
    name: "Peach",
    emoji: "🍑",
    price: 2,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "avocado",
    name: "Avocado",
    emoji: "🥑",
    price: 2,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "mushroom",
    name: "Mushroom",
    emoji: "🍄",
    price: 1,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "cherry",
    name: "Cherry",
    emoji: "🍒",
    price: 1,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "cookie",
    name: "Cookie",
    emoji: "🍪",
    price: 1,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "diamond",
    name: "Diamond",
    emoji: "💎",
    price: 35,
    currency: "renownTokens",
    isLimited: true,
    limitedStock: 5,
  },
  {
    id: "dragon",
    name: "Dragon",
    emoji: "🐲",
    price: 35,
    currency: "renownTokens",
    isLimited: true,
    limitedStock: 5,
  },
  {
    id: "mermaid",
    name: "Mermaid",
    emoji: "🧜‍♀️",
    price: 35,
    currency: "renownTokens",
    isLimited: true,
    limitedStock: 5,
  },
  {
    id: "wizard",
    name: "Wizard",
    emoji: "🧙‍♂️",
    price: 35,
    currency: "renownTokens",
    isLimited: true,
    limitedStock: 5,
  },
  {
    id: "crystalball",
    name: "Crystal Ball",
    emoji: "🔮",
    price: 35,
    currency: "renownTokens",
    isLimited: true,
    limitedStock: 5,
  },
  {
    id: "cactus",
    name: "Cactus",
    emoji: "🌵",
    price: 35,
    currency: "renownTokens",
    isLimited: true,
    limitedStock: 5,
  },
  {
    id: "volcano",
    name: "Volcano",
    emoji: "🌋",
    price: 35,
    currency: "renownTokens",
    isLimited: true,
    limitedStock: 5,
  },
  {
    id: "jellyfish",
    name: "Jellyfish",
    emoji: "🎐",
    price: 35,
    currency: "renownTokens",
    isLimited: true,
    limitedStock: 5,
  },
  {
    id: "starstruck",
    name: "Starstruck",
    emoji: "🤩",
    price: 35,
    currency: "renownTokens",
    isLimited: true,
    limitedStock: 5,
  },
  {
    id: "medal",
    name: "Gold Medal",
    emoji: "🏅",
    price: 35,
    currency: "renownTokens",
    isLimited: true,
    limitedStock: 5,
  },
];

const seasonalWeatherTables = {
  0: [
    { name: "Clear", chance: 30 },
    { name: "Cloudy", chance: 20 },
    { name: "Rain", chance: 15 },
    { name: "Windy", chance: 10 },
    { name: "Sun", chance: 10 },
    { name: "Foggy", chance: 5 },
    { name: "Sleet", chance: 3 },
    { name: "Snow", chance: 4 },
    { name: "Hail", chance: 1 },
    { name: "Lightning", chance: 1 },
  ],
  1: [
    { name: "Clear", chance: 40 },
    { name: "Cloudy", chance: 15 },
    { name: "Rain", chance: 10 },
    { name: "Windy", chance: 5 },
    { name: "Sun", chance: 20 },
    { name: "Foggy", chance: 2 },
    { name: "Sleet", chance: 0 },
    { name: "Snow", chance: 0 },
    { name: "Thunder", chance: 4 },
    { name: "Hail", chance: 2 },
    { name: "Lightning", chance: 2 },
  ],
  2: [
    { name: "Clear", chance: 20 },
    { name: "Cloudy", chance: 25 },
    { name: "Rain", chance: 20 },
    { name: "Windy", chance: 15 },
    { name: "Sun", chance: 8 },
    { name: "Foggy", chance: 5 },
    { name: "Sleet", chance: 3 },
    { name: "Snow", chance: 1 },
    { name: "Thunder", chance: 1 },
    { name: "Hail", chance: 1 },
    { name: "Lightning", chance: 1 },
  ],
  3: [
    { name: "Clear", chance: 15 },
    { name: "Cloudy", chance: 20 },
    { name: "Rain", chance: 5 },
    { name: "Windy", chance: 5 },
    { name: "Sun", chance: 2 },
    { name: "Foggy", chance: 5 },
    { name: "Sleet", chance: 15 },
    { name: "Snow", chance: 20 },
    { name: "Thunder", chance: 2 },
    { name: "Hail", chance: 5 },
    { name: "Lightning", chance: 3 },
  ],
};

function MainComponent() {
  const [userId, setUserId] = useState(null);
  const [pin, setPin] = useState(null);
  const [showWeatherFlash, setShowWeatherFlash] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [currentPinInput, setCurrentPinInput] = useState("");
  const [newPinInput, setNewPinInput] = useState("");
  const [confirmPinInput, setConfirmPinInput] = useState("");
  const [pinErrorMessage, setPinErrorMessage] = useState("");
  const [pinSuccessMessage, setPinSuccessMessage] = useState("");
  const [showHardResetModal, setShowHardResetModal] = useState(false);
  const [hardResetLoading, setHardResetLoading] = useState(false);
  const [shopView, setShopView] = React.useState("themes");
  const [hardResetError, setHardResetError] = useState("");
  const [tooltipVisibleFor, setTooltipVisibleFor] = useState(null); // holds the upgrade type for which tooltip shows
  const [showDoubleEarningsModal, setShowDoubleEarningsModal] = useState(false);
  const [doubleEarningsSacrifice, setDoubleEarningsSacrifice] = useState(null);
  const [doubleEarningsActive, setDoubleEarningsActive] = useState(false);
  const [doubleEarningsExpiresAt, setDoubleEarningsExpiresAt] = useState(null);
  const [showResetInfo, setShowResetInfo] = useState(false);
  const [activeBoost, setActiveBoost] = useState(null);
const [activeShopBoosts, setActiveShopBoosts] = useState([]);
const [lastDailyClaim, setLastDailyClaim] = useState(0);

useEffect(() => {
  const saved = localStorage.getItem("activeBoost");
  if (saved) setActiveBoost(JSON.parse(saved));

  const shopBoosts = localStorage.getItem("activeShopBoosts");
  if (shopBoosts) setActiveShopBoosts(JSON.parse(shopBoosts));

  const dailyClaim = localStorage.getItem("lastDailyClaim");
  setLastDailyClaim(Number(dailyClaim) || 0);
}, []);


  const [
    doubleEarningsOfflineEarningsBackup,
    setDoubleEarningsOfflineEarningsBackup,
  ] = useState(null);

  const [gameState, setGameState] = useState({
    coins: 0,
    tapPower: 1,
    tapPowerUpgrades: 0,
    autoTapper: 0,
    autoTapperUpgrades: 0,
    critChance: 0,
    critChanceUpgrades: 0,
    tapSpeedBonus: 0,
    tapSpeedBonusUpgrades: 0,
    totalTaps: 0,
    totalCoinsEarned: 0,
    resets: 0,
    permanentMultiplier: 1,
    currentSeason: 0,
    totalUpgradeLevels: 0,
    houseLevel: 1,
    houseDecorations: [],
    houseTheme: "cottage",
    houseCoinsMultiplier: 0,
    hasFirstReset: false,
    currentWeather: "Clear",
    currentYear: 0,
    houseName: "My Cozy Home",
    profileName: "Player",
    boostActiveUntil: null,
    renownTokens: 0,
  });
  const assignNewWeather = useCallback(() => {
    const season = gameState.currentSeason ?? 0;
    const theme = gameState.equippedTheme;

    const weatherOptions =
      theme && theme !== "seasons"
        ? CUSTOM_WEATHER_TABLES[theme] || []
        : seasonalWeatherTables[season] || seasonalWeatherTables[0];

    if (!weatherOptions.length) {
      setGameState((prev) => ({ ...prev, currentWeather: "Clear" }));
      return;
    }

    const totalWeight = weatherOptions.reduce((acc, w) => acc + w.chance, 0);
    const roll = Math.random() * totalWeight;
    let cumulative = 0;

    for (const weather of weatherOptions) {
      cumulative += weather.chance;
      if (roll < cumulative) {
        setGameState((prev) => ({ ...prev, currentWeather: weather.name }));
        return;
      }
    }

    // Fallback
    setGameState((prev) => ({
      ...prev,
      currentWeather: weatherOptions[0].name,
    }));
  }, [gameState.currentSeason, gameState.equippedTheme]);

  const UPGRADE_DISPLAY_NAMES = {
    tapPowerUpgrades: "Tap Power Upgrades",
    autoTapperUpgrades: "Auto Tapper Upgrades",
    critChanceUpgrades: "Critical Chance Upgrades",
    tapSpeedBonusUpgrades: "Tap Speed Bonus Upgrades",
  };

  const [rainDrops, setRainDrops] = React.useState([]);
  const [notification, setNotification] = useState(null);
  const [activeTab, setActiveTab] = useState("game");
  const [showStats, setShowStats] = useState(false);
  const [activeTheme, setActiveTheme] = React.useState("heaven");
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [pendingOfflineEarnings, setPendingOfflineEarnings] = useState(null);
  const [lastTapTimes, setLastTapTimes] = useState([]);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showMaddoxModal, setShowMaddoxModal] = useState(false);

  const [hasBoost, setHasBoost] = useState(false);
  const [boostTimeLeft, setBoostTimeLeft] = useState(0);
  const [hasFirstReset, setHasFirstReset] = useState(false);
  const [rainParticles, setRainParticles] = useState([]);
  const [snowParticles, setSnowParticles] = useState([]);
  const [hailParticles, setHailParticles] = useState([]);
  const [showHouseRenameModal, setShowHouseRenameModal] = useState(false);
  const [newHouseName, setNewHouseName] = useState("");
  const [houseNameError, setHouseNameError] = useState("");
  const MADDOX_LOGO =
    "https://ucarecdn.com/7eaeaf25-2192-4082-a415-dd52f360d379/-/format/auto/";
  const [upgradeMultiplier, setUpgradeMultiplier] = useState(1);
  const [referralInput, setReferralInput] = useState("");
  const [referralUsed, setReferralUsed] = useState(false);
  const [referralMessage, setReferralMessage] = useState("");
  const [referralMessageType, setReferralMessageType] = useState("success");
  const [pendingBonus, setPendingBonus] = useState(null);
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [bonusCooldown, setBonusCooldown] = useState(0);

  const getNewWeather = useCallback(() => {
    const season = gameState.currentSeason ?? 0;
    const weatherOptions =
      seasonalWeatherTables[season] || seasonalWeatherTables[0];
    const totalWeight = weatherOptions.reduce((acc, w) => acc + w.chance, 0);
    const roll = Math.random() * totalWeight;
    let cumulative = 0;

    for (const weather of weatherOptions) {
      cumulative += weather.chance;
      if (roll < cumulative) {
        return weather.name;
      }
    }
    return "Clear";
  }, [gameState.currentSeason]);
  const UPGRADE_DESCRIPTIONS = {
    tapPower: "Increases coins earned per tap.",
    autoTapper: "Automatically generates coins every second.",
    critChance: "Increases chance of critical taps that multiply coin gain.",
    tapSpeedBonus: "Increases tap speed, allowing more taps in less time.",
  };

  const Tooltip = ({ text }) => (
    <div
      className="absolute z-50 w-48 p-2 text-xs text-white bg-gray-800 rounded shadow-lg"
      style={{
        bottom: "125%",
        left: "50%",
        transform: "translateX(-50%)",
        whiteSpace: "normal",
      }}
    >
      {text}
      <div
        className="absolute top-full left-1/2 transform -translate-x-1/2 w-3 h-3 bg-gray-800 rotate-45"
        style={{ marginTop: "-6px" }}
      />
    </div>
  );

  const openDoubleEarningsModal = () => {
    if (!pendingOfflineEarnings) return;

    // Backup the pending offline earnings for later use
    setDoubleEarningsOfflineEarningsBackup(pendingOfflineEarnings);

    // 80% chance for upgrade, 20% for house level
    const sacrificeType = Math.random() < 0.8 ? "upgrade" : "house";
    let sacrifice = null;

    const upgrades = [
      "tapPowerUpgrades",
      "autoTapperUpgrades",
      "critChanceUpgrades",
      "tapSpeedBonusUpgrades",
    ];

    // Utility function to get a random upgrade key from valid upgrades
    const getRandomValidUpgrade = () => {
      const validUpgrades = upgrades.filter(
        (key) => (gameState[key] || 0) >= 10
      );
      if (validUpgrades.length === 0) return null;
      const randomKey =
        validUpgrades[Math.floor(Math.random() * validUpgrades.length)];
      return randomKey;
    };

    if (sacrificeType === "upgrade") {
      const randomKey = getRandomValidUpgrade();
      if (randomKey) {
        sacrifice = {
          type: "upgrade",
          upgradeKey: randomKey,
          amount: 10,
        };
      } else if (gameState.houseLevel > 1) {
        sacrifice = {
          type: "house",
          amount: 1,
        };
      } else {
        setNotification("Not enough upgrades or house level to sacrifice!");
        return;
      }
    } else {
      // Try house first, then upgrades if not available
      if (gameState.houseLevel > 1) {
        sacrifice = {
          type: "house",
          amount: 1,
        };
      } else {
        const randomKey = getRandomValidUpgrade();
        if (randomKey) {
          sacrifice = {
            type: "upgrade",
            upgradeKey: randomKey,
            amount: 10,
          };
        } else {
          setNotification("Not enough upgrades or house level to sacrifice!");
          return;
        }
      }
    }

    // Set the sacrifice details and open the modal
    setDoubleEarningsSacrifice(sacrifice);
    setShowDoubleEarningsModal(true);

    // Clear pending offline earnings shortly after to let modal open cleanly
    setTimeout(() => {
      setPendingOfflineEarnings(null);
    }, 50);
  };

  const handleDoubleEarningsAccept = () => {
    if (!doubleEarningsSacrifice || !doubleEarningsOfflineEarningsBackup)
      return;

    setShowDoubleEarningsModal(false);

    // Capture values before resetting state
    const sacrifice = doubleEarningsSacrifice;
    const offlineEarnings = doubleEarningsOfflineEarningsBackup;

    setDoubleEarningsSacrifice(null);
    setPendingOfflineEarnings(null);

    setGameState((prev) => {
      const newState = { ...prev };

      // Deduct sacrifice
      if (sacrifice.type === "upgrade") {
        const key = sacrifice.upgradeKey;
        newState[key] = Math.max(0, (newState[key] || 0) - sacrifice.amount);
      } else if (sacrifice.type === "house") {
        newState.houseLevel = Math.max(
          1,
          newState.houseLevel - sacrifice.amount
        );
      }

      // Add doubled offline earnings
      const doubledCoins = offlineEarnings.coins * 2;
      newState.coins += doubledCoins;
      newState.totalCoinsEarned += doubledCoins;

      return newState;
    });

    setNotification(
      `Double Offline Earnings! +${formatNumberShort(
        offlineEarnings.coins * 2
      )} coins added.`
    );

    setTimeout(() => {
      saveGame();
    }, 0);
  };

  const buyRegularItem = async ({ itemId, itemType, price, userId, pin }) => {
    if (!userId || !pin) {
      setNotification("You must be logged in to buy items.");
      return { error: "Not logged in" };
    }

    try {
      const response = await fetch("/api/game-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          pin,
          action: "buyRegularItem",
          itemId,
          itemType,
          price,
        }),
      });

      if (!response.ok) {
        setNotification("Failed to purchase item.");
        return { error: "Failed to purchase item" };
      }

      const data = await response.json();

      if (data.error) {
        setNotification(`Purchase error: ${data.error}`);
        return { error: data.error };
      }

      if (typeof price !== "number" || price < 0) {
        setNotification("Invalid item price.");
        return { error: "Invalid price" };
      }

      setGameState((prev) => {
        if (!prev) return prev;

        let newOwnedProfileIcons = Array.isArray(prev.ownedProfileIcons)
          ? [...prev.ownedProfileIcons]
          : [];
        let newOwnedThemes = Array.isArray(prev.ownedThemes)
          ? [...prev.ownedThemes]
          : [];
        let newOwnedBoosts = Array.isArray(prev.ownedBoosts)
          ? [...prev.ownedBoosts]
          : [];
        let newRenownTokens =
          typeof prev.renownTokens === "number" ? prev.renownTokens : 0;

        if (itemType === "profileIcon") {
          if (!newOwnedProfileIcons.includes(itemId)) {
            newOwnedProfileIcons.push(itemId);
          }
        } else if (itemType === "theme") {
          if (!newOwnedThemes.includes(itemId)) {
            newOwnedThemes.push(itemId);
          }
        } else if (itemType === "boost") {
          if (!newOwnedBoosts.includes(itemId)) {
            newOwnedBoosts.push(itemId);
          }
        }

        newRenownTokens -= price;
        if (newRenownTokens < 0) newRenownTokens = 0;

        return {
          ...prev,
          ownedProfileIcons: newOwnedProfileIcons,
          ownedThemes: newOwnedThemes,
          ownedBoosts: newOwnedBoosts,
          renownTokens: newRenownTokens,
        };
      });

      setNotification("Item purchased successfully!");
      return { success: true };
    } catch (error) {
      setNotification("Error purchasing item.");
      return { error: error.message || "Unknown error" };
    }
  };

  // QUEST SYSTEM — PASTE THIS BELOW YOUR useState HOOKS AT THE TOP

  const QUEST_TEMPLATES = [
    // Combined upgrade level quest
    {
      id: "combined_level",
      getDescription: (amount) => `Gain ${amount} Combined Upgrade Levels`,
      check: (gameState, quest) => {
        const combined =
          (gameState.tapPowerUpgrades || 0) +
          (gameState.autoTapperUpgrades || 0) +
          (gameState.critChanceUpgrades || 0) +
          (gameState.tapSpeedBonusUpgrades || 0);
        return combined - quest.startCombined >= quest.targetAmount;
      },
      min: 10,
      max: 100,
      getInit: (gameState, amount) => ({
        startCombined:
          (gameState.tapPowerUpgrades || 0) +
          (gameState.autoTapperUpgrades || 0) +
          (gameState.critChanceUpgrades || 0) +
          (gameState.tapSpeedBonusUpgrades || 0),
        targetAmount: amount,
      }),
    },
    // Tap Power upgrades
    {
      id: "upgrade_tap_power",
      getDescription: (amount) => `Upgrade Tap Power ${amount} times`,
      check: (gameState, quest) =>
        gameState.tapPowerUpgrades - quest.startLevel >= quest.targetAmount,
      min: 10,
      max: 60,
      getInit: (gameState, amount) => ({
        startLevel: gameState.tapPowerUpgrades || 0,
        targetAmount: amount,
      }),
    },
    // Auto Tapper upgrades
    {
      id: "upgrade_auto_tapper",
      getDescription: (amount) => `Upgrade Auto Tapper ${amount} times`,
      check: (gameState, quest) =>
        gameState.autoTapperUpgrades - quest.startLevel >= quest.targetAmount,
      min: 10,
      max: 60,
      getInit: (gameState, amount) => ({
        startLevel: gameState.autoTapperUpgrades || 0,
        targetAmount: amount,
      }),
    },
    // Crit Chance upgrades
    {
      id: "upgrade_crit_chance",
      getDescription: (amount) => `Upgrade Crit Chance ${amount} times`,
      check: (gameState, quest) =>
        gameState.critChanceUpgrades - quest.startLevel >= quest.targetAmount,
      min: 10,
      max: 60,
      getInit: (gameState, amount) => ({
        startLevel: gameState.critChanceUpgrades || 0,
        targetAmount: amount,
      }),
    },
    // Tap Speed Bonus upgrades
    {
      id: "upgrade_tap_speed",
      getDescription: (amount) => `Upgrade Tap Speed Bonus ${amount} times`,
      check: (gameState, quest) =>
        gameState.tapSpeedBonusUpgrades - quest.startLevel >=
        quest.targetAmount,
      min: 10,
      max: 60,
      getInit: (gameState, amount) => ({
        startLevel: gameState.tapSpeedBonusUpgrades || 0,
        targetAmount: amount,
      }),
    },
    // House upgrades
    {
      id: "upgrade_house",
      getDescription: (amount) => `Upgrade House ${amount} times`,
      check: (gameState, quest) =>
        gameState.houseLevel - quest.startLevel >= quest.targetAmount,
      min: 1,
      max: 3,
      getInit: (gameState, amount) => ({
        startLevel: gameState.houseLevel || 1,
        targetAmount: amount,
      }),
    },
    // Earn coins quest (scales with upgrade progress)
    {
      id: "earn_coins",
      getDescription: (amount) => `Earn ${amount.toLocaleString()} coins`,
      check: (gameState, quest) =>
        gameState.totalCoinsEarned - quest.startCoins >= quest.targetAmount,
      min: 1000,
      max: 0, // handled in getInit
      getInit: (gameState, _amount) => {
        // Scale max required based on total upgrades, never lower than min
        const upgradeSum =
          (gameState.tapPowerUpgrades || 0) +
          (gameState.autoTapperUpgrades || 0) +
          (gameState.critChanceUpgrades || 0) +
          (gameState.tapSpeedBonusUpgrades || 0);
        let maxEarn = Math.max(50000, upgradeSum * 5000);
        let minEarn = Math.max(1000, upgradeSum * 1000);
        const amount =
          Math.floor(Math.random() * (maxEarn - minEarn + 1)) + minEarn;
        return {
          startCoins: gameState.totalCoinsEarned || 0,
          targetAmount: amount,
        };
      },
    },
  ];

  // QUEST STATE
  const [currentQuest, setCurrentQuest] = useState(null);
  const [canClaimQuest, setCanClaimQuest] = useState(false);

  useEffect(() => {
    if (currentQuest) {
      localStorage.setItem("currentQuest", JSON.stringify(currentQuest));
    }
  }, [currentQuest]);

  const SnowParticles = () => (
    <div className="snow-container">
      {snowParticles.map((flake) => (
        <div
          key={flake.id}
          className="snow-particle"
          style={{
            left: `${flake.left}vw`,
            animationDuration: `${flake.duration}s`,
            animationDelay: `-${Math.random() * flake.duration}s`,
            opacity: flake.opacity,
            "--flake-drift": `${flake.drift}vw`,
            top: "-10px",
          }}
        />
      ))}
    </div>
  );

  // Place these inside MainComponent, above renderShopTab

  const handleBuyTheme = async (theme) => {
    if (theme.isLimited) {
      await buyLimitedItem({
        itemId: theme.id,
        itemType: "theme",
        price: theme.price,
      });
      // Make sure your buyLimitedItem logic (or response) adds the theme to ownedThemes!
    } else {
      await buyRegularItem({
        itemId: theme.id,
        itemType: "theme",
        price: theme.price,
        userId,
        pin,
      });
      // Make sure your buyRegularItem logic (or response) adds the theme to ownedThemes!
    }
    // Optionally, refetch or reload game state after buying
  };

  const handleEquipTheme = (theme) => {
    setGameState((prev) => {
      const updated = { ...prev, equippedTheme: theme.id };
      saveGame(updated);
      return updated;
    });
    setNotification(`Equipped theme: ${theme.name}`);
  };

  const handleBuyIcon = async (icon) => {
    if (icon.isLimited) {
      await buyLimitedItem({
        itemId: icon.id,
        itemType: "profileIcon",
        price: icon.price,
      });
    } else {
      await buyRegularItem({
        itemId: icon.id,
        itemType: "profileIcon", // or "profileIcon", etc.
        price: icon.price,
        userId,
        pin,
      });
    }
  };

  const handleEquipIcon = (icon) => {
    setGameState((prev) => ({
      ...prev,
      profileIcon: icon.id,
    }));
    setNotification(`Equipped icon: ${icon.name}`);
    saveGame({ ...gameState, profileIcon: icon.id });
  };

  const HailParticles = () => (
    <div className="hail-container">
      {hailParticles.map((drop) => (
        <div
          key={drop.id}
          className="hail-particle"
          style={{
            left: `${drop.left}vw`,
            animationDuration: `${drop.duration}s`,
            animationDelay: `-${Math.random() * drop.duration}s`,
            "--flake-drift": `${drop.drift || 0}px`, // If you want a bit of side movement
          }}
        />
      ))}
    </div>
  );

  const CloudyOverlay = () => (
    <div
      className="cloudy-overlay"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 8,
        overflow: "hidden",
        background:
          "linear-gradient(120deg,rgba(220,220,220,0.25),rgba(170,170,170,0.13))",
        backdropFilter: "blur(4px)",
        opacity: 0.72,
        transition: "opacity 0.5s",
      }}
    >
      {[...Array(10)].map((_, i) => (
        <div
          key={i}
          className={`cloud-mist cloud-mist-${i % 4}`}
          style={{
            position: "absolute",
            top: `${Math.random() * 85}%`,
            left: `${Math.random() * 100}%`,
            width: `${110 + Math.random() * 60}px`,
            height: `${32 + Math.random() * 16}px`,
            opacity: 0.38 + Math.random() * 0.17,
            background:
              "radial-gradient(ellipse at center, #bfc2c6 60%, #999b9f 100%)",
            filter: "blur(16px)",
            animation: `cloudMistDrift${i % 4} ${
              40 + Math.random() * 25
            }s linear infinite`,
            zIndex: 9,
          }}
        />
      ))}
    </div>
  );

  const FoggyOverlay = () => (
    <div
      className="foggy-overlay"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 7,
      }}
    />
  );

  const SEASON_FLASH_DARK_COLOURS = [
    "rgba(22,101,52,0.6)", // Spring - dark green
    "rgba(202,138,4,0.55)", // Summer - dark gold
    "rgba(194,65,12,0.54)", // Autumn - dark orange
    "rgba(30,64,175,0.56)", // Winter - dark blue
  ];

  const SEASONS = ["Spring", "Summer", "Autumn", "Winter"];

  const UPGRADE_COSTS = {
    tapPower: (level) => Math.floor(20 * Math.pow(1.07, level)),

    autoTapper: (level) => Math.floor(500 * Math.pow(1.06, level)),

    critChance: (level) =>
      level < 84
        ? Math.floor(40 * Math.pow(1.06, level))
        : Math.floor(40 * Math.pow(1.06, 84) * Math.pow(1.09, level - 84)),

    tapSpeedBonus: (level) =>
      level < 69
        ? Math.floor(80 * Math.pow(1.07, level))
        : Math.floor(80 * Math.pow(1.07, 69) * Math.pow(1.1, level - 69)),
  };

  const weatherDescription = (() => {
    const weather =
      typeof gameState.currentWeather === "string"
        ? gameState.currentWeather
        : "Clear";
    switch (weather) {
      case "Rain":
        return "Rain slows tap speed and lowers earnings (-10%).";
      case "Windy":
        return "Wind boosts tap speed (+5%).";
      case "Sun":
        return "Sun increases coin gains (+15%).";
      case "Hail":
        return "Hail reduces earnings (-15%).";
      case "Sleet":
        return "Sleet reduces earnings (-10%).";
      case "Cloudy":
        return "Cloudy slightly reduces earnings (-2%).";
      case "Thunder":
        return "Thunder increases crit chance (+15%).";
      case "Lightning":
        return "Lightning greatly increases crit chance (+25%).";
      case "Snow":
        return "Snow disables the Crit Chance Bonus.";
      case "Foggy":
        return "Foggy lowers crit chance (-5%).";
      default:
        return "Clear skies, no effects.";
    }
  })();

  const combinedLevel = useMemo(
    () =>
      gameState.tapPowerUpgrades +
      gameState.autoTapperUpgrades +
      gameState.critChanceUpgrades +
      gameState.tapSpeedBonusUpgrades,
    [
      gameState.tapPowerUpgrades,
      gameState.autoTapperUpgrades,
      gameState.critChanceUpgrades,
      gameState.tapSpeedBonusUpgrades,
    ]
  );

  const combinedRequired = 500 + gameState.resets * 200;
  const houseRequired = 20 + gameState.resets * 10;
  const combinedProgress = Math.min(
    (combinedLevel / combinedRequired) * 100,
    100
  );
  const houseProgress = Math.min(
    (gameState.houseLevel / houseRequired) * 100,
    100
  );
  const resetProgress = Math.min(combinedProgress, houseProgress);

  const DAILY_BONUS_RESET_HOUR = 14; // 0 = midnight, change if you want a different time

  const dailyBonuses = [
    // Upgrade levels
    {
      type: "upgrade",
      upgradeType: "tapPower",
      amount: 1,
      label: "+1 Tap Power Level",
      weight: 20,
    },
    {
      type: "upgrade",
      upgradeType: "tapPower",
      amount: 3,
      label: "+3 Tap Power Levels",
      weight: 7,
    },
    {
      type: "upgrade",
      upgradeType: "tapPower",
      amount: 5,
      label: "+5 Tap Power Levels",
      weight: 3,
    },
    {
      type: "upgrade",
      upgradeType: "tapPower",
      amount: 10,
      label: "+10 Tap Power Levels",
      weight: 1,
    },

    // Coins
    { type: "coins", percent: 0.1, label: "+10% of current coins", weight: 18 },
    {
      type: "coins",
      percent: 0.25,
      label: "+25% of current coins",
      weight: 10,
    },
    { type: "coins", percent: 0.5, label: "+50% of current coins", weight: 4 },

    // House levels
    { type: "houseLevel", amount: 1, label: "+1 House Level", weight: 10 },
    { type: "houseLevel", amount: 2, label: "+2 House Levels", weight: 4 },
    { type: "houseLevel", amount: 3, label: "+3 House Levels", weight: 1 },

    // Temporary multipliers (24h)
    {
      type: "multiplier",
      percent: 0.1,
      durationHours: 24,
      label: "10% Coin Multiplier (24h)",
      weight: 12,
    },
    {
      type: "multiplier",
      percent: 0.5,
      durationHours: 24,
      label: "50% Coin Multiplier (24h)",
      weight: 6,
    },
    {
      type: "multiplier",
      percent: 5.0,
      durationHours: 24,
      label: "500% Coin Multiplier (24h)",
      weight: 0.5,
    },
  ];

  const themeObj = CUSTOM_THEMES[gameState.equippedTheme] || {};
  const backgroundStyle = themeObj.image
    ? {
        backgroundImage: `url(${themeObj.image})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }
    : {
        backgroundImage: themeObj.background,
      };

  function equipShopBoost(boost) {
    setActiveShopBoosts((prev) => {
      if (prev.some((b) => b.id === boost.id)) return prev;
      const newBoosts = [
        ...prev,
        {
          ...boost,
          expires: boost.duration ? Date.now() + boost.duration : null,
        },
      ];
      localStorage.setItem("activeShopBoosts", JSON.stringify(newBoosts));
      return newBoosts;
    });
  }
  function unequipShopBoost(boost) {
    setActiveShopBoosts((prev) => {
      const newBoosts = prev.filter((b) => b.id !== boost.id);
      localStorage.setItem("activeShopBoosts", JSON.stringify(newBoosts));
      return newBoosts;
    });
  }

  async function handleReferralSubmit() {
    setReferralMessage("");
    setReferralMessageType("success");
    if (!referralInput) return;

    try {
      const response = await fetch("/api/game-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          pin,
          action: "redeemReferral",
          code: referralInput.trim(),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setReferralMessage("Referral code applied! Check your rewards.");
        setReferralMessageType("success");
        setReferralUsed(true);
        // Optionally update game state or reload (see below)
        loadGame();
      } else {
        setReferralMessage(data.error || "Invalid code.");
        setReferralMessageType("error");
      }
    } catch {
      setReferralMessage("Failed to apply code. Try again later.");
      setReferralMessageType("error");
    }
  }

  function getTapPower(base, activeShopBoosts) {
    let multiplier = 1;
    activeShopBoosts.forEach((b) => {
      if (b.effect === "tapPower" && (!b.expires || Date.now() < b.expires)) {
        multiplier *= b.multiplier;
      }
    });
    return base * multiplier;
  }

  function getAutoTapper(base, activeShopBoosts) {
    let multiplier = 1;
    activeShopBoosts.forEach((b) => {
      if (b.effect === "autoTapper" && (!b.expires || Date.now() < b.expires)) {
        multiplier *= b.multiplier;
      }
    });
    return base * multiplier;
  }

  function getRenownTokens(baseTokens, activeShopBoosts) {
    let multiplier = 1;
    activeShopBoosts.forEach((b) => {
      if (
        b.effect === "renownTokens" &&
        (!b.expires || Date.now() < b.expires)
      ) {
        multiplier *= b.multiplier;
      }
    });
    return Math.floor(baseTokens * multiplier);
  }

  // Helper: Calculate the *total* coins needed for N tokens
  function getTotalCoinsForTokens(n, base = 50000000, growth = 1.6) {
    // Returns sum of a geometric progression: base * (1 - growth^n) / (1 - growth)
    if (n <= 0) return 0;
    return Math.floor((base * (1 - Math.pow(growth, n))) / (1 - growth));
  }

  // Helper: How many tokens should user get for a given coinsEarned
  function getTokensFromCoins(coins, base = 50000000, growth = 1.6) {
    let tokens = 0;
    while (coins >= getTotalCoinsForTokens(tokens + 1, base, growth)) {
      tokens++;
    }
    return tokens;
  }

  const SHOOTING_STAR_COUNT = 1;

  function getRandomStar() {
    return {
      id: Math.random().toString(36).substr(2, 8) + Date.now(),
      left: Math.random() * 80 + 2 + "%", // stay on screen, not too close to right
      top: Math.random() * 60 + 2 + "%",
      duration: 1.7 + Math.random() * 1.3, // between 0.9s and 2.2s
      delay: Math.random() * 3, // random delay between 0s and 3s
    };
  }

  function SpaceEffects() {
    const [stars, setStars] = useState(
      Array.from({ length: SHOOTING_STAR_COUNT }, () => getRandomStar())
    );

    useEffect(() => {
      // For each star, set a timer to respawn it when its animation is done
      const timers = stars.map((star, idx) => {
        return setTimeout(() => {
          setStars((prevStars) => {
            const newStars = [...prevStars];
            newStars[idx] = getRandomStar();
            return newStars;
          });
        }, (star.delay + star.duration) * 1000);
      });
      return () => timers.forEach((t) => clearTimeout(t));
    }, [stars]);

    return (
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      >
        {/* STATIC BACKGROUND STARS: always on, always in the same place */}
        {STATIC_STARS.map(({ id, top, left, size, opacity }) => (
          <span
            key={id}
            className="star"
            style={{
              top,
              left,
              width: `${size}px`,
              height: `${size}px`,
              opacity,
              position: "absolute",
              borderRadius: "50%",
              background: "white",
              boxShadow: `0 0 ${6 + size * 3}px ${size}px white`,
              pointerEvents: "none",
            }}
          />
        ))}

        {/* SHOOTING STARS */}
        {stars.map(({ id, left, top, duration, delay }) => (
          <div
            key={id}
            className="shooting-star"
            style={{
              left,
              top,
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
            }}
          />
        ))}

        {/* PLANETS */}
        <div
          className="planet"
          style={{
            top: "40%",
            left: "75%",
            position: "absolute",
            width: 80,
            height: 80,
          }}
        />
        <div
          className="planet"
          style={{
            top: "17%",
            left: "35%",
            position: "absolute",
            width: 60,
            height: 60,
            background:
              "radial-gradient(circle at 40% 40%, #ff6565 70%, #910808 100%)",
          }}
        >
          <div
            className="planet-ring"
            style={{
              width: 90,
              height: 32,
              top: "30%",
              left: "-30%",
              borderColor: "rgba(156, 163, 175, 0.7)",
              boxShadow: "0 0 10px 2px rgba(156, 163, 175, 0.7)",
              transform: "rotate(38deg)",
              borderWidth: "2px",
            }}
          />
        </div>
        <div
          className="planet"
          style={{
            top: "50%",
            left: "20%",
            position: "absolute",
            width: 46,
            height: 46,
            background: "radial-gradient(circle at 35% 35%, #6b7280, #111827)",
          }}
        />
      </div>
    );
  }

  function HellEffects() {
    // Generate 18 embers: half float up, half float down, randomly placed
    const embers = Array.from({ length: 18 }).map((_, i) => {
      const direction = Math.random() > 0.5 ? "normal" : "reverse"; // up or down
      return {
        left: `${Math.random() * 98}%`,
        top: `${Math.random() * 98}%`,
        animationDelay: `${Math.random() * 4}s`,
        direction,
        key: `ember-${i}-${Math.random()}`,
      };
    });

    return (
      <>
        {/* Strong vignette for hell theme */}
        <div className="hell-vignette" />

        {/* Floating embers all over, some rise, some fall */}
        {embers.map(({ left, top, animationDelay, direction, key }) => (
          <div
            key={key}
            className="hell-ember"
            style={{
              left,
              top,
              animationDelay,
              animationDirection: direction, // 'normal' = up, 'reverse' = down
            }}
          />
        ))}
      </>
    );
  }

  function HeavenEffects() {
    return <div className="heavenly-glow" />;
  }

  function CloudBackground() {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Bigger, fluffier clouds */}
        <div className="cloud w-64 h-32 bg-white rounded-full opacity-40 absolute top-16 left-12 animate-cloudMove"></div>
        <div className="cloud w-48 h-24 bg-white rounded-full opacity-30 absolute top-36 right-20 animate-cloudMoveSlow"></div>
        <div className="cloud w-56 h-28 bg-white rounded-full opacity-35 absolute top-8 right-56 animate-cloudMove"></div>
      </div>
    );
  }

  function startBoost(durationHours) {
    const expires = Date.now() + durationHours * 60 * 60 * 1000;
    const newBoost = { multiplier: 3, expires };
    setActiveBoost(newBoost);
    localStorage.setItem("activeBoost", JSON.stringify(newBoost));
  }

  // Helper to pick a weighted random bonus
  function pickRandomBonus(bonuses) {
    const weighted = [];
    bonuses.forEach((b) => {
      for (let i = 0; i < b.weight * 10; i++) weighted.push(b);
    });
    return weighted[Math.floor(Math.random() * weighted.length)];
  }

  function generateQuest(gameState) {
    const quest =
      QUEST_TEMPLATES[Math.floor(Math.random() * QUEST_TEMPLATES.length)];
    const max = quest.max === 0 ? quest.min : quest.max;
    const amount =
      Math.floor(Math.random() * (max - quest.min + 1)) + quest.min;
    const init = quest.getInit(gameState, amount);
    console.log(
      "Creating quest",
      quest.id,
      "with startLevel",
      init.startLevel,
      "and current houseLevel",
      gameState.houseLevel
    );
    return {
      id: quest.id,
      description: quest.getDescription(init.targetAmount),
      ...init,
    };
  }

  function formatDuration(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  function formatNumberShort(num) {
    if (num < 1_000) return num.toString();

    const abbreviations = [
      { value: 1e33, symbol: "Dc" }, // Decillion
      { value: 1e30, symbol: "Nn" }, // Nonillion
      { value: 1e27, symbol: "Oc" }, // Octillion
      { value: 1e24, symbol: "Sp" }, // Septillion
      { value: 1e21, symbol: "Sx" }, // Sextillion
      { value: 1e18, symbol: "Qi" }, // Quintillion
      { value: 1e15, symbol: "Qa" }, // Quadrillion
      { value: 1e12, symbol: "T" }, // Trillion
      { value: 1e9, symbol: "B" }, // Billion
      { value: 1e6, symbol: "M" }, // Million
      { value: 1e3, symbol: "K" },
    ];

    for (let i = 0; i < abbreviations.length; i++) {
      if (num >= abbreviations[i].value) {
        return (
          (num / abbreviations[i].value).toFixed(1).replace(/\.0$/, "") +
          abbreviations[i].symbol
        );
      }
    }
    return num.toString();
  }

  function renderDoubleEarningsModal() {
    if (!doubleEarningsSacrifice || !doubleEarningsOfflineEarningsBackup)
      return null;

    const { type, upgradeKey, amount } = doubleEarningsSacrifice;
    const coins = doubleEarningsOfflineEarningsBackup.coins;

    // Use your mapping object for friendly upgrade names

    return (
      <div
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
        style={{ alignItems: "flex-start", paddingTop: "6rem" }}
      >
        <div
          className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-lg border border-gray-300"
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}
        >
          <h3 className="text-xl font-semibold mb-4 text-gray-900">
            Double Offline Earnings?
          </h3>

          <p className="mb-4 text-gray-700">
            Sacrifice{" "}
            <strong>
              {amount}{" "}
              {type === "upgrade"
                ? UPGRADE_DISPLAY_NAMES[upgradeKey] || upgradeKey
                : "House Level"}
            </strong>{" "}
            to double your offline earnings of{" "}
            <strong>{formatNumberShort(coins)} coins</strong>?
          </p>

          <div className="flex justify-between">
            <button
              onClick={() => {
                setShowDoubleEarningsModal(false);
                setDoubleEarningsSacrifice(null);
                setDoubleEarningsOfflineEarningsBackup(null);
              }}
              className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 text-gray-800"
            >
              Cancel
            </button>

            <button
              onClick={handleDoubleEarningsAccept}
              className="px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white font-semibold"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Helper: get next reset time (e.g., 14:00 each day)
  function getNextDailyReset(lastClaim) {
    const claimDate = lastClaim ? new Date(lastClaim) : new Date();
    const nextReset = new Date(claimDate);
    nextReset.setHours(DAILY_BONUS_RESET_HOUR, 0, 0, 0);
    if (claimDate >= nextReset) nextReset.setDate(nextReset.getDate() + 1);
    return nextReset.getTime();
  }

  function getTotalUpgradeCost(type, currentLevel, multiplier) {
    let total = 0;
    for (let i = 0; i < multiplier; i++) {
      total += UPGRADE_COSTS[type](currentLevel + i);
    }
    return total;
  }

  function getMaxAffordableUpgrades(type, currentLevel, coins) {
    let total = 0,
      count = 0;
    while (total + UPGRADE_COSTS[type](currentLevel + count) <= coins) {
      total += UPGRADE_COSTS[type](currentLevel + count);
      count++;
    }
    return Math.max(count, 1);
  }

  function claimQuestReward() {
    setNotification("Quest complete! Reward: 🚀 10x Boost for 10m");
    setHasBoost(true);
    setBoostTimeLeft(600);

    // Generate new quest and save to localStorage
    const newQuest = generateQuest(gameState);
    setCurrentQuest(newQuest);
    setCanClaimQuest(false);
    localStorage.setItem("currentQuest", JSON.stringify(newQuest));
  }

  // Calculate if daily bonus can be claimed
  function canClaimDailyBonus(lastClaim) {
    const now = Date.now();
    // If never claimed
    if (!lastClaim) return true;
    // If current time is after the next reset since last claim
    return now >= getNextDailyReset(lastClaim);
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveShopBoosts((prev) => {
        const now = Date.now();
        const newBoosts = prev.filter((b) => !b.expires || now < b.expires);
        if (newBoosts.length !== prev.length) {
          localStorage.setItem("activeShopBoosts", JSON.stringify(newBoosts));
        }
        return newBoosts;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // QUEST PROGRESS CHECKER
  useEffect(() => {
    if (!currentQuest) return;
    const template = QUEST_TEMPLATES.find((q) => q.id === currentQuest.id);
    if (template && template.check(gameState, currentQuest)) {
      setCanClaimQuest(true);
    } else {
      setCanClaimQuest(false);
    }
  }, [gameState, currentQuest]);

  useEffect(() => {
    if (!activeBoost) return;
    if (activeBoost.isPermanent) return; // Permanent boosts don't expire
    const interval = setInterval(() => {
      if (
        activeBoost &&
        activeBoost.expires &&
        Date.now() > activeBoost.expires
      ) {
        setActiveBoost(null);
        localStorage.removeItem("activeBoost");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeBoost]);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    const storedPin = localStorage.getItem("pin");

    if (!storedUserId || !storedPin) {
      window.location.href = "/login";
      return;
    }

    setUserId(storedUserId);
    setPin(storedPin);
  }, []);

  useEffect(() => {
    // Only trigger in thunder or lightning
    if (
      gameState.currentWeather === "Thunder" ||
      gameState.currentWeather === "Lightning"
    ) {
      let timeoutId;
      let intervalId;

      // Function to show flash, hide after 120ms, repeat every 5–7s
      const triggerFlash = () => {
        setShowWeatherFlash(true);
        timeoutId = setTimeout(() => {
          setShowWeatherFlash(false);
        }, 250);
      };

      // Flash every 5–7s
      triggerFlash(); // First flash on entering weather
      intervalId = setInterval(() => {
        triggerFlash();
      }, 5000 + Math.random() * 2000); // 5–7 seconds

      return () => {
        clearTimeout(timeoutId);
        clearInterval(intervalId);
        setShowWeatherFlash(false);
      };
    } else {
      setShowWeatherFlash(false);
    }
  }, [gameState.currentWeather]);

  const RainParticles = () => (
    <div className="rain-container">
      {rainDrops.map((drop) => (
        <div
          key={drop.id}
          className="rain-particle"
          style={{
            left: `${drop.left}vw`,
            animationDuration: `${drop.duration}s`,
            animationDelay: `-${Math.random() * drop.duration}s`,
          }}
        />
      ))}
    </div>
  );

  const loadGame = async () => {
    if (!userId || !pin) return;

    try {
      const response = await fetch("/api/game-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, pin, action: "load" }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("userId");
          localStorage.removeItem("pin");
          window.location.href = "/login";
          return;
        }
        throw new Error("Failed to load game state");
      }

      const data = await response.json();
      if (data.gameState) {
        setGameState({
          ...data.gameState,
          coins: Number(data.gameState.coins),
          tapPower: Number(data.gameState.tap_power),
          tapPowerUpgrades: Number(data.gameState.tap_power_upgrades) || 0,
          autoTapper: Number(data.gameState.auto_tapper),
          autoTapperUpgrades: Number(data.gameState.auto_tapper_upgrades) || 0,
          critChance: Number(data.gameState.crit_chance),
          critChanceUpgrades: Number(data.gameState.crit_chance_upgrades) || 0,
          tapSpeedBonus: Number(data.gameState.tap_speed_bonus),
          tapSpeedBonusUpgrades:
            Number(data.gameState.tap_speed_bonus_upgrades) || 0,
          totalTaps: Number(data.gameState.total_taps),
          totalCoinsEarned: Number(data.gameState.total_coins_earned),
          resets: Number(data.gameState.resets),
          permanentMultiplier: Number(data.gameState.permanent_multiplier),
          currentSeason: Number(data.gameState.current_season),
          houseLevel: Number(data.gameState.house_level),
          houseCoinsMultiplier: Number(data.gameState.house_coins_multiplier),
          hasFirstReset: Boolean(data.gameState.has_first_reset),
          currentWeather: data.gameState.current_weather || "Clear",
          currentYear: Number(data.gameState.current_year) || 0,
          houseName: data.gameState.house_name || "My Cozy Home",
          profileName: data.gameState.profile_name || "Player",
          coinsEarnedThisRun: Number(data.gameState.coins_earned_this_run) || 0,
          renownTokens:
            Number(
              data.gameState.renownTokens ?? data.gameState.renown_tokens
            ) || 0,
        });
        // After setGameState({ ...data.gameState ... }) inside loadGame:

        if (data.gameState.currentQuest) {
          const quest = data.gameState.currentQuest;
          const questTemplate = QUEST_TEMPLATES.find((q) => q.id === quest.id);

          // Evaluate progress correctly
          let isComplete = false;
          if (questTemplate) {
            isComplete = questTemplate.check(data.gameState, quest);
          }

          if (isComplete) {
            // Generate a new quest with the new startLevel, using current upgrade value
            const newQuest = generateQuest(data.gameState);
            setCurrentQuest(newQuest);
            setCanClaimQuest(false);
            // Optionally, update backend
            saveGame({
              ...data.gameState,
              currentQuest: newQuest,
              canClaimQuest: false,
            });
          } else {
            setCurrentQuest(quest);
            setCanClaimQuest(data.gameState.canClaimQuest ?? false);
          }
        } else {
          // New user or no quest in DB
          const newQuest = generateQuest(data.gameState);
          setCurrentQuest(newQuest);
          setCanClaimQuest(false);
        }

        if (data.gameState.lastDailyClaim) {
          setLastDailyClaim(Number(data.gameState.lastDailyClaim));
          localStorage.setItem(
            "lastDailyClaim",
            String(data.gameState.lastDailyClaim)
          );
        }

        const lastActive = Number(localStorage.getItem("lastActiveTime"));
        if (lastActive && !isNaN(lastActive)) {
          const now = Date.now();
          const seconds = Math.floor((now - lastActive) / 1000);
          if (seconds > 30) {
            const maxSeconds = 3 * 60 * 60;
            const offlineSeconds = Math.min(seconds, maxSeconds);
            const coins =
              getAutoTapper(
                Number(data.gameState.auto_tapper),
                activeShopBoosts
              ) * offlineSeconds;
            setPendingOfflineEarnings({
              seconds: offlineSeconds,
              coins: coins,
            });
          }
          localStorage.removeItem("lastActiveTime");
        }

        if (data.gameState.boost_active_until) {
          const boostEnd = new Date(data.gameState.boost_active_until);
          if (boostEnd > new Date()) {
            setHasBoost(true);
            setBoostTimeLeft(Math.floor((boostEnd - new Date()) / 1000));
          }
        }
      }
    } catch (error) {
      console.error("Error loading game:", error);
    }
  };

  useEffect(() => {
    loadGame();
  }, [userId, pin]);

  useEffect(() => {
    if (canClaimDailyBonus(lastDailyClaim)) {
      setBonusCooldown(0);
    } else {
      // Milliseconds left until next claim allowed
      setBonusCooldown(getNextDailyReset(lastDailyClaim) - Date.now());
    }
  }, [lastDailyClaim]);

  useEffect(() => {
    // If equippedTheme exists and is NOT "seasons", don't cycle seasons or year
    if (gameState.equippedTheme && gameState.equippedTheme !== "seasons") {
      // Make sure currentSeason and currentYear stay fixed (don't update)
      return;
    }

    const combinedLevel =
      (gameState.tapPowerUpgrades || 0) +
      (gameState.autoTapperUpgrades || 0) +
      (gameState.critChanceUpgrades || 0) +
      (gameState.tapSpeedBonusUpgrades || 0);

    const newSeason = Math.floor(combinedLevel / 50) % 4;
    const newYear = Math.floor(combinedLevel / 200);

    if (
      newSeason !== gameState.currentSeason ||
      newYear !== gameState.currentYear
    ) {
      setGameState((prev) => ({
        ...prev,
        currentSeason: newSeason,
        currentYear: newYear,
      }));
      assignNewWeather();
    }
  }, [
    gameState.tapPowerUpgrades,
    gameState.autoTapperUpgrades,
    gameState.critChanceUpgrades,
    gameState.tapSpeedBonusUpgrades,
    gameState.currentSeason,
    gameState.currentYear,
    gameState.equippedTheme, // add equippedTheme as dependency
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      const autoTapperAmount = getAutoTapper(
        gameState.autoTapper,
        activeShopBoosts
      );
      if (autoTapperAmount > 0) {
        setGameState((prev) => ({
          ...prev,
          coins: prev.coins + autoTapperAmount,
          totalCoinsEarned: prev.totalCoinsEarned + autoTapperAmount,
        }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState.autoTapper]);

  const saveGame = useCallback(
    async (stateToSave = gameState) => {
      if (!userId || !pin) return;
      try {
        await fetch("/api/game-state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            pin,
            action: "save",
            gameState: {
              ...stateToSave,
              coins: Number(stateToSave.coins),
              tap_power: stateToSave.tapPower,
              tap_power_upgrades: stateToSave.tapPowerUpgrades,
              auto_tapper: stateToSave.autoTapper,
              auto_tapper_upgrades: stateToSave.autoTapperUpgrades,
              crit_chance: stateToSave.critChance,
              crit_chance_upgrades: stateToSave.critChanceUpgrades,
              tap_speed_bonus: stateToSave.tapSpeedBonus,
              tap_speed_bonus_upgrades: stateToSave.tapSpeedBonusUpgrades,
              total_taps: stateToSave.totalTaps,
              total_coins_earned: stateToSave.totalCoinsEarned,
              coins_earned_this_run: Math.floor(
                stateToSave.coinsEarnedThisRun || 0
              ),
              permanent_multiplier: stateToSave.permanentMultiplier,
              current_season: stateToSave.currentSeason,
              house_level: stateToSave.houseLevel,
              house_decorations: stateToSave.houseDecorations || [],
              house_theme: stateToSave.houseTheme || "cottage",
              house_coins_multiplier: stateToSave.houseCoinsMultiplier,
              has_first_reset: stateToSave.hasFirstReset,
              house_name: stateToSave.houseName,
              profile_name: stateToSave.profileName,
              current_weather: stateToSave.currentWeather || "Clear",
              current_year: stateToSave.currentYear || 0,
              current_quest: currentQuest,
              can_claim_quest: canClaimQuest,
              boost_active_until:
                stateToSave.boostActiveUntil ||
                (hasBoost ? new Date(Date.now() + boostTimeLeft * 1000) : null),
              renown_tokens: stateToSave.renownTokens || 0,
              owned_profile_icons: stateToSave.ownedProfileIcons || [],
              profile_icon: stateToSave.profileIcon || null,
              owned_boosts: stateToSave.ownedBoosts || [],
              owned_themes: stateToSave.ownedThemes || ["seasons"],
              equipped_theme: stateToSave.equippedTheme || "seasons",
            },
          }),
        });
      } catch (error) {
        console.error("Error saving game:", error);
      }
    },
    [
      userId,
      pin,
      hasBoost,
      boostTimeLeft,
      gameState,
      currentQuest,
      canClaimQuest,
    ]
  );

  useEffect(() => {
    let timer;
    if (notification) {
      timer = setTimeout(() => {
        setNotification(null);
      }, 2000);
    }
    return () => clearInterval(timer);
  }, [notification]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      const id = Math.random().toString(36).substr(2, 9);
      const duration = 5 + Math.random() * 2;

      setRainDrops((prev) => [
        ...prev,
        { id, left: Math.random() * 100, duration },
      ]);

      setTimeout(() => {
        setRainDrops((prev) => prev.filter((drop) => drop.id !== id));
      }, duration * 1000);
    }, 150);

    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    if (
      gameState.currentWeather !== "Snow" &&
      gameState.currentWeather !== "Sleet"
    ) {
      setSnowParticles([]);
      return;
    }

    const interval = setInterval(() => {
      const id = Math.random().toString(36).substr(2, 9);
      const duration = 5 + Math.random() * 2; // 5-7 seconds lifespan

      setSnowParticles((prev) => [
        ...prev,
        {
          id,
          left: Math.random() * 100,
          duration,
          opacity: 0.6 + Math.random() * 0.4,
          drift: (Math.random() - 0.5) * 20, // sideways drift for snowflakes
        },
      ]);

      setTimeout(() => {
        setSnowParticles((prev) => prev.filter((drop) => drop.id !== id));
      }, duration * 1000);
    }, 150);

    return () => clearInterval(interval);
  }, [gameState.currentWeather]);

  React.useEffect(() => {
    if (gameState.currentWeather !== "Hail") return setHailParticles([]);
    const interval = setInterval(() => {
      const id = Math.random().toString(36).substr(2, 9);
      const duration = 1 + Math.random() * 0.7; // 1–1.7 seconds
      const drift = (Math.random() - 0.5) * 20; // left or right drift between -10vw to 10vw approx
      setHailParticles((prev) => [
        ...prev,
        {
          id,
          left: Math.random() * 100,
          delay: Math.random(),
          duration,
          opacity: 0.7 + Math.random() * 0.15,
          drift,
        },
      ]);
      setTimeout(() => {
        setHailParticles((prev) => prev.filter((drop) => drop.id !== id));
      }, duration * 1000);
    }, 80);
    return () => clearInterval(interval);
  }, [gameState.currentWeather]);

  useEffect(() => {
    const saveLastActive = () => {
      localStorage.setItem("lastActiveTime", Date.now());
    };

    window.addEventListener("beforeunload", saveLastActive);
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        saveLastActive();
      }
    });

    return () => {
      window.removeEventListener("beforeunload", saveLastActive);
      window.removeEventListener("visibilitychange", saveLastActive);
    };
  }, []);

  useEffect(() => {
    let timer;
    if (hasBoost && boostTimeLeft > 0) {
      timer = setInterval(() => {
        setBoostTimeLeft((prev) => {
          if (prev <= 1) {
            setHasBoost(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [hasBoost, boostTimeLeft]);

  const handleActivateShopBoost = useCallback((boost) => {
    if (boost.isPermanent) {
      setActiveBoost({
        ...boost,
        isPermanent: true,
        expires: null,
      });
      setNotification(`✅ ${boost.name} equipped!`);
      localStorage.setItem(
        "activeBoost",
        JSON.stringify({
          ...boost,
          isPermanent: true,
          expires: null,
        })
      );
    } else {
      const expires = Date.now() + boost.duration;
      setActiveBoost({
        ...boost,
        expires,
      });
      setNotification(`🚀 ${boost.name} activated for 24 hours!`);
      localStorage.setItem(
        "activeBoost",
        JSON.stringify({
          ...boost,
          expires,
        })
      );
    }
  }, []);

  const activateBoost = useCallback(() => {
    setHasBoost(true);
    setBoostTimeLeft(600);
    setNotification("🚀 10x Boost activated for 10 minutes!");
  }, []);

  useEffect(() => {
    if (
      gameState.currentWeather === "Rain" ||
      gameState.currentWeather === "Sleet"
    ) {
      const particles = Array.from({ length: 100 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random(),
        duration: 0.7 + Math.random() * 0.5,
      }));
      setRainParticles(particles);
    } else {
      setRainParticles([]);
    }

    if (gameState.currentWeather === "Hail") {
      const particles = Array.from({ length: 70 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 1.5,
        duration: 1 + Math.random(),
      }));
      setHailParticles(particles);
    } else {
      setHailParticles([]);
    }
  }, [gameState.currentWeather]);

  const buyLimitedItem = async ({ itemId, itemType, price }) => {
    if (!userId || !pin) {
      setNotification("You must be logged in to buy items.");
      console.error("[buyLimitedItem] Not logged in: missing userId or pin");
      return { error: "Not logged in" };
    }

    console.log("[buyLimitedItem] Called with:", {
      itemId,
      itemType,
      price,
      userId,
      pin,
    });

    try {
      const response = await fetch("/api/game-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          pin,
          action: "buyLimitedItem",
          itemId,
          itemType,
          price,
        }),
      });

      console.log("[buyLimitedItem] Response status:", response.status);

      if (!response.ok) {
        const text = await response.text();
        console.error("[buyLimitedItem] Non-OK response:", text);
        setNotification("Failed to purchase item.");
        return { error: "Failed to purchase item" };
      }

      const data = await response.json();

      console.log("[buyLimitedItem] Response JSON:", data);

      if (data.error) {
        console.warn(
          "[buyLimitedItem] Server returned error:",
          data.error,
          "Details:",
          data.details || "No details"
        );
        setNotification(`Purchase error: ${data.error}`);
        return { error: data.error };
      }

      // Defensive checks before updating state
      if (typeof price !== "number" || price < 0) {
        console.error("[buyLimitedItem] Invalid price:", price);
        setNotification("Invalid item price.");
        return { error: "Invalid price" };
      }

      setGameState((prev) => {
        if (!prev) {
          console.error(
            "[buyLimitedItem] Previous game state is undefined or null"
          );
          return prev;
        }

        console.log(
          "[buyLimitedItem] Previous ownedProfileIcons:",
          prev.ownedProfileIcons
        );
        console.log("[buyLimitedItem] Previous ownedThemes:", prev.ownedThemes);
        console.log(
          "[buyLimitedItem] Previous renownTokens:",
          prev.renownTokens
        );

        let newOwnedProfileIcons = Array.isArray(prev.ownedProfileIcons)
          ? [...prev.ownedProfileIcons]
          : [];
        let newOwnedThemes = Array.isArray(prev.ownedThemes)
          ? [...prev.ownedThemes]
          : [];
        let newRenownTokens =
          typeof prev.renownTokens === "number" ? prev.renownTokens : 0;

        if (itemType === "profileIcon") {
          if (!newOwnedProfileIcons.includes(itemId)) {
            newOwnedProfileIcons.push(itemId);
            console.log(`[buyLimitedItem] Added profileIcon: ${itemId}`);
          } else {
            console.warn(
              `[buyLimitedItem] profileIcon already owned: ${itemId}`
            );
          }
        } else if (itemType === "theme") {
          if (!newOwnedThemes.includes(itemId)) {
            newOwnedThemes.push(itemId);
            console.log(`[buyLimitedItem] Added theme: ${itemId}`);
          } else {
            console.warn(`[buyLimitedItem] theme already owned: ${itemId}`);
          }
        } else {
          console.warn(`[buyLimitedItem] Unknown itemType: ${itemType}`);
        }

        newRenownTokens -= price;
        if (newRenownTokens < 0) {
          console.error(
            "[buyLimitedItem] Renown tokens would become negative:",
            newRenownTokens
          );
          newRenownTokens = 0; // Or handle error as you want
        }

        console.log(
          "[buyLimitedItem] New ownedProfileIcons:",
          newOwnedProfileIcons
        );
        console.log("[buyLimitedItem] New ownedThemes:", newOwnedThemes);
        console.log("[buyLimitedItem] New renownTokens:", newRenownTokens);

        return {
          ...prev,
          ownedProfileIcons: newOwnedProfileIcons,
          ownedThemes: newOwnedThemes,
          renownTokens: newRenownTokens,
        };
      });

      setNotification("Item purchased successfully!");
      return { success: true };
    } catch (error) {
      console.error("[buyLimitedItem] Unexpected error:", error);
      setNotification("Error purchasing item.");
      return { error: error.message || "Unknown error" };
    }
  };

  const renderResetModal = () => {
    const tokensToEarn = getTokensFromCoins(gameState.coinsEarnedThisRun || 0);

    const canReset = tokensToEarn > 0;

    return (
      <div
        className="fixed inset-0 bg-black/60 z-50 flex justify-center"
        style={{ alignItems: "flex-start", paddingTop: "6rem" }}
      >
        <div
          className="
          bg-gradient-to-br from-purple-400/50 via-purple-200/40 to-purple-600/60
          backdrop-blur-xl rounded-2xl p-8 max-w-sm w-full border border-white/30 shadow-lg relative
        "
          style={{
            background:
              "linear-gradient(135deg, rgba(192,132,252,0.95), rgba(139,92,246,0.75), rgba(59,7,100,0.7))",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            boxShadow: "0 8px 32px 0 rgba(124,58,237,0.18)",
          }}
        >
          <h3 className="text-xl font-medium text-[#2d3748] mb-4 flex items-center justify-between">
            Reset Progress?
            {/* Info Icon */}
            <button
              onClick={() => setShowResetInfo((prev) => !prev)}
              onMouseEnter={() => setShowResetInfo(true)}
              onMouseLeave={() => setShowResetInfo(false)}
              aria-label="Info about Renown Tokens"
              className="text-gray-400 hover:text-white focus:outline-none ml-2 relative"
              style={{ fontSize: "1.25rem" }}
            >
              <i className="fas fa-info-circle" />
              {showResetInfo && (
                <div
                  className="absolute top-full right-0 mt-2 w-64 p-3 bg-white/90 rounded-lg shadow-lg text-gray-700 text-sm z-50 border border-gray-300"
                  onMouseEnter={() => setShowResetInfo(true)}
                  onMouseLeave={() => setShowResetInfo(false)}
                >
                  <strong>Renown Tokens Info</strong>
                  <p className="mt-1">
                    Renown Tokens are earned each time you reset your progress.
                    You earn 1 token after your first 50M, this number increases
                    exponentially with each earned token. Each token permanently
                    increases your coin multiplier by 2%. Resetting lets you
                    start fresh but with a permanent boost to your earnings.
                  </p>
                </div>
              )}
            </button>
          </h3>

          <p className="text-center text-lg font-semibold text-[#2d3748] my-4">
            You will earn:{" "}
            <span className="text-green-400 font-bold">
              {tokensToEarn} Renown Token{tokensToEarn !== 1 ? "s" : ""}
            </span>
          </p>

          {!canReset && (
            <p className="text-center text-red-400 mb-4">
              You need more progress to earn Renown Tokens. Keep playing!
            </p>
          )}

          {/* Current and New Multiplier info */}
          <p className="text-center text-purple-200 text-sm mb-4">
            Current Multiplier:{" "}
            <strong>{(gameState.permanentMultiplier || 1).toFixed(2)}x</strong>
          </p>
          {canReset && (
            <p className="text-center text-purple-200 text-sm mb-6">
              New Multiplier after reset:{" "}
              <strong>
                {(
                  (gameState.permanentMultiplier || 1) +
                  tokensToEarn * 0.05
                ).toFixed(2)}
                x
              </strong>
            </p>
          )}

          <div className="flex justify-between mt-6 gap-3">
            <button
              className={`px-4 py-2 rounded-xl transition-all duration-200 font-semibold shadow ${
                canReset
                  ? "bg-gradient-to-r from-[#a78bfa] to-[#7c3aed] text-white hover:scale-105"
                  : "bg-gray-400/70 text-gray-200 cursor-not-allowed"
              }`}
              onClick={() => {
                if (canReset) {
                  handleReset();
                }
              }}
              disabled={!canReset}
            >
              Reset
            </button>
            <button
              className="px-4 py-2 rounded-xl bg-white/30 text-[#7c3aed] hover:bg-white/60 font-semibold shadow transition-all duration-200"
              onClick={() => setShowResetModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleReset = useCallback(() => {
    const tokensEarnedRaw = getTokensFromCoins(
      gameState.coinsEarnedThisRun || 0,
      50000000,
      1.6
    );
    const tokensEarned = getRenownTokens(tokensEarnedRaw, activeShopBoosts);

    if (tokensEarned === 0) {
      setNotification(
        "You need more progress to earn Renown Tokens. Keep playing!"
      );
      return;
    }

    const newRenownTotal = gameState.renownTokens + tokensEarned;

    const newState = {
      ...gameState,
      coins: 0,
      tapPower: 1,
      tapPowerUpgrades: 0,
      autoTapper: 0,
      autoTapperUpgrades: 0,
      critChance: 0,
      critChanceUpgrades: 0,
      tapSpeedBonus: 0,
      tapSpeedBonusUpgrades: 0,
      totalCoinsEarned: gameState.totalCoinsEarned, // Do not reset this
      coinsEarnedThisRun: 0, // <-- Reset to zero on prestige
      resets: gameState.resets + 1,
      houseLevel: 1,
      houseCoinsMultiplier: 0,
      permanentMultiplier: 1 + newRenownTotal * 0.015, // 5% bonus per Renown Token
      renownTokens: newRenownTotal,
      currentSeason: 0,
      currentYear: 0,
      hasFirstReset: true,
    };

    setGameState(newState);
    saveGame(newState);
    localStorage.setItem("lastActiveTime", Date.now());

    setNotification(
      `Reset successful! You earned ${tokensEarned} Renown Token${
        tokensEarned > 1 ? "s" : ""
      }. Total Renown: ${newRenownTotal}.`
    );
    setShowResetModal(false);
  }, [gameState, saveGame]);

  const handleTap = useCallback(() => {
    const now = Date.now();
    const recentTapWindow = 2000;
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    const requiredTapsForSpeedBonus = isMobile ? 2 : 3;

    const recentTaps = lastTapTimes.filter(
      (time) => now - time < recentTapWindow
    );
    const updatedTapTimes = [...recentTaps, now];
    setLastTapTimes(updatedTapTimes);

    let tapMultiplier = 1;
    if (hasBoost) tapMultiplier *= 10;

    let adjustedSpeedBonus = gameState.tapSpeedBonus;
    if (gameState.currentWeather === "Rain") adjustedSpeedBonus *= 0.9;
    if (gameState.currentWeather === "Windy") adjustedSpeedBonus *= 1.05;

    if (
      updatedTapTimes.length >= requiredTapsForSpeedBonus &&
      adjustedSpeedBonus > 0
    ) {
      tapMultiplier *= 1 + adjustedSpeedBonus / 100;
    }

    let adjustedCritChance = gameState.critChance;
    if (gameState.currentWeather === "Thunder") adjustedCritChance += 15;
    if (gameState.currentWeather === "Lightning") adjustedCritChance += 25;
    if (gameState.currentWeather === "Foggy") adjustedCritChance -= 5;
    if (gameState.currentWeather === "Snow") adjustedCritChance = 0;

    const isCritical = Math.random() < adjustedCritChance / 100;
    if (isCritical) {
      tapMultiplier *= 2.5;
      showFloatingNumber("CRITICAL!", "#ff0000");
    }

    const baseCoins =
      getTapPower(gameState.tapPower, activeShopBoosts) *
      gameState.permanentMultiplier *
      tapMultiplier;
    const coinsBeforeWeather = baseCoins * (1 + gameState.houseCoinsMultiplier);

    let weatherMultiplier = 1;
    if (gameState.currentWeather === "Rain") weatherMultiplier *= 0.9;
    if (gameState.currentWeather === "Sun") weatherMultiplier *= 1.15;
    if (gameState.currentWeather === "Hail") weatherMultiplier *= 0.85;
    if (gameState.currentWeather === "Sleet") weatherMultiplier *= 0.9;
    if (gameState.currentWeather === "Cloudy") weatherMultiplier *= 0.98;

    const boostMultiplier = activeBoost?.multiplier || 1;
    let coinsEarned = coinsBeforeWeather * weatherMultiplier * boostMultiplier;

    // Apply daily bonus multiplier if active
    const nowTime = Date.now();
    if (
      gameState.tempMultiplier &&
      typeof gameState.tempMultiplier.percent === "number" &&
      gameState.tempMultiplier.expires &&
      nowTime < gameState.tempMultiplier.expires
    ) {
      coinsEarned *= 1 + gameState.tempMultiplier.percent;
    }

    const showCoinNumberChance = 0.6;
    if (Math.random() < showCoinNumberChance) {
      showFloatingNumber(`+${Math.floor(coinsEarned)}`, "#FFD700");
    }
    if (hasBoost) {
      showFloatingNumber(`+${Math.floor(coinsEarned)}`, "#FFB6C1");
    }

    const combinedLevel =
      (gameState.tapPowerUpgrades || 0) +
      (gameState.autoTapperUpgrades || 0) +
      (gameState.critChanceUpgrades || 0) +
      (gameState.tapSpeedBonusUpgrades || 0);

    const newSeason = Math.floor(combinedLevel / 50) % 4;

    const weatherChangeChance = 0.03;
    let newWeather = gameState.currentWeather;
    if (Math.random() < weatherChangeChance) {
      newWeather = getNewWeather();
    }

    const newYear = Math.floor(combinedLevel / 200);

    const newState = {
      ...gameState,
      coins: gameState.coins + coinsEarned,
      totalCoinsEarned: gameState.totalCoinsEarned + coinsEarned,
      coinsEarnedThisRun: (gameState.coinsEarnedThisRun || 0) + coinsEarned, // <-- Increment each tap
      totalTaps: gameState.totalTaps + 1,
    };

    // Only update currentWeather if it actually changed
    if (newWeather !== gameState.currentWeather) {
      newState.currentWeather = newWeather;
    }

    setGameState(newState);
    saveGame(newState);
    localStorage.setItem("lastActiveTime", Date.now());
  }, [gameState, lastTapTimes, hasBoost]);

  const handleUpgrade = useCallback(
    (type, multiplier = 1) => {
      if (!UPGRADE_COSTS[type]) {
        setNotification(`Unknown upgrade type: ${type}`);
        return;
      }

      let state = { ...gameState };
      let upgradesBought = 0;

      for (let i = 0; i < multiplier; i++) {
        const upgradeKey = `${type}Upgrades`;
        const currentLevel =
          typeof state[upgradeKey] === "number" ? state[upgradeKey] : 0;
        const cost = UPGRADE_COSTS[type](currentLevel);

        if (state.coins < cost) break;

        state.coins -= cost;
        upgradesBought++;

        switch (type) {
          case "tapPower": {
            const level = state.tapPowerUpgrades + 1;
            const gain = 0.5 + level * 0.06;
            state.tapPower = Math.round((state.tapPower + gain) * 10) / 10;
            state.tapPowerUpgrades += 1;
            break;
          }
          case "autoTapper": {
            const level = state.autoTapperUpgrades + 1;
            const gain = 1 + level * 1.2;
            state.autoTapper = Math.round(state.autoTapper + gain);
            state.autoTapperUpgrades += 1;
            break;
          }
          case "critChance": {
            const current = state.critChance || 0;
            const level = state.critChanceUpgrades + 1;
            const startValue = 5;
            const maxLevel = 500;
            const maxValue = 100;
            const gainPerLevel = (maxValue - startValue) / maxLevel;
            const newCritChance = startValue + gainPerLevel * level;
            state.critChance = Math.min(
              Math.max(current, Math.round(newCritChance * 100) / 100),
              maxValue
            );
            state.critChanceUpgrades += 1;
            break;
          }
          case "tapSpeedBonus": {
            const level = state.tapSpeedBonusUpgrades + 1;
            const startValue = level === 1 ? 2 : 0;
            const gain = startValue + level * 0.1;
            state.tapSpeedBonus =
              Math.round((state.tapSpeedBonus + gain) * 10) / 10;
            state.tapSpeedBonusUpgrades += 1;
            break;
          }
          default:
            setNotification("Unknown upgrade type!");
            return;
        }
      }

      if (upgradesBought === 0) {
        setNotification("Not enough coins!");
        return;
      }

      setGameState(state);
      saveGame(state);
      localStorage.setItem("lastActiveTime", Date.now());
    },
    [gameState, saveGame, setNotification]
  );

  const showFloatingNumber = useCallback((text, color = "#8B5CF6") => {
    const number = document.createElement("div");
    number.className = "floating-number";
    number.style.position = "absolute";
    number.style.color = color;
    number.textContent = text;
    number.style.left = `${Math.random() * 80 + 10}%`;
    number.style.top = `${Math.random() * 80 + 10}%`;
    document.body.appendChild(number);
    setTimeout(() => number.remove(), 1000);
  }, []);

  const glassStyle = "backdrop-filter backdrop-blur-lg bg-opacity-30";
  const buttonGlow = "shadow-[0_0_15px_rgba(255,255,255,0.3)]";
  const upgradeButtonStyle = (canAfford) =>
    `w-full py-2 rounded-xl transition-all duration-200 ${
      canAfford
        ? "bg-gradient-to-r from-[#86efac] to-[#4ade80] text-white shadow-lg hover:shadow-xl hover:scale-102"
        : "bg-gray-200 text-gray-400"
    } ${glassStyle}`;

  const SEASONAL_THEMES = {
    0: {
      name: "Spring",
      icon: "fa-seedling",
      gradient: "from-[#6ee7b7] via-[#a7f3d0] to-[#34d399]",
      buttonGlow: "from-[#6ee7b7] to-[#34d399]",
      image:
        "https://ucarecdn.com/8e00635e-6a66-49bd-877e-f9e361135eb1/-/format/auto/", // replace with uploaded/generated image URL
    },
    1: {
      name: "Summer",
      icon: "fa-sun",
      gradient: "from-[#fde68a] via-[#fcd34d] to-[#fbbf24]",
      buttonGlow: "from-[#fde68a] to-[#fbbf24]",
      image:
        "https://ucarecdn.com/33ab523c-35ae-4807-9082-eaaac404ecf5/-/format/auto/", // replace with uploaded/generated image URL
    },
    2: {
      name: "Autumn",
      icon: "fa-cloud-moon",
      gradient: "from-[#fdba74] via-[#fb923c] to-[#f59e42]",
      buttonGlow: "from-[#fdba74] to-[#fb923c]",
      image:
        "https://ucarecdn.com/430507a6-5547-4346-bc38-3e511339feea/-/format/auto/", // replace with uploaded/generated image URL
    },
    3: {
      name: "Winter",
      icon: "fa-tree",
      gradient: "from-[#a5b4fc] via-[#818cf8] to-[#60a5fa]",
      buttonGlow: "from-[#a5b4fc] to-[#60a5fa]",
      image:
        "https://ucarecdn.com/947b8b5d-7c2a-41aa-a429-e54b6d0b50f1/-/format/auto/", // replace with uploaded/generated image URL
    },
  };

  const [leaderboardType, setLeaderboardType] = useState("renown");
  const [leaderboardData, setLeaderboardData] = useState({
    renown: [],
    coins: [],
  });

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!userId || !pin) return;

      try {
        const response = await fetch("/api/game-state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, pin, action: "getLeaderboard" }),
        });

        if (!response.ok) throw new Error("Failed to fetch leaderboard");

        const data = await response.json();
        if (data.error) throw new Error(data.error);

        setLeaderboardData({
          renown: data.renown || [],
          coins: data.coins || [],
        });
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      }
    };

    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 5000);
    return () => clearInterval(interval);
  }, [userId, pin]);

  const renderLeaderboard = () => (
    <div className={`${glassStyle} bg-white/20 rounded-2xl p-5 ${buttonGlow}`}>
      <h2 className="text-2xl font-crimson-text mb-4 text-center text-[#2d3748]">
        Leaderboard
      </h2>

      <div className="mb-4">
        <select
          value={leaderboardType}
          onChange={(e) => setLeaderboardType(e.target.value)}
          className="w-full px-4 py-2 rounded-xl bg-white/40 border border-white/30 text-[#2d3748]"
        >
          <option value="renown">Most Renown Tokens</option>
          <option value="coins">Most Coins Earned</option>
        </select>
      </div>

      <div className="space-y-2">
        {leaderboardData[leaderboardType].map((entry, index) => {
          const iconObj = PROFILE_ICONS.find(
            (ic) => ic.id === entry.profile_icon
          );

          // Rank string
          const rankStr = index === 0 ? "👑" : `#${index + 1}`;

          return (
            <div
              key={entry.user_id}
              className="flex justify-between items-center bg-white/10 rounded-lg p-3"
            >
              <div className="flex items-center">
                <span
                  className={`text-lg font-medium mr-2 ${
                    index === 0
                      ? "text-yellow-500"
                      : index === 1
                      ? "text-green-500"
                      : index === 2
                      ? "text-blue-500"
                      : "text-black"
                  }`}
                >
                  {rankStr}
                </span>
                {/* Profile icon between rank and name */}
                {iconObj ? (
                  iconObj.image ? (
                    <img
                      src={iconObj.image}
                      alt={iconObj.name}
                      className="w-8 h-8 rounded-full object-cover mr-2"
                      title={iconObj.name}
                    />
                  ) : (
                    <span className="text-2xl mr-2" title={iconObj.name}>
                      {iconObj.emoji}
                    </span>
                  )
                ) : (
                  <i className="fas fa-user-circle text-gray-400 text-2xl mr-2"></i>
                )}

                <span className="text-lg font-medium">
                  {entry.profile_name || "Player"} ({entry.user_id})
                </span>
              </div>
              <span className="font-medium text-[#2d3748]">
                {leaderboardType === "renown"
                  ? `${entry.renown_tokens} Renown`
                  : `${formatNumberShort(
                      Math.floor(entry.total_coins_earned)
                    )} coins`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
  const renderShopTab = () => {
    // Shop tabs
    const tabs = [
      {
        id: "themes",
        label: "Themes",
        color: "border-yellow-200 text-yellow-600 ring-yellow-400",
      },
      {
        id: "boosts",
        label: "Boosts",
        color: "border-red-200 text-red-500 ring-red-400",
      },
      {
        id: "profileIcons",
        label: "Profile Icons",
        color: "border-green-200 text-green-600 ring-green-400",
      },
      {
        id: "limited",
        label: "Limited",
        color: "border-blue-200 text-blue-500 ring-blue-400",
      },
    ];

    const limitedStock = gameState.limitedStock || {};

    const SHOP_THEMES = [
      {
        id: "seasons",
        name: "Seasons Cycle",
        emoji: "🔄",
        price: 0,
        currency: "renownTokens",
        isLimited: false,
      },
      {
        id: "heaven",
        name: "Heaven",
        emoji: CUSTOM_THEMES.heaven.icon,
        price: 20,
        currency: "renownTokens",
        isLimited: false,
      },
      {
        id: "maddoxtheme",
        name: "Maddox",
        emoji: CUSTOM_THEMES.maddoxtheme.icon,
        price: 250,
        currency: "renownTokens",
        isLimited: true,
        stock: limitedStock["maddoxtheme"] ?? 10,
      },
      {
        id: "hell",
        name: "Hell",
        emoji: CUSTOM_THEMES.hell.icon,
        price: 1000,
        currency: "renownTokens",
        isLimited: true,
        stock: limitedStock["hell"] ?? 5,
      },
      {
        id: "space",
        name: "Space",
        emoji: CUSTOM_THEMES.space.icon,
        price: 30,
        currency: "renownTokens",
        isLimited: false,
      },
      {
        id: "city_night",
        name: "City Night",
        emoji: CUSTOM_THEMES.city_night.icon,
        price: 250,
        currency: "renownTokens",
        isLimited: true,
        stock: limitedStock["city_night"] ?? 10,
      },
      {
        id: "midnight",
        name: "Midnight",
        emoji: CUSTOM_THEMES.midnight.icon,
        price: 28,
        currency: "renownTokens",
        isLimited: false,
      },
      {
        id: "island",
        name: "Island",
        emoji: CUSTOM_THEMES.island.icon,
        price: 24,
        currency: "renownTokens",
        isLimited: false,
      },
      {
        id: "barn",
        name: "Barn",
        emoji: CUSTOM_THEMES.barn.icon,
        price: 18,
        currency: "renownTokens",
        isLimited: false,
      },
      {
        id: "city",
        name: "City",
        emoji: CUSTOM_THEMES.city.icon,
        price: 20,
        currency: "renownTokens",
        isLimited: false,
      },
    ];

    const ownedIcons = gameState.ownedProfileIcons || [];
    const equippedIcon = gameState.profileIcon || null;
    const ownedThemes = gameState.ownedThemes || ["seasons"];
    const equippedTheme = gameState.equippedTheme || "seasons";
    const ownedBoosts = gameState.ownedBoosts || [];
    const canAfford = (price) => (gameState.renownTokens || 0) >= price;

    // --- SHOP VIEW LOGIC ---
    let tabContent = null;

    // Themes
    if (shopView === "themes") {
      const normalThemes = SHOP_THEMES.filter((t) => !t.isLimited);
      tabContent = (
        <div>
          <h3 className="text-xl font-bold mb-4 text-[#e11d48]">Themes</h3>
          <div className="grid grid-cols-1 gap-4">
            {normalThemes.map((theme) => {
              const owned = ownedThemes.includes(theme.id);
              const equipped = equippedTheme === theme.id;
              const afford = canAfford(theme.price);
              return (
                <div
                  key={theme.id}
                  className="flex items-center justify-between bg-white/60 border border-gray-200 rounded-xl p-4"
                >
                  <div className="flex items-center space-x-4">
                    <span className="text-3xl">{theme.emoji}</span>
                    <div>
                      <div className="font-semibold text-lg">{theme.name}</div>
                      <div className="text-sm text-gray-500">
                        {theme.price} ⭐
                      </div>
                    </div>
                  </div>
                  <div>
                    {!owned ? (
                      <button
                        className={`px-3 py-1 rounded font-semibold ${
                          afford
                            ? "bg-green-600 text-white hover:bg-green-700"
                            : "bg-red-600 text-white opacity-60 cursor-not-allowed"
                        }`}
                        disabled={!afford}
                        onClick={() => handleBuyTheme(theme)}
                      >
                        Buy
                      </button>
                    ) : equipped ? (
                      <span className="px-3 py-1 rounded bg-green-500 text-white font-semibold">
                        Equipped
                      </span>
                    ) : (
                      <button
                        className="px-3 py-1 rounded bg-blue-400 text-white font-semibold"
                        onClick={() => handleEquipTheme(theme)}
                      >
                        Equip
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    // Boosts
    else if (shopView === "boosts") {
      const normalBoosts = BOOSTS.filter((b) => !b.isLimited);
      tabContent = (
        <div>
          <h3 className="text-xl font-bold mb-4 text-[#e11d48]">Boosts</h3>
          <div className="grid grid-cols-1 gap-4">
            {normalBoosts.length === 0 && (
              <div className="text-center text-gray-400 py-10">
                Keep your eyes peeled!
              </div>
            )}
            {normalBoosts.map((boost) => {
              const owned = ownedBoosts.includes(boost.id);
              const alreadyActive = activeShopBoosts.some(
                (b) => b.id === boost.id
              );
              const afford = canAfford(boost.price);
              return (
                <div
                  key={boost.id}
                  className="flex items-center justify-between bg-white/60 border border-gray-200 rounded-xl p-4"
                >
                  <div>
                    <div className="font-semibold text-lg">{boost.name}</div>
                    <div className="text-sm text-gray-500">
                      {boost.price} ⭐
                    </div>
                  </div>
                  <div>
                    {/* Only normal boosts, NO unequip for these */}
                    <button
                      className={`px-3 py-1 rounded font-semibold ${
                        afford && !alreadyActive
                          ? "bg-green-600 text-white hover:bg-green-700"
                          : "bg-red-600 text-white opacity-60 cursor-not-allowed"
                      }`}
                      disabled={!afford || alreadyActive}
                      onClick={() => {
                        if (!afford) {
                          setNotification("Not enough Renown Tokens!");
                          return;
                        }
                        setGameState((prev) => ({
                          ...prev,
                          renownTokens: prev.renownTokens - boost.price,
                        }));
                        equipShopBoost(boost);
                      }}
                    >
                      {alreadyActive ? "Active" : "Buy"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    // Profile Icons
    else if (shopView === "profileIcons") {
      const normalIcons = PROFILE_ICONS.filter((i) => !i.isLimited);
      tabContent = (
        <div>
          <h3 className="text-xl font-bold mb-4 text-[#e11d48]">
            Profile Icons
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {normalIcons.length === 0 && (
              <div className="text-center text-gray-400 py-10">
                Keep your eyes peeled!
              </div>
            )}
            {normalIcons.map((icon) => {
              const owned = ownedIcons.includes(icon.id);
              const equipped = equippedIcon === icon.id;
              const afford = canAfford(icon.price);
              return (
                <div
                  key={icon.id}
                  className="flex items-center justify-between bg-white/60 border border-gray-200 rounded-xl p-4"
                >
                  <div className="flex items-center space-x-4">
                    <span className="text-3xl">{icon.emoji}</span>
                    <div>
                      <div className="text-sm text-gray-500">
                        {icon.price} ⭐
                      </div>
                    </div>
                  </div>
                  <div>
                    {!owned ? (
                      <button
                        className={`px-3 py-1 rounded font-semibold ${
                          afford
                            ? "bg-green-600 text-white hover:bg-green-700"
                            : "bg-red-600 text-white opacity-60 cursor-not-allowed"
                        }`}
                        disabled={!afford}
                        onClick={() => handleBuyIcon(icon)}
                      >
                        Buy
                      </button>
                    ) : equipped ? (
                      <span className="px-3 py-1 rounded bg-green-500 text-white font-semibold">
                        Equipped
                      </span>
                    ) : (
                      <button
                        className="px-3 py-1 rounded bg-blue-400 text-white font-semibold"
                        onClick={() => handleEquipIcon(icon)}
                      >
                        Equip
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    // Limited (EDITED: Boosts can now be unequipped/equipped)
    else if (shopView === "limited") {
      const limitedIcons = PROFILE_ICONS.filter((i) => i.isLimited);
      const limitedThemes = SHOP_THEMES.filter((t) => t.isLimited);
      const limitedBoosts = BOOSTS.filter((b) => b.isLimited);

      tabContent = (
        <div className="flex flex-col space-y-8">
          {/* Limited Profile Icons */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-[#3b82f6]">
              Limited Profile Icons
            </h3>
            {limitedIcons.length === 0 ? (
              <div className="text-center text-gray-400 py-10">
                No limited profile icons yet.
              </div>
            ) : (
              limitedIcons.map((icon) => {
                const owned = ownedIcons.includes(icon.id);
                const equipped = equippedIcon === icon.id;
                const afford = canAfford(icon.price);
                const stock = limitedStock[icon.id] ?? 0;
                const outOfStock = stock <= 0;
                const isImageIcon = !!icon.image;

                return (
                  <div
                    key={icon.id}
                    className="flex items-center justify-between bg-yellow-100 border border-yellow-400 rounded-xl p-4 mb-3"
                  >
                    <div className="flex items-center space-x-4">
                      {/* Emoji or Image */}
                      {isImageIcon ? (
                        <img
                          src={icon.image}
                          alt=""
                          className="w-12 h-12 rounded-full object-cover border border-gray-300"
                        />
                      ) : (
                        <span className="text-3xl">{icon.emoji}</span>
                      )}

                      <div>
                        <div className="text-sm text-gray-500">
                          {icon.price} ⭐
                        </div>
                        {outOfStock && (
                          <div className="text-xs text-red-600 font-bold">
                            Out of Stock
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      {!owned ? (
                        <button
                          className={`px-3 py-1 rounded font-semibold ${
                            afford && !outOfStock
                              ? "bg-green-600 text-white hover:bg-green-700"
                              : "bg-red-600 text-white opacity-60 cursor-not-allowed"
                          }`}
                          disabled={!afford || outOfStock}
                          onClick={() =>
                            buyLimitedItem({
                              itemId: icon.id,
                              itemType: "profileIcon",
                              price: icon.price,
                            })
                          }
                        >
                          {outOfStock ? "Out of Stock" : "Buy"}
                        </button>
                      ) : equipped ? (
                        <span className="px-3 py-1 rounded bg-green-500 text-white font-semibold">
                          Equipped
                        </span>
                      ) : (
                        <button
                          className="px-3 py-1 rounded bg-blue-400 text-white font-semibold"
                          onClick={() => handleEquipIcon(icon)}
                        >
                          Equip
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Limited Themes */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-[#eab308]">
              Limited Themes
            </h3>
            {limitedThemes.length === 0 ? (
              <div className="text-center text-gray-400 py-10">
                No limited themes yet.
              </div>
            ) : (
              limitedThemes.map((theme) => {
                const owned = ownedThemes.includes(theme.id);
                const equipped = equippedTheme === theme.id;
                const afford = canAfford(theme.price);
                const stock = limitedStock[theme.id] ?? 0;
                const outOfStock = stock <= 0;
                return (
                  <div
                    key={theme.id}
                    className="flex items-center justify-between bg-yellow-100 border border-yellow-400 rounded-xl p-4 mb-3"
                  >
                    <div className="flex items-center space-x-4">
                      <span className="text-3xl">{theme.emoji}</span>
                      <div>
                        <div className="font-semibold text-lg">
                          {theme.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {theme.price > 0
                            ? `Price: ${theme.price} ⭐`
                            : "Free"}
                        </div>
                        {outOfStock && (
                          <div className="text-xs text-red-600 font-bold">
                            Out of Stock
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      {!owned ? (
                        <button
                          className={`px-3 py-1 rounded font-semibold ${
                            afford && !outOfStock
                              ? "bg-green-600 text-white hover:bg-green-700"
                              : "bg-red-600 text-white opacity-60 cursor-not-allowed"
                          }`}
                          disabled={!afford || outOfStock}
                          onClick={() =>
                            buyLimitedItem({
                              itemId: theme.id,
                              itemType: "theme",
                              price: theme.price,
                            })
                          }
                        >
                          {outOfStock ? "Out of Stock" : "Buy"}
                        </button>
                      ) : equipped ? (
                        <span className="px-3 py-1 rounded bg-green-500 text-white font-semibold">
                          Equipped
                        </span>
                      ) : (
                        <button
                          className="px-3 py-1 rounded bg-blue-400 text-white font-semibold"
                          onClick={() => handleEquipTheme(theme)}
                        >
                          Equip
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Limited Boosts (EDITED - allow equip/unequip) */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-[#dc2626]">
              Limited Boosts
            </h3>
            {limitedBoosts.length === 0 ? (
              <div className="text-center text-gray-400 py-10">
                No limited boosts yet.
              </div>
            ) : (
              limitedBoosts.map((boost) => {
                const afford = canAfford(boost.price);
                const stock = limitedStock[boost.id] ?? 0;
                const outOfStock = stock <= 0;
                const alreadyActive = activeShopBoosts.some(
                  (b) => b.id === boost.id
                );
                const owned = ownedBoosts.includes(boost.id);
                return (
                  <div
                    key={boost.id}
                    className="flex items-center justify-between bg-yellow-100 border border-yellow-400 rounded-xl p-4 mb-3"
                  >
                    <div>
                      <div className="font-semibold text-lg">{boost.name}</div>
                      <div className="text-sm text-gray-500">
                        {boost.price} ⭐
                      </div>
                      {outOfStock && (
                        <div className="text-xs text-red-600 font-bold">
                          Out of Stock
                        </div>
                      )}
                    </div>
                    <div>
                      {!owned ? (
                        <button
                          className={`px-3 py-1 rounded font-semibold ${
                            afford && !outOfStock
                              ? "bg-green-600 text-white hover:bg-green-700"
                              : "bg-red-600 text-white opacity-60 cursor-not-allowed"
                          }`}
                          disabled={!afford || outOfStock}
                          onClick={() => {
                            if (!afford) {
                              setNotification("Not enough Renown Tokens!");
                              return;
                            }
                            if (outOfStock) {
                              setNotification("Out of Stock!");
                              return;
                            }
                            setGameState((prev) => ({
                              ...prev,
                              renownTokens: prev.renownTokens - boost.price,
                            }));
                            equipShopBoost(boost);
                          }}
                        >
                          {outOfStock ? "Out of Stock" : "Buy"}
                        </button>
                      ) : alreadyActive ? (
                        <button
                          className="px-3 py-1 rounded bg-gray-500 text-white font-semibold"
                          onClick={() => {
                            unequipShopBoost(boost.id);
                          }}
                        >
                          Unequip
                        </button>
                      ) : (
                        <button
                          className="px-3 py-1 rounded bg-blue-400 text-white font-semibold"
                          onClick={() => {
                            equipShopBoost(boost);
                          }}
                        >
                          Equip
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      );
    }
    // Inventory
    else if (shopView === "inventory") {
      tabContent = (
        <div>
          <h3 className="text-xl font-bold mb-4 text-[#eab308]">Inventory</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Themes */}
            <div>
              <h4 className="font-semibold mb-2 text-blue-500">Themes</h4>
              <div className="space-y-2">
                {(ownedThemes || []).length === 0 && (
                  <div className="text-gray-400 text-sm">No themes owned.</div>
                )}
                {(ownedThemes || []).map((themeId) => {
                  const theme = [
                    ...SHOP_THEMES,
                    ...Object.entries(CUSTOM_THEMES).map(([id, t]) => ({
                      ...t,
                      id,
                    })),
                  ].find((t) => t.id === themeId);
                  if (!theme) return null;
                  const isEquipped = equippedTheme === theme.id;
                  return (
                    <div
                      key={theme.id}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer border
                      ${
                        theme.isLimited
                          ? "border-yellow-400 bg-yellow-100"
                          : "border-gray-200 bg-white"
                      }
                      ${isEquipped ? "ring-2 ring-green-400" : ""}
                    `}
                      onClick={() => {
                        setGameState((prev) => ({
                          ...prev,
                          equippedTheme: isEquipped ? "seasons" : theme.id,
                        }));
                        setNotification(
                          isEquipped
                            ? "Theme unequipped!"
                            : `Equipped theme: ${theme.name}`
                        );
                      }}
                      title={theme.name}
                    >
                      <span className="text-2xl mr-2">
                        {theme.emoji || "🎨"}
                      </span>
                      <span className="font-medium">
                        {theme.name || theme.id}
                      </span>
                      {theme.isLimited && (
                        <span className="text-yellow-500 font-bold ml-2">
                          ★
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Profile Icons */}
            <div>
              <h4 className="font-semibold mb-2 text-green-500">
                Profile Icons
              </h4>
              <div className="space-y-2">
                {(ownedIcons || []).length === 0 && (
                  <div className="text-gray-400 text-sm">No icons owned.</div>
                )}
                {(ownedIcons || []).map((iconId) => {
                  const icon = PROFILE_ICONS.find((i) => i.id === iconId);
                  if (!icon) return null;
                  const isEquipped = equippedIcon === icon.id;
                  return (
                    <div
                      key={icon.id}
                      className={`flex items-center rounded-lg px-3 py-2 cursor-pointer border w-full min-w-0
        ${
          icon.isLimited
            ? "border-yellow-400 bg-yellow-100"
            : "border-gray-200 bg-white"
        }
        ${isEquipped ? "ring-2 ring-green-400" : ""}
      `}
                      onClick={() => {
                        setGameState((prev) => ({
                          ...prev,
                          profileIcon: isEquipped ? null : icon.id,
                        }));
                        setNotification(
                          isEquipped
                            ? "Icon unequipped!"
                            : `Equipped icon: ${icon.name}`
                        );
                      }}
                      title={icon.name}
                    >
                      <span className="text-2xl mr-2">{icon.emoji}</span>
                      {icon.isLimited && (
                        <span className="text-yellow-500 font-bold ml-2">
                          ★
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      );
    }
    // Empty fallback
    else {
      tabContent = (
        <div className="text-center text-gray-400 py-10">
          Keep your eyes peeled!
        </div>
      );
    }

    // ---- MAIN SHOP RETURN ----
    return (
      <div className="max-w-md mx-auto mt-6">
        {/* Weather */}
        <div className="flex flex-col items-center justify-center mb-4">
          <div className="text-lg font-bold mb-1">
            Weather:{" "}
            {typeof gameState.currentWeather === "string"
              ? gameState.currentWeather
              : "Clear"}
          </div>
          <div className="text-sm text-red-500 mb-3">{weatherDescription}</div>
        </div>

        {/* Show active boost if present */}
        <div className="flex flex-wrap gap-2 mb-4">
          {activeShopBoosts.map((b) => (
            <div
              key={b.id}
              className="px-3 py-1 rounded-xl bg-gradient-to-br from-purple-400/80 to-purple-700/80 text-white font-semibold shadow text-sm flex items-center"
              style={{ minWidth: "110px" }}
            >
              <span className="mr-2">{b.name}</span>
              {b.expires && (
                <span className="ml-auto text-yellow-200 font-bold">
                  {Math.max(0, Math.floor((b.expires - Date.now()) / 60000))}m
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Stats Row */}
        <div className="flex justify-center gap-4 mb-6">
          <div
            className={`${glassStyle} bg-white/80 rounded-2xl p-4 border border-gray-200 flex flex-col items-center w-36`}
          >
            <span className="text-3xl">🪙</span>
            <span className="text-lg font-semibold mt-1 text-yellow-600">
              {formatNumberShort(Math.floor(gameState.coins))}
            </span>
            <span className="text-xs text-yellow-600 mt-1">Coins</span>
          </div>
          <div
            className={`${glassStyle} bg-white/80 rounded-2xl p-4 border border-gray-200 flex flex-col items-center w-36`}
          >
            <span className="text-3xl">⭐</span>
            <span className="text-lg font-semibold mt-1 text-[#e11d48]">
              {Math.floor(gameState.renownTokens)}
            </span>
            <span className="text-xs text-[#e11d48] mt-1">Renown Tokens</span>
          </div>
        </div>
        {/* Main Shop Box */}
        <div className={`${glassStyle} bg-white/80 rounded-2xl p-6 relative`}>
          {/* Backpack Button */}
          <button
            onClick={() => setShopView("inventory")}
            className="absolute right-4 top-4 p-2 rounded-full bg-white/30 border border-white/30 shadow-md backdrop-blur-lg hover:scale-110 transition z-20"
            style={{ fontSize: 26 }}
          >
            🎒
          </button>
          <h2 className="text-2xl font-bold text-[#e11d48] mb-6">Shop</h2>
          {/* Tabs (glassy style) */}
          <div className="flex justify-center space-x-3 mb-6 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300">
            {tabs.map((t) => (
              <button
                key={t.id}
                className={`
                px-5 py-2 rounded-xl font-semibold shadow border bg-white/20
                backdrop-blur-lg
                ${t.color}
                ${
                  shopView === t.id
                    ? "ring-2 ring-offset-2 " + t.color.split(" ")[2]
                    : "hover:bg-white/30"
                }
                transition
              `}
                onClick={() => setShopView(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
          {/* Tab Content */}
          <div
            className="overflow-y-auto"
            style={{
              height: "50vh", // <---- force fixed height
              paddingRight: "2px",
            }}
          >
            {tabContent}
          </div>
        </div>
      </div>
    );
  };

  const renderProfileTab = () => {
    // Find the icon object for the currently equipped icon
    const equippedIconObj =
      PROFILE_ICONS.find((ic) => ic.id === gameState.profileIcon) || null;

    return (
      <div
        className={`${glassStyle} bg-white/20 rounded-2xl p-6 ${buttonGlow} space-y-6`}
      >
        <h2 className="text-2xl font-crimson-text text-center text-[#2d3748]">
          Profile
        </h2>

        <div className="flex flex-col items-center">
          {/* Profile Icon */}
          {equippedIconObj ? (
            equippedIconObj.image ? (
              <img
                src={equippedIconObj.image}
                alt={equippedIconObj.name}
                className="w-20 h-20 rounded-full object-cover mb-2"
                title={equippedIconObj.name}
              />
            ) : (
              <span className="text-[5rem] mb-2" title={equippedIconObj.name}>
                {equippedIconObj.emoji}
              </span>
            )
          ) : (
            <i className="fas fa-user-circle text-gray-400 text-[5rem] mb-2"></i>
          )}

          {/* Editable Name */}
          <div className="w-full max-w-xs">
            <label className="block text-gray-600 font-medium mb-1">Name</label>
            <input
              type="text"
              value={gameState.profileName}
              onChange={(e) =>
                setGameState((prev) => ({
                  ...prev,
                  profileName: e.target.value,
                }))
              }
              maxLength={20}
              className="w-full px-4 py-2 rounded-xl border border-white/30 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-300 text-[#2d3748]"
            />
          </div>

          {/* Save button and Change Pin + Hard Reset buttons */}
          <div className="flex flex-col items-center space-y-4 mt-4">
            {/* Save button */}
            <button
              onClick={() => {
                saveGame({ ...gameState });
                setNotification("Profile saved!");
              }}
              className="w-full max-w-xs px-6 py-2 rounded-lg bg-gradient-to-r from-green-400 to-green-500 text-white font-semibold shadow hover:shadow-lg transition"
            >
              Save
            </button>

            {/* Change Pin and Hard Reset side by side */}
            <div className="flex w-full max-w-xs gap-4">
              <button
                onClick={() => {
                  setPinErrorMessage("");
                  setPinSuccessMessage("");
                  setCurrentPinInput("");
                  setNewPinInput("");
                  setConfirmPinInput("");
                  setShowChangePinModal(true);
                }}
                className="flex-1 px-6 py-2 rounded-lg bg-purple-500 text-white font-semibold shadow hover:bg-purple-400 transition"
              >
                Change Pin
              </button>

              <button
                onClick={() => setShowHardResetModal(true)}
                className="flex-1 px-6 py-2 rounded-lg bg-red-500 text-white font-bold shadow hover:bg-red-400 transition"
              >
                HARD RESET
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderResetTab = () => {
    const tokensToEarn = getTokensFromCoins(gameState.coinsEarnedThisRun || 0);
    const canReset = tokensToEarn > 0;
    const currentMultiplier = gameState.permanentMultiplier || 1;
    const newMultiplier = currentMultiplier + tokensToEarn * 0.05;

    return (
      <div className="space-y-6 p-4">
        {/* Title */}
        <div className="text-center text-lg text-[#4a5568] mb-6">
          Reset your progress to gain Renown Tokens!
        </div>

        {/* Current Renown Tokens */}
        <p className="text-center text-md font-semibold text-[#2d3748]">
          <strong>Current Renown Tokens:</strong>{" "}
          <span className="text-green-600">{gameState.renownTokens || 0}</span>
        </p>

        {/* Explanation */}
        <p className="text-center text-sm text-[#4a5568] max-w-md mx-auto">
          You earn <strong>1 Token per 5,000,000 Coins Earned</strong>.
          <br />
          Each Token boosts your income by <strong>2%</strong>.
        </p>

        {/* Tokens you will earn if reset now */}
        <p className="text-center text-lg font-semibold text-[#2d3748] my-4">
          You will earn:{" "}
          <span className="text-green-600">
            {tokensToEarn} Renown Token{tokensToEarn !== 1 ? "s" : ""}
          </span>
        </p>

        {/* Reset button or warning */}
        {!canReset && (
          <p className="text-center text-red-600 mb-4">
            You need more progress to earn Renown Tokens. Keep playing!
          </p>
        )}

        <button
          onClick={handleReset}
          disabled={!canReset}
          className={`w-full py-3 rounded-xl text-white font-medium shadow-lg transition-all duration-200 transform hover:scale-[1.02] ${
            canReset
              ? "bg-gradient-to-r from-[#60a5fa] to-[#3b82f6] hover:shadow-xl"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          {canReset ? "Reset Progress" : "Earn more Renown Tokens to Reset"}
        </button>

        {/* Show current multiplier */}
        <div className="text-center text-[#4a5568] mt-4">
          <strong>Your current multiplier:</strong>{" "}
          {currentMultiplier.toFixed(2)}x
        </div>

        {/* Show new multiplier after reset */}
        {canReset && (
          <div className="text-center text-[#4a5568] mt-1">
            <strong>Your new multiplier:</strong> {newMultiplier.toFixed(2)}x
          </div>
        )}
      </div>
    );
  };

  const renderHouseTab = () => {
    // Calculate upgrade cost and progress
    const nextUpgradeCost = Math.floor(
      1000 * Math.pow(1.5, gameState.houseLevel - 1)
    );
    const canAfford = gameState.coins >= nextUpgradeCost;
    const progress = Math.min((gameState.coins / nextUpgradeCost) * 100, 100);

    return (
      <div className={`${glassStyle} bg-white rounded-2xl p-5 ${buttonGlow}`}>
        <div className="my-6 flex flex-col items-center">
          {bonusCooldown === 0 ? (
            <button
              onClick={claimDailyBonus}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold shadow hover:shadow-xl transition"
            >
              🎁 Claim Daily Bonus!
            </button>
          ) : (
            <span className="text-sm text-gray-400">
              Next bonus in {Math.ceil(bonusCooldown / 1000 / 60 / 60)} hours
            </span>
          )}
        </div>
        <div className={`${glassStyle} bg-white rounded-2xl p-5 ${buttonGlow}`}>
          <div className="relative mb-4">
            <h2 className="text-xl font-semibold text-center text-[#2d3748]">
              {gameState.houseName || "My Cozy Home"}
            </h2>
            <button
              onClick={() => {
                setNewHouseName(gameState.houseName || "");
                setShowHouseRenameModal(true);
              }}
              aria-label="Rename house"
              className="absolute right-0 top-1/2 transform -translate-y-1/2 flex items-center justify-center w-8 h-8 bg-red-200 rounded-md hover:bg-red-300 transition-colors"
            >
              <i className="fas fa-edit text-red-700"></i>
            </button>
          </div>
          <div className="space-y-4 mb-4">
            <div className="bg-white/20 rounded-xl p-4 text-center">
              <h3 className="text-lg font-bold text-[#2d3748]">Level</h3>
              <p className="text-xl text-[#2d3748]">{gameState.houseLevel}</p>
            </div>
            <div className="bg-white/20 rounded-xl p-4 text-center">
              <h3 className="text-lg font-bold text-[#2d3748]">
                Coin Multiplier
              </h3>
              <p className="text-xl text-[#2d3748]">
                {(gameState.houseCoinsMultiplier * 100).toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="mb-4">
            <div className="w-full bg-gray-300 rounded-full h-4 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#10B981] to-[#059669] transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-center text-sm text-[#4a5568] mt-1">
              {Math.floor(gameState.coins).toLocaleString()} /{" "}
              {nextUpgradeCost.toLocaleString()} coins
            </p>
          </div>
          <div className="flex justify-center w-full mt-4">
            <button
              onClick={async () => {
                if (!canAfford) return;

                setGameState((prev) => {
                  const updatedState = {
                    ...prev,
                    coins: prev.coins - nextUpgradeCost,
                    houseLevel: prev.houseLevel + 1,
                    houseCoinsMultiplier: 1.0 + prev.houseLevel * 0.1,
                  };
                  // Save game immediately after state update
                  saveGame(updatedState);
                  return updatedState;
                });

                setNotification("House Upgraded!");
              }}
              disabled={!canAfford}
              className={`
    w-full
    max-w-xs
    py-4
    rounded-2xl
    font-bold
    text-lg
    flex
    items-center
    justify-center
    gap-2
    transition-all
    duration-300
    ${
      canAfford
        ? "bg-gradient-to-r from-[#10B981] to-[#059669] text-white shadow-lg hover:shadow-xl hover:scale-105"
        : "bg-gray-300 text-gray-400 cursor-not-allowed"
    }
  `}
              style={{
                boxSizing: "border-box",
                minWidth: 0,
                width: "100%",
              }}
            >
              <i
                className="fas fa-coins"
                style={{
                  fontSize: "1.2em",
                  marginRight: "0.6em",
                  position: "relative",
                  top: "0.06em",
                  display: "inline-block",
                  verticalAlign: "middle",
                }}
                aria-hidden="true"
              />
              <span
                style={{ verticalAlign: "middle", display: "inline-block" }}
              >
                {canAfford
                  ? "Upgrade House (Ready!)"
                  : `Upgrade House (${formatNumberShort(
                      nextUpgradeCost
                    )} coins)`}
              </span>
            </button>
          </div>
          {/* Referral/Gift Code Box */}
          <div className="mt-6 mb-4 p-4 bg-purple-50 rounded-xl shadow-md flex flex-col items-center w-full max-w-xs mx-auto overflow-hidden">
            <div className="text-lg font-bold text-purple-700 mb-2">
              Enter Gift/Referral Code
            </div>
            <div className="flex w-full gap-2">
              <input
                type="text"
                value={referralInput}
                onChange={(e) => setReferralInput(e.target.value)}
                className="flex-1 w-0 px-3 py-2 rounded-xl border border-purple-300 text-[#2d3748] focus:ring-2 focus:ring-[#a78bfa]"
                placeholder="Enter code"
                maxLength={32}
                disabled={referralUsed}
              />
              <button
                className="flex-shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-[#a78bfa] to-[#7c3aed] text-white font-semibold disabled:opacity-50"
                onClick={handleReferralSubmit}
                disabled={!referralInput || referralUsed}
              >
                Confirm
              </button>
            </div>
            {referralMessage && (
              <div
                className={`mt-2 text-center ${
                  referralMessageType === "success"
                    ? "text-green-600"
                    : "text-red-500"
                }`}
              >
                {referralMessage}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderHouseRenameModal = () => (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center z-50"
      style={{ alignItems: "flex-start", paddingTop: "6rem" }}
    >
      <div
        className={`${glassStyle} bg-white/30 rounded-2xl p-6 max-w-sm mx-4 border border-white/30`}
      >
        <h3 className="text-xl font-medium text-[#2d3748] mb-4">
          Rename Your House
        </h3>

        <div className="space-y-4">
          <div>
            <input
              type="text"
              value={newHouseName}
              onChange={(e) => {
                setNewHouseName(e.target.value);
                setHouseNameError("");
              }}
              placeholder="Enter house name"
              maxLength={30}
              className="w-full px-4 py-2 rounded-xl bg-white/40 border border-white/30 text-[#2d3748] placeholder-[#4a5568]/50 focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
            {houseNameError && (
              <p className="text-red-500 text-sm mt-1">{houseNameError}</p>
            )}
          </div>

          <div className="flex justify-end space-x-4">
            <button
              onClick={() => {
                setShowHouseRenameModal(false);
                setNewHouseName("");
                setHouseNameError("");
              }}
              className="px-4 py-2 rounded-lg text-[#4a5568] hover:bg-white/20 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleHouseRename}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#c4b5fd] to-[#a78bfa] text-white shadow-md hover:shadow-lg transition-all duration-200"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const handleHouseRename = () => {
    if (!newHouseName.trim()) {
      setHouseNameError("Please enter a name");
      return;
    }
    if (newHouseName.length > 30) {
      setHouseNameError("Name too long (max 30 characters)");
      return;
    }

    setGameState((prev) => ({
      ...prev,
      houseName: newHouseName.trim(),
    }));
    setShowHouseRenameModal(false);
    setNewHouseName("");
    setHouseNameError("");
    setNotification("House renamed successfully!");
  };

  function claimDailyBonus() {
    if (!canClaimDailyBonus(lastDailyClaim)) {
      setNotification("Daily bonus not available yet!");
      return;
    }

    const bonus = pickRandomBonus(dailyBonuses);
    setPendingBonus(bonus);

    // Apply bonus effect
    setGameState((prev) => {
      let newState = { ...prev };

      if (bonus.type === "upgrade") {
        const upgradeKey = bonus.upgradeType;
        newState[upgradeKey] = (newState[upgradeKey] || 0) + bonus.amount;
        newState[`${upgradeKey}Upgrades`] =
          (newState[`${upgradeKey}Upgrades`] || 0) + bonus.amount;
      } else if (bonus.type === "coins") {
        const extra = Math.floor(newState.coins * bonus.percent);
        newState.coins += extra;
        newState.totalCoinsEarned += extra;
      } else if (bonus.type === "houseLevel") {
        newState.houseLevel = (newState.houseLevel || 1) + bonus.amount;
      } else if (bonus.type === "multiplier") {
        newState.tempMultiplier = {
          percent: bonus.percent,
          expires: Date.now() + bonus.durationHours * 3600 * 1000,
        };
      }
      return newState;
    });

    // Store claim time
    const now = Date.now();
    localStorage.setItem("lastDailyClaim", String(now));
    setLastDailyClaim(now);

    // Save to backend if you want to track on server
    fetch("/api/game-state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        pin,
        action: "saveDailyClaim",
        lastDailyClaim: now, // <--- IMPORTANT: store this value in DB!
      }),
    });

    setShowBonusModal(true);
  }
  return (
    <div
      className={`relative min-h-screen transition-colors duration-1000 pb-24
    ${gameState.currentWeather === "Sun" ? "sun-bright" : ""}
    ${gameState.currentWeather === "Windy" ? "windy-shake" : ""}
  `}
      style={
        gameState.equippedTheme &&
        gameState.equippedTheme !== "seasons" &&
        CUSTOM_THEMES[gameState.equippedTheme]?.image
          ? {
              backgroundImage: `url(${
                CUSTOM_THEMES[gameState.equippedTheme].image
              })`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }
          : SEASONAL_THEMES[gameState.currentSeason]?.image
          ? {
              backgroundImage: `url(${
                SEASONAL_THEMES[gameState.currentSeason].image
              })`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }
          : {
              background: "linear-gradient(to bottom, #fff, #eee)",
            }
      }
    >
      {gameState.equippedTheme === "heaven" && (
        <>
          <CloudBackground />
          <HeavenEffects />
        </>
      )}
      {gameState.equippedTheme === "hell" && <HellEffects />}
      {gameState.equippedTheme === "space" && <SpaceEffects />}

      {(gameState.currentWeather === "Rain" ||
        (gameState.currentWeather === "Windy" &&
          gameState.currentWeather === "Sleet") ||
        gameState.currentWeather === "Thunder" ||
        gameState.currentWeather === "Lightning") && <RainParticles />}
      {(gameState.currentWeather === "Snow" ||
        gameState.currentWeather === "Sleet") && <SnowParticles />}
      {gameState.currentWeather === "Hail" && <HailParticles />}
      {gameState.currentWeather === "Foggy" && <FoggyOverlay />}
      {gameState.currentWeather === "Cloudy" && <CloudyOverlay />}

      {notification && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-2xl z-50 font-medium text-center">
          {notification}
        </div>
      )}

      {showFeedback && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex justify-center"
          style={{ alignItems: "flex-start", paddingTop: "6rem" }}
        >
          <div
            className={`
  bg-gradient-to-br from-purple-400/50 via-purple-200/40 to-purple-600/60
  backdrop-blur-xl rounded-2xl p-7 max-w-sm w-full border border-white/30 shadow-lg relative
`}
            style={{
              boxShadow: "0 8px 32px 0 rgba(124,58,237,0.18)",
              background:
                "linear-gradient(135deg, rgba(192,132,252,0.95), rgba(139,92,246,0.75), rgba(59,7,100,0.7))",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
            }}
          >
            <h2 className="text-xl font-bold mb-4 text-[#2d3748]">
              Send Feedback
            </h2>
            {feedbackSent ? (
              <div className="text-center text-green-600 mb-4">
                Thank you for your feedback!
              </div>
            ) : (
              <>
                <textarea
                  className="w-full min-h-[80px] rounded-lg border border-white/40 bg-white/30 p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-300 transition backdrop-blur-lg"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Write your feedback here..."
                />
                <div className="flex justify-end gap-2">
                  <button
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#e9d5ff]/70 to-[#c4b5fd]/70 text-[#7c3aed] font-semibold shadow-lg backdrop-blur-lg hover:scale-105 transition border border-white/30"
                    onClick={() => setShowFeedback(false)}
                    style={{ boxShadow: "0 2px 8px 0 rgba(124,58,237,0.08)" }}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#c4b5fd]/90 to-[#a78bfa]/90 text-white font-bold shadow-lg hover:scale-105 transition border border-white/30 backdrop-blur-lg"
                    disabled={feedbackText.trim().length < 5}
                    onClick={async () => {
                      if (feedbackText.trim().length < 5) {
                        setNotification(
                          "Feedback must be at least 5 characters long"
                        );
                        return;
                      }

                      try {
                        const response = await fetch("/api/submit-feedback", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            userId: Number(userId),
                            feedback: feedbackText.trim(),
                          }),
                        });

                        const data = await response.json();
                        console.log("Feedback response:", data); // For debugging

                        if (data.success) {
                          setFeedbackSent(true);
                          setNotification("Thank you for your feedback!");
                          setTimeout(() => {
                            setShowFeedback(false);
                            setFeedbackSent(false);
                            setFeedbackText("");
                          }, 1500);
                        } else {
                          throw new Error(
                            data.error || "Failed to submit feedback"
                          );
                        }
                      } catch (error) {
                        console.error("Error submitting feedback:", error);
                        setNotification(
                          error.message ||
                            "Failed to submit feedback. Please try again."
                        );
                      }
                    }}
                    style={{
                      background:
                        "linear-gradient(90deg, #c4b5fdcc 0%, #a78bfacc 100%)",
                      boxShadow: "0 2px 8px 0 rgba(124,58,237,0.12)",
                    }}
                  >
                    Submit
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="container mx-auto px-2 sm:px-4 py-2 space-y-6">
        {/* Top row: logo left, buttons right */}
        <div className="flex justify-between items-end h-20 pl-0 pr-2 sm:px-4">
          {/* Logo + made by andysocial */}
          <div className="flex flex-col justify-center items-start">
            <img
              src="https://ucarecdn.com/7bdd361d-c411-41ce-b066-c1d20f88e3a7/-/format/auto/"
              alt="Tap Tap Two Logo"
              className="h-14 object-contain"
              style={{ marginLeft: 0 }}
            />
            <span className="text-xs text-gray-400 font-medium tracking-wide mt-1 ml-1">
              made by andysocial
            </span>
          </div>
          {/* Buttons: Maddox Promo, Reset, Noticeboard, Leaderboard, Dropdown */}
          <div className="flex items-center space-x-2 h-full">
            {/* Maddox Promo Button */}
            <button
              onClick={() => setShowMaddoxModal(true)}
              className="relative flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-br from-[#1e293b] to-[#dc2626] shadow-xl hover:scale-110 transition-all border-2 border-[#dc2626]"
              aria-label="Maddox Promo"
              style={{ marginRight: "8px" }}
            >
              <img
                src="https://ucarecdn.com/7eaeaf25-2192-4082-a415-dd52f360d379/-/format/auto/"
                alt="Maddox Logo"
                className="w-7 h-7 rounded-full object-contain"
              />
              {/* Red exclamation mark */}
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center border-2 border-white shadow">
                <span
                  className="text-xs font-bold text-white"
                  style={{ lineHeight: "1" }}
                >
                  !
                </span>
              </span>
            </button>

            {/* Reset Button */}
            <button
              onClick={() => setShowResetModal(true)}
              className={`${glassStyle} ${buttonGlow} px-4 py-2 rounded-xl text-[#4a5568] hover:text-[#2d3748] transition duration-200 relative`}
              aria-label="Reset progress"
            >
              <i className="fas fa-sync-alt"></i>
              <span
                className="absolute top-0 right-0 flex items-center justify-center rounded-full text-white font-bold"
                style={{
                  fontSize: "0.75rem",
                  padding: "0 6px",
                  minWidth: "24px",
                  height: "20px",
                  lineHeight: "20px",
                  textAlign: "center",
                  userSelect: "none",
                  backgroundColor: "#4f46e5", // Indigo-600 badge color
                  transform: "translate(50%, -50%)",
                  zIndex: 20,
                }}
              >
                {getTokensFromCoins(gameState.coinsEarnedThisRun || 0)}
              </span>
            </button>

            {/* Noticeboard Button */}
            <a
              href="/notice-board"
              className="relative block px-4 py-2 text-[#4a5568] hover:bg-gray-100"
            >
              <i className="fas fa-bullhorn"></i>
              {/* Notification Dot */}
              <span
                className="absolute top-2 right-2 block w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"
                style={{
                  pointerEvents: "none",
                  boxShadow: "0 0 0 1px #fff",
                }}
              ></span>
            </a>

            {/* Leaderboard Button */}
            <button
              onClick={() => setActiveTab("leaderboard")}
              className={`${glassStyle} ${buttonGlow} px-4 py-2 rounded-xl text-[#4a5568] hover:text-[#2d3748] transition duration-200`}
            >
              <i className="fas fa-trophy"></i>
            </button>

            {/* Dropdown menu */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown((prev) => !prev)}
                className={`${glassStyle} ${buttonGlow} px-4 py-2 rounded-xl text-[#4a5568] hover:text-[#2d3748] transition duration-200`}
                aria-label="Open menu"
              >
                <i className="fas fa-bars"></i>
              </button>

              {showDropdown && (
                <div
                  className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 box-border"
                  onClick={() => setShowDropdown(false)}
                >
                  {/* Dropdown items */}
                  <a
                    href="/help"
                    className="block px-4 py-2 text-[#4a5568] hover:bg-gray-100"
                  >
                    <i className="fas fa-question mr-2"></i> Help
                  </a>

                  <button
                    onClick={() => setShowFeedback(true)}
                    className="w-full text-left px-4 py-2 text-[#4a5568] hover:bg-gray-100"
                  >
                    <i className="fas fa-comment-alt mr-2"></i> Feedback
                  </button>
                  <button
                    onClick={() => setActiveTab("profile")}
                    className="w-full text-left px-4 py-2 text-[#4a5568] hover:bg-gray-100"
                  >
                    <i className="fas fa-user mr-2"></i> Profile
                  </button>
                  <button
                    onClick={() => {
                      localStorage.removeItem("userId");
                      localStorage.removeItem("pin");
                      window.location.href = "/login";
                    }}
                    className="w-full text-left px-4 py-2 text-[#4a5568] hover:bg-gray-100"
                  >
                    <i className="fas fa-sign-out-alt mr-2"></i> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {["game", "house", "leaderboard"].includes(activeTab) && (
          <div className="text-center">
            <h2 className="text-2xl mb-4 font-crimson-text text-[#4a5568]">
              {gameState.equippedTheme && gameState.equippedTheme !== "seasons"
                ? CUSTOM_THEMES[gameState.equippedTheme]?.name ||
                  gameState.equippedTheme.charAt(0).toUpperCase() +
                    gameState.equippedTheme.slice(1)
                : SEASONS[
                    Number.isInteger(gameState.currentSeason) &&
                    gameState.currentSeason >= 0 &&
                    gameState.currentSeason < SEASONS.length
                      ? gameState.currentSeason
                      : 0
                  ]}
            </h2>

            <div className="flex flex-col md:flex-row md:items-center md:justify-center gap-2 text-[#4a5568] text-lg mb-6">
              <div>
                <span className="font-semibold">Year:</span>{" "}
                {Number.isFinite(gameState.currentYear)
                  ? 2000 + gameState.currentYear
                  : "2000"}
              </div>
              <div>
                <span className="font-semibold">Weather:</span>{" "}
                {CUSTOM_THEME_WEATHER_RENAMES[gameState.equippedTheme]?.[
                  gameState.currentWeather
                ] ||
                  gameState.currentWeather ||
                  "Clear"}
              </div>
            </div>

            <div className="text-[#4a5568] text-sm mt-2">
              {weatherDescription}
            </div>

            <div
              className="grid grid-cols-3 max-w-xs mx-auto mt-6 mb-12"
              style={{ gap: "5px" }}
            >
              {[
                { icon: "🪙", value: Math.floor(gameState.coins) },
                { icon: "👆", value: gameState.totalTaps },
                { icon: "🔄", value: gameState.resets },
                { icon: "🏠", value: gameState.houseLevel },
                { icon: "⭐", value: Math.floor(gameState.renownTokens) },
                { icon: "✴️", value: gameState.permanentMultiplier.toFixed(2) },
              ].map(({ icon, value }, idx) => (
                <div
                  key={idx}
                  className={`${glassStyle} bg-gray-300/30 rounded-xl p-1.5 text-center border border-gray-400/50 backdrop-blur-md shadow-md`}
                  style={{ transformOrigin: "center" }}
                >
                  <span className="text-2xl select-none">{icon}</span>
                  <p className="text-md font-semibold mt-1">
                    {formatNumberShort(value)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="max-w-md mx-auto">
          {activeTab === "game" ? (
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="relative">
                <button
                  onClick={handleTap}
                  className={`w-[200px] h-[200px] rounded-full ${glassStyle} bg-white/30 ${buttonGlow} transform active:scale-95 transition-all duration-200 relative overflow-hidden hover:shadow-2xl border border-white/30 group`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-white/30 opacity-50 group-hover:opacity-75 transition-opacity duration-200"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className={`w-32 h-32 bg-gradient-to-r ${
                        gameState.equippedTheme &&
                        gameState.equippedTheme !== "seasons"
                          ? CUSTOM_THEMES[gameState.equippedTheme]?.buttonGlow
                          : SEASONAL_THEMES[gameState.currentSeason].buttonGlow
                      } rounded-full animate-pulse opacity-50`}
                    ></div>
                  </div>
                  {gameState.equippedTheme &&
                  gameState.equippedTheme !== "seasons" ? (
                    <span className="text-6xl relative z-10 select-none">
                      {CUSTOM_THEMES[gameState.equippedTheme]?.icon || "❓"}
                    </span>
                  ) : (
                    <i
                      className={`fas ${
                        SEASONAL_THEMES[gameState.currentSeason].icon
                      } text-6xl relative z-10 ${
                        gameState.currentSeason === 0
                          ? "text-green-400"
                          : gameState.currentSeason === 1
                          ? "text-yellow-400"
                          : gameState.currentSeason === 2
                          ? "text-orange-400"
                          : "text-blue-400"
                      } transition-colors duration-500 group-hover:scale-110 transform`}
                    />
                  )}
                </button>

                {hasBoost && (
                  <div className="absolute -top-2 -right-2 bg-pink-400 text-white rounded-full px-2 py-1 text-xs">
                    {Math.floor(boostTimeLeft / 60)}:
                    {(boostTimeLeft % 60).toString().padStart(2, "0")}
                  </div>
                )}
              </div>

              {!hasBoost && currentQuest && (
                <div
                  className={`${glassStyle} bg-white/20 rounded-xl p-4 mb-4 text-center shadow`}
                >
                  <h2 className="text-xl text-[#2d3748] mb-2">
                    <span role="img" aria-label="gift">
                      🎁
                    </span>{" "}
                    Quest
                  </h2>
                  <div className="text-[#4a5568] mb-3">
                    {currentQuest.description}
                  </div>

                  <div className="flex items-center justify-center gap-2 mb-3">
                    {/* Progress Bar */}
                    <div className="flex-1">
                      {(() => {
                        const questTemplate = QUEST_TEMPLATES.find(
                          (q) => q.id === currentQuest.id
                        );
                        let progress = 0;
                        if (
                          questTemplate &&
                          currentQuest.targetAmount !== undefined
                        ) {
                          if (questTemplate.id === "combined_level") {
                            const combined =
                              (gameState.tapPowerUpgrades || 0) +
                              (gameState.autoTapperUpgrades || 0) +
                              (gameState.critChanceUpgrades || 0) +
                              (gameState.tapSpeedBonusUpgrades || 0);
                            progress = Math.min(
                              ((combined - currentQuest.startCombined) /
                                currentQuest.targetAmount) *
                                100,
                              100
                            );
                          } else if (questTemplate.id === "earn_coins") {
                            const earned =
                              gameState.totalCoinsEarned -
                              currentQuest.startCoins;
                            progress = Math.min(
                              (earned / currentQuest.targetAmount) * 100,
                              100
                            );
                          } else if (questTemplate.id === "upgrade_house") {
                            // *** FIX: Handle house quest progress correctly ***
                            const upgradesDone =
                              gameState.houseLevel - currentQuest.startLevel;
                            progress = Math.max(
                              Math.min(
                                (upgradesDone / currentQuest.targetAmount) *
                                  100,
                                100
                              ),
                              0
                            );
                          } else if (currentQuest.startLevel !== undefined) {
                            // For upgrade quests (tapPower, autoTapper, critChance, tapSpeedBonus)
                            let level = 0;
                            if (questTemplate.id === "upgrade_tap_power") {
                              level = gameState.tapPowerUpgrades || 0;
                            } else if (
                              questTemplate.id === "upgrade_auto_tapper"
                            ) {
                              level = gameState.autoTapperUpgrades || 0;
                            } else if (
                              questTemplate.id === "upgrade_crit_chance"
                            ) {
                              level = gameState.critChanceUpgrades || 0;
                            } else if (
                              questTemplate.id === "upgrade_tap_speed"
                            ) {
                              // Try both camelCase and snake_case
                              level =
                                gameState.tapSpeedBonusUpgrades ||
                                gameState.tap_speed_bonus_upgrades ||
                                0;
                            }

                            progress = Math.min(
                              ((level - currentQuest.startLevel) /
                                currentQuest.targetAmount) *
                                100,
                              100
                            );
                          }
                        }

                        progress = Math.max(progress, 0);

                        return (
                          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden relative">
                            <div
                              className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        );
                      })()}
                    </div>
                    {/* Sync/Refresh Button */}
                    <button
                      onClick={() => {
                        const newQuest = generateQuest(gameState);
                        setCurrentQuest(newQuest);
                        setCanClaimQuest(false);
                        localStorage.setItem(
                          "currentQuest",
                          JSON.stringify(newQuest)
                        );
                        saveGame({
                          ...gameState,
                          currentQuest: newQuest,
                          canClaimQuest: false,
                        });
                        setNotification("Quest refreshed!");
                      }}
                      aria-label="Refresh Quest"
                      title="Refresh Quest"
                      className="ml-2 flex items-center justify-center bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-full p-2 transition duration-150 shadow"
                      style={{
                        fontSize: "1.25rem",
                        width: "32px",
                        height: "32px",
                        minWidth: "32px",
                        minHeight: "32px",
                      }}
                    >
                      <i className="fas fa-sync-alt text-gray-400"></i>
                    </button>
                  </div>

                  {/* Claim button only if complete */}
                  {canClaimQuest && (
                    <button
                      onClick={claimQuestReward}
                      className="px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-green-500 to-green-600 text-white shadow hover:shadow-xl transition-all duration-200"
                    >
                      Claim 10x Boost!
                    </button>
                  )}
                </div>
              )}

              <div
                className={`w-full ${glassStyle} bg-white/20 rounded-2xl p-5 ${buttonGlow}`}
              >
                <h2 className="text-2xl font-crimson-text mb-4 text-center text-[#2d3748]">
                  Upgrades
                </h2>
                <div className="text-center text-sm text-gray-500 font-semibold mb-4">
                  Combined Upgrade Level: {combinedLevel}
                </div>
                <div className="flex gap-2 mb-4">
                  {[1, 10, 100, "Max"].map((val) => (
                    <button
                      key={val}
                      onClick={() =>
                        setUpgradeMultiplier(val === "Max" ? "Max" : val)
                      }
                      className={`px-3 py-1 rounded font-bold
        ${
          upgradeMultiplier === val
            ? "bg-[#059669] text-white"
            : "bg-gray-200 text-gray-700"
        }
        hover:bg-[#34d399] transition`}
                    >
                      x{val}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {Object.entries(UPGRADE_COSTS).map(([type, costFn]) => {
                    const upgradeLevel = gameState[`${type}Upgrades`] || 0;
                    let multiplier =
                      upgradeMultiplier === "Max"
                        ? getMaxAffordableUpgrades(
                            type,
                            upgradeLevel,
                            gameState.coins
                          )
                        : upgradeMultiplier;

                    const totalCost = getTotalUpgradeCost(
                      type,
                      upgradeLevel,
                      multiplier
                    );
                    const canAfford = gameState.coins >= totalCost;
                    const currentValueRaw = gameState[type] || 0;

                    // Round tapSpeedBonus and others to 1 decimal place (except critChance)
                    const roundedValue =
                      type === "critChance"
                        ? currentValueRaw
                        : Math.round(currentValueRaw * 10) / 10;

                    // Format with shortening
                    const currentValueShort = formatNumberShort(roundedValue);

                    // Append % only for critChance
                    const currentValueFormatted =
                      type === "critChance"
                        ? `${currentValueShort}%`
                        : currentValueShort;

                    return (
                      <div
                        key={type}
                        className={`${glassStyle} bg-white/10 rounded-xl p-4 border border-white/30`}
                      >
                        <div className="flex flex-col space-y-2">
                          <div className="flex justify-between items-center">
                            <h3 className="font-medium text-lg text-[#2d3748] flex items-center relative">
                              {type === "tapPower"
                                ? "Tap Power"
                                : type === "autoTapper"
                                ? "Auto Tapper"
                                : type === "critChance"
                                ? "Critical Chance"
                                : "Tap Speed Bonus"}

                              <button
                                onMouseEnter={() => setTooltipVisibleFor(type)}
                                onMouseLeave={() => setTooltipVisibleFor(null)}
                                onFocus={() => setTooltipVisibleFor(type)}
                                onBlur={() => setTooltipVisibleFor(null)}
                                onClick={() =>
                                  setTooltipVisibleFor((prev) =>
                                    prev === type ? null : type
                                  )
                                }
                                aria-label={`Info about ${type}`}
                                className="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                style={{ fontSize: "0.8rem" }}
                              >
                                <i className="fas fa-info-circle" />
                              </button>
                              {tooltipVisibleFor === type && (
                                <Tooltip text={UPGRADE_DESCRIPTIONS[type]} />
                              )}
                            </h3>
                            <span className="text-sm text-[#4a5568] font-semibold">
                              Level {upgradeLevel + 1}
                            </span>
                          </div>
                          <p className="text-sm text-[#4a5568]">
                            Current: {currentValueFormatted}
                          </p>
                          {/* UPGRADE BUTTON */}
                          <button
                            onClick={() => handleUpgrade(type, multiplier)}
                            disabled={!canAfford}
                            className={upgradeButtonStyle(canAfford)}
                          >
                            {`Buy${
                              multiplier > 1 ? ` x${multiplier}` : ""
                            } (${formatNumberShort(totalCost)})`}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : activeTab === "leaderboard" ? (
            renderLeaderboard()
          ) : activeTab === "house" ? (
            renderHouseTab()
          ) : activeTab === "shop" ? (
            renderShopTab()
          ) : activeTab === "profile" ? (
            renderProfileTab()
          ) : null}
        </div>
      </div>

      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2">
        <div
          className={`${glassStyle} bg-white/20 rounded-2xl ${buttonGlow} p-2`}
        >
          <div className="flex space-x-4">
            {/* Game Tab Button */}
            <button
              onClick={() => setActiveTab("game")}
              className={`px-6 py-3 rounded-xl transition-all duration-200 ${
                activeTab === "game"
                  ? "bg-white/40 text-[#2d3748] shadow-md"
                  : "text-[#4a5568] hover:bg-white/20"
              }`}
            >
              <i className="fas fa-gamepad"></i>
              <span className="block text-xs mt-1">Game</span>
            </button>

            {/* House Tab Button */}
            <button
              onClick={() => setActiveTab("house")}
              className={`px-6 py-3 rounded-xl transition-all duration-200 ${
                activeTab === "house"
                  ? "bg-white/40 text-[#2d3748] shadow-md"
                  : "text-[#4a5568] hover:bg-white/20"
              }`}
            >
              <i className="fas fa-home"></i>
              <span className="block text-xs mt-1">House</span>
            </button>

            <button
              onClick={() => setActiveTab("shop")}
              className={`px-6 py-3 rounded-xl transition-all duration-200 ${
                activeTab === "shop"
                  ? "bg-white/40 text-[#e11d48] shadow-md"
                  : "text-[#e11d48] hover:bg-white/20"
              } flex flex-col items-center justify-center`}
            >
              <i className="fas fa-store"></i>
              <span className="block text-xs mt-1">Shop</span>
            </button>
          </div>
        </div>
      </div>

      {showResetModal && renderResetModal()}
      {showHouseRenameModal && renderHouseRenameModal()}
      {pendingOfflineEarnings && (
        <div
          className="fixed inset-0 bg-black/50 flex justify-center z-50"
          style={{ alignItems: "flex-start", paddingTop: "6rem" }}
        >
          <div
            className="
    bg-gradient-to-br from-purple-400/50 via-purple-200/40 to-purple-600/60
    backdrop-blur-xl rounded-2xl p-7 max-w-sm w-full border border-white/30 shadow-lg relative
  "
            style={{
              background:
                "linear-gradient(135deg, rgba(192,132,252,0.95), rgba(139,92,246,0.75), rgba(59,7,100,0.7))",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              boxShadow: "0 8px 32px 0 rgba(124,58,237,0.18)",
            }}
          >
            <h3 className="text-xl font-medium text-[#2d3748] mb-4">
              Offline Earnings!
            </h3>
            <p className="mb-4 text-lg text-[#4a5568] text-center">
              You were offline for{" "}
              {formatDuration(pendingOfflineEarnings.seconds)}.
              <br />
              You earned{" "}
              <span className="font-bold text-green-600">
                {formatNumberShort(Math.floor(pendingOfflineEarnings.coins))}
              </span>{" "}
              coins!
            </p>

            <button
              onClick={() => {
                const newState = {
                  ...gameState,
                  coins: gameState.coins + pendingOfflineEarnings.coins,
                  totalCoinsEarned:
                    gameState.totalCoinsEarned + pendingOfflineEarnings.coins,
                };
                setGameState(newState);
                setPendingOfflineEarnings(null);
                saveGame(newState);
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 mb-3"
            >
              Claim
            </button>

            <button
              onClick={() => {
                openDoubleEarningsModal();
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-500 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Double Earnings! (Sacrifice)
            </button>
          </div>
        </div>
      )}

      {showHardResetModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div
            className="
    bg-gradient-to-br from-purple-400/50 via-purple-200/40 to-purple-600/60
    backdrop-blur-xl rounded-2xl p-7 max-w-sm w-full border border-white/30 shadow-lg relative
  "
            style={{
              background:
                "linear-gradient(135deg, rgba(192,132,252,0.95), rgba(139,92,246,0.75), rgba(59,7,100,0.7))",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              boxShadow: "0 8px 32px 0 rgba(124,58,237,0.18)",
            }}
          >
            <h2 className="text-xl font-semibold text-white mb-4 text-center">
              ARE YOU SURE?
            </h2>
            <p className="text-white text-center mb-6 font-semibold">
              THIS IS PERMANENT AND CANNOT BE UNDONE.
            </p>

            {hardResetError && (
              <div className="text-red-400 mb-4 text-center">
                {hardResetError}
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={() => {
                  setShowHardResetModal(false);
                  setHardResetError("");
                }}
                className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white transition flex-1 mr-2"
                disabled={hardResetLoading}
              >
                Cancel
              </button>

              <button
                onClick={async () => {
                  setHardResetError("");
                  setHardResetLoading(true);
                  try {
                    const res = await fetch("/api/game-state", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        action: "hardReset",
                        userId,
                        pin,
                      }),
                    });
                    const data = await res.json();

                    if (data.success) {
                      // Clear local data and redirect to login or reload
                      localStorage.clear();
                      window.location.href = "/login";
                    } else {
                      setHardResetError(data.error || "Failed to hard reset.");
                      setHardResetLoading(false);
                    }
                  } catch (err) {
                    setHardResetError("Error during hard reset, try again.");
                    setHardResetLoading(false);
                  }
                }}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition flex-1 ml-2"
                disabled={hardResetLoading}
              >
                {hardResetLoading ? "Resetting..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showChangePinModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div
            className="
    bg-gradient-to-br from-purple-400/50 via-purple-200/40 to-purple-600/60
    backdrop-blur-xl rounded-2xl p-7 max-w-sm w-full border border-white/30 shadow-lg relative
  "
            style={{
              background:
                "linear-gradient(135deg, rgba(192,132,252,0.95), rgba(139,92,246,0.75), rgba(59,7,100,0.7))",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              boxShadow: "0 8px 32px 0 rgba(124,58,237,0.18)",
            }}
          >
            <h2 className="text-xl font-semibold text-white mb-4">
              Change Pin
            </h2>

            <input
              type="password"
              placeholder="Current Pin"
              value={currentPinInput}
              onChange={(e) => setCurrentPinInput(e.target.value)}
              className="w-full mb-3 px-4 py-2 rounded-xl border border-purple-500 bg-purple-200/30 text-white placeholder-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <input
              type="password"
              placeholder="New Pin"
              value={newPinInput}
              onChange={(e) => setNewPinInput(e.target.value)}
              className="w-full mb-3 px-4 py-2 rounded-xl border border-purple-500 bg-purple-200/30 text-white placeholder-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <input
              type="password"
              placeholder="Confirm New Pin"
              value={confirmPinInput}
              onChange={(e) => setConfirmPinInput(e.target.value)}
              className="w-full mb-4 px-4 py-2 rounded-xl border border-purple-500 bg-purple-200/30 text-white placeholder-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />

            {pinErrorMessage && (
              <div className="text-red-300 mb-2 text-sm">{pinErrorMessage}</div>
            )}
            {pinSuccessMessage && (
              <div className="text-green-300 mb-2 text-sm">
                {pinSuccessMessage}
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={() => setShowChangePinModal(false)}
                className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white transition"
              >
                Cancel
              </button>

              <button
                onClick={async () => {
                  setPinErrorMessage("");
                  setPinSuccessMessage("");

                  if (!currentPinInput || !newPinInput || !confirmPinInput) {
                    setPinErrorMessage("Please fill all fields.");
                    return;
                  }

                  if (newPinInput !== confirmPinInput) {
                    setPinErrorMessage("New pins do not match.");
                    return;
                  }

                  if (newPinInput.length < 4) {
                    setPinErrorMessage(
                      "New pin must be at least 4 characters."
                    );
                    return;
                  }

                  try {
                    const res = await fetch("/api/game-state", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        action: "changePin",
                        userId,
                        pin: currentPinInput,
                        newPin: newPinInput,
                      }),
                    });
                    const data = await res.json();

                    if (data.success) {
                      setPinSuccessMessage("Pin changed successfully!");
                      setPin(newPinInput); // Update local pin state to NEW pin
                      localStorage.setItem("pin", newPinInput); // Save to localStorage
                      setTimeout(() => {
                        setShowChangePinModal(false);
                        setCurrentPinInput("");
                        setNewPinInput("");
                        setConfirmPinInput("");
                        setPinErrorMessage("");
                        setPinSuccessMessage("");
                      }, 1200);
                    } else {
                      setPinErrorMessage(
                        data.error || "Incorrect current pin."
                      );
                    }
                  } catch (err) {
                    setPinErrorMessage("Error changing pin, try again.");
                  }
                }}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      {showDoubleEarningsModal && renderDoubleEarningsModal()}

      {showBonusModal && pendingBonus && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex justify-center"
          style={{ alignItems: "flex-start", paddingTop: "6rem" }}
        >
          <div
            className="bg-gradient-to-br from-red-400/60 via-white/10 to-red-700/70
      backdrop-blur-2xl rounded-2xl p-8 shadow-2xl border border-white/20 flex flex-col items-center max-w-xs w-full"
            style={{
              background:
                "linear-gradient(135deg,rgba(252,165,165,0.95),rgba(255,255,255,0.2),rgba(239,68,68,0.85))",
              boxShadow: "0 8px 32px 0 rgba(239,68,68,0.15)",
            }}
          >
            <h2 className="text-2xl mb-2 font-bold text-white drop-shadow">
              Daily Bonus!
            </h2>
            <p className="text-lg mb-4 text-white/90">{pendingBonus.label}</p>
            <button
              onClick={() => setShowBonusModal(false)}
              className="mt-2 px-5 py-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold shadow hover:shadow-xl transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
      {showMaddoxModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 pb-3 flex flex-col items-center border-2 border-[#dc2626]">
            <button
              onClick={() => setShowMaddoxModal(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-2xl font-bold"
              aria-label="Close"
              style={{ background: "none", border: "none" }}
            >
              ×
            </button>
            <img
              src="https://ucarecdn.com/7eaeaf25-2192-4082-a415-dd52f360d379/-/format/auto/"
              alt="Maddox Logo"
              className="w-16 h-16 rounded-full mb-3"
            />
            <h2 className="text-xl font-bold mb-1 text-[#dc2626]">
              Announcement!
            </h2>
            <p className="mb-3 text-center text-[#1e293b] font-medium">
              We’ve partnered with{" "}
              <span className="font-bold text-[#dc2626]">Maddox</span>!<br />
              <span className="text-sm text-[#4b5563]">
                Check out his channel, support the collab, and claim your bonus!
              </span>
            </p>
            <a
              href="https://www.youtube.com/channel/UCVXk-ixAOlk9we-5yFfKN9g"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#dc2626] text-white text-center font-semibold rounded-xl py-2 px-3 mb-2 hover:bg-[#991b1b] transition"
            >
              Maddox on YouTube
            </a>
            <div className="bg-gray-100 rounded-lg py-2 px-3 text-center mb-2">
              <span className="text-[#1e293b] font-bold">
                Use code{" "}
                <span className="bg-yellow-200 px-2 py-1 rounded text-[#eab308]">
                  maddox
                </span>{" "}
                in the <b>House</b> tab!
              </span>
            </div>
            <span className="text-xs text-[#6b7280] text-center block mt-2">
              Exclusive rewards for a limited time only!
            </span>
          </div>
        </div>
      )}

      {showWeatherFlash && (
        <div
          style={{
            background:
              SEASON_FLASH_DARK_COLOURS[gameState.currentSeason] ||
              "rgba(0,0,0,0.35)",
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 200,
            pointerEvents: "none",
            transition: "opacity 0.15s",
            opacity: 0.12,
            mixBlendMode: "multiply",
          }}
        />
      )}

      <style jsx global>{`
        @keyframes floatUp {
          0% {
            transform: translateY(0);
            opacity: 1;
          }
          100% {
            transform: translateY(-50px);
            opacity: 0;
          }
        }

@keyframes cloudMistDrift0 {
  0% { transform: translateX(0); }
  100% { transform: translateX(30vw); }
}
@keyframes cloudMistDrift1 {
  0% { transform: translateX(0); }
  100% { transform: translateX(-28vw); }
}
@keyframes cloudMistDrift2 {
  0% { transform: translateX(0); }
  100% { transform: translateX(19vw); }
}
@keyframes cloudMistDrift3 {
  0% { transform: translateX(0); }
  100% { transform: translateX(-21vw); }
}


        .floating-number {
          animation: floatUp 1s ease-out;
          pointer-events: none;
          font-weight: bold;
          font-size: 1.2em;
          text-shadow: 0 2px 4px rgba(139, 92, 246, 0.3);
        }

        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }


@keyframes lightningFlash {
  0%, 85%, 100% {
    opacity: 0;
  }
  10% {
    opacity: 0.8;
  }
  13% {
    opacity: 0;
  }
}
.thunder-flicker {
  animation: lightningFlash 3s steps(1, end) infinite;
}

        .sun-bright {
          filter: brightness(1.15);
        }


        @keyframes windShake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-5px);
          }
          50% {
            transform: translateX(5px);
          }
          75% {
            transform: translateX(-5px);
          }
        }

        .windy-shake {
          animation: windShake 2s ease-in-out infinite;
        }

        .rain-particle {
          position: absolute;
          width: 2px;
          height: 10px;
          background: #4a90e2;
          opacity: 0.6;
          animation-name: fall;
          animation-timing-function: linear;
          animation-fill-mode: forwards;
          animation-iteration-count: 1;
        }

.snow-particle {
  position: fixed; /* fixed so it moves smoothly across screen */
  top: -10px;
  width: 6px;
  height: 6px;
  background: white;
  border-radius: 50%;
  opacity: 0.7;
  animation-name: snowFall;
  animation-timing-function: linear;
  animation-iteration-count: 1;
  animation-fill-mode: forwards;
  pointer-events: none;
  z-index: 5;
  transform-origin: top center;
}

/* Snow falls down and drifts sideways */
@keyframes snowFall {
  0% {
    transform: translateX(0) translateY(0);
    opacity: 0.8;
  }
  100% {
    transform: translateX(var(--flake-drift)) translateY(100vh);
    opacity: 0;
  }
}




.hail-particle {
  position: absolute;
  top: -10px;
  width: 8px;
  height: 8px;
  background: #b0b0b0;
  border-radius: 50%;
  opacity: 0.8;
  animation-name: hailFall;
  animation-timing-function: linear;
  animation-iteration-count: 1;
  animation-fill-mode: forwards;
  pointer-events: none;
  z-index: 5;
  transform-origin: top center;
  --flake-drift: 0;
}

.cloudy-overlay {
  background: linear-gradient(
    120deg,
    rgba(230, 230, 230, 0.21) 0%,
    rgba(210, 210, 210, 0.25) 100%
  );
  backdrop-filter: blur(3px);
  opacity: 0.44;
  transition: opacity 0.5s;
  pointer-events: none;
}

.foggy-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 7;
  background: radial-gradient(ellipse at 60% 40%, rgba(240,240,240,0.35) 60%, rgba(210,210,210,0.18) 100%);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  opacity: 0.82;
  transition: opacity 0.7s;
  mix-blend-mode: lighten;
}

        }

        .rain-container,
        .snow-container,
       .hail-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  top: 0;
  left: 0;
  z-index: 5;
}


        @keyframes fall {
          0% {
            transform: translateY(-20px);
            opacity: 0.6;
          }
          100% {
            transform: translateY(100vh);
            opacity: 0;
          }
        }

       @keyframes cloudMove {
  0% {
    transform: translateX(-20px);
  }
  50% {
    transform: translateX(20px);
  }
  100% {
    transform: translateX(-20px);
  }
}

@keyframes cloudMoveSlow {
  0% {
    transform: translateX(10px);
  }
  50% {
    transform: translateX(-10px);
  }
  100% {
    transform: translateX(10px);
  }
}

.cloud {
  filter: drop-shadow(0 0 4px rgba(255 255 255 / 0.5));
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
}

.animate-cloudMove {
  animation-name: cloudMove;
  animation-duration: 12s;
}

.animate-cloudMoveSlow {
  animation-name: cloudMoveSlow;
  animation-duration: 18s;
}


        @keyframes snowFall {
          0% {
            transform: translateY(-10px);
            opacity: 0.8;
          }
          100% {
            transform: translateY(100vh);
            opacity: 0;
          }
        }

       @keyframes hailFall {
  0% {
    transform: translateX(0) translateY(0);
    opacity: 0.8;
  }
  100% {
    transform: translateX(var(--flake-drift)) translateY(100vh);
    opacity: 0;
  }
}
.hell-fire-bg {
  position: relative;
  background: linear-gradient(180deg, #300000 0%, #a10d0d 70%, #000 100%);
  width: 100%;
  min-height: 100vh;
  overflow-x: hidden;
  overflow-y: visible;
  box-sizing: border-box;
}

/* Add this for the vignette */
.hell-vignette {
  pointer-events: none;
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  z-index: 10;
  background: radial-gradient(ellipse at center, rgba(0,0,0,0) 57%, rgba(0,0,0,0.35) 100%);
}

.hell-ember {
  position: absolute;
  width: 5px;
  height: 5px;
  background: radial-gradient(circle at 40% 40%, #ffc166 55%, #fd5e13 100%);
  border-radius: 50%;
  opacity: 0.21;
  filter: blur(0.6px);
  animation: ember-rise 3.5s linear infinite;
  pointer-events: none;
  z-index: 1;
}

@keyframes ember-rise {
  from { opacity: 0.35; transform: translateY(0) scale(1); }
  85%  { opacity: 0.18; }
  to   { opacity: 0; transform: translateY(-110px) scale(1.25); }
}


@keyframes flicker {
  0%, 100% { transform: scale(1) translateY(0); opacity: 0.7; }
  50% { transform: scale(1.1) translateY(-10px); opacity: 1; }
}

.shooting-star {
  position: absolute;
  width: 2px;
  height: 80px;
  background: linear-gradient(90deg, #fff 40%, rgba(255,255,255,0) 100%);
  border-radius: 999px;
  opacity: 0.7;
  pointer-events: none;
  /* Start angled -45deg for diagonal */
  transform: rotate(-35deg);
  animation: shoot-diagonal 1.3s linear forwards;
}

@keyframes shoot-diagonal {
  0% {
    opacity: 0.9;
    transform: translate(0, 0) rotate(-35deg) scaleY(1) scaleX(1);
  }
  10% {
    opacity: 1;
  }
  80% {
    opacity: 1;
    transform: translate(160px, 140px) rotate(-35deg) scaleY(1.1) scaleX(1.2);
  }
  100% {
    opacity: 0;
    transform: translate(220px, 200px) rotate(-35deg) scaleY(1.18) scaleX(1.3);
  }
}


.planet {
  position: relative;
  border-radius: 50%;
  box-shadow: 0 0 12px 2px rgba(160, 174, 192, 0.8);
  background: radial-gradient(circle at 30% 30%, #a0aec0, #1e293b);
  transition: background 0.3s ease;
}

.planet-ring {
  position: absolute;
  top: 20%;
  left: -15%;
  width: 80px;
  height: 20px;
  border-radius: 50%;
  border: 3px solid rgba(100, 116, 139, 0.7);
  transform: rotate(25deg);
  box-shadow: 0 0 8px 0 rgba(100, 116, 139, 0.7);
  background: transparent;
  pointer-events: none;
}


      `}</style>
    </div>
  );
}

export default MainComponent;