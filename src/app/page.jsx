"use client";
import AdBanner from '../components/AdBanner';
import React, { useState, useEffect, useCallback, useMemo } from "react";
import useSound from "use-sound"; // 👈 add this line
import { supabase } from "@/utilities/supabaseClient";
import GuildChat from '@/components/GuildChat';
import { logPageview } from "@/utilities/logPageview";

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

const GUILD_ICONS = [
  { id: "tree", name: "Tree", emoji: "🌳" },
  { id: "seedling", name: "Seedling", emoji: "🌱" },
  { id: "cloudMoon", name: "Cloud Moon", emoji: "🌜" },
  { id: "sun", name: "Sun", emoji: "🌞" },
  { id: "star", name: "Star", emoji: "⭐" },
  { id: "alien", name: "Alien", emoji: "👽" },
  { id: "fire", name: "Fire", emoji: "🔥" },
  { id: "ghost", name: "Ghost", emoji: "👻" },
  { id: "cat", name: "Cat Face", emoji: "🐱" },
  { id: "unicorn", name: "Unicorn", emoji: "🦄" },
  { id: "robot", name: "Robot", emoji: "🤖" },
  { id: "crown", name: "Crown", emoji: "👑" },
  { id: "icecream", name: "Ice Cream", emoji: "🍦" },
  { id: "rocket", name: "Rocket", emoji: "🚀" },
  { id: "rainbow", name: "Rainbow", emoji: "🌈" },
  { id: "mouse", name: "Mouse", emoji: "🐭" },
  { id: "frog", name: "Frog", emoji: "🐸" },
  { id: "fox", name: "Fox", emoji: "🦊" },
  { id: "penguin", name: "Penguin", emoji: "🐧" },
  { id: "bunny", name: "Bunny", emoji: "🐰" },
  { id: "duck", name: "Duck", emoji: "🦆" },
  { id: "hamster", name: "Hamster", emoji: "🐹" },
  { id: "owl", name: "Owl", emoji: "🦉" },
  { id: "hedgehog", name: "Hedgehog", emoji: "🦔" },
  { id: "panda", name: "Panda", emoji: "🐼" },
  { id: "monkey", name: "Monkey", emoji: "🐵" },
  { id: "bee", name: "Bee", emoji: "🐝" },
  { id: "butterfly", name: "Butterfly", emoji: "🦋" },
  { id: "ladybug", name: "Ladybug", emoji: "🐞" },
  { id: "chick", name: "Chick", emoji: "🐤" },
  { id: "bear", name: "Bear", emoji: "🐻" },
  { id: "dolphin", name: "Dolphin", emoji: "🐬" },
  { id: "whale", name: "Whale", emoji: "🐳" },
  { id: "snail", name: "Snail", emoji: "🐌" },
  { id: "peach", name: "Peach", emoji: "🍑" },
  { id: "avocado", name: "Avocado", emoji: "🥑" },
  { id: "mushroom", name: "Mushroom", emoji: "🍄" },
  { id: "cherry", name: "Cherry", emoji: "🍒" },
  { id: "cookie", name: "Cookie", emoji: "🍪" },
  { id: "dragon", name: "Dragon", emoji: "🐲" },
  { id: "mermaid", name: "Mermaid", emoji: "🧜‍♀️" },
  { id: "wizard", name: "Wizard", emoji: "🧙‍♂️" },
  { id: "crystalball", name: "Crystal Ball", emoji: "🔮" },
  { id: "cactus", name: "Cactus", emoji: "🌵" },
  { id: "volcano", name: "Volcano", emoji: "🌋" },
  { id: "jellyfish", name: "Jellyfish", emoji: "🎐" },
  { id: "starstruck", name: "Starstruck", emoji: "🤩" },
  { id: "medal", name: "Gold Medal", emoji: "🏅" },
  { id: "lighthouse", name: "Lighthouse", emoji: "🗼" },
  { id: "moon", name: "Moon", emoji: "🌕" },
  { id: "comet", name: "Comet", emoji: "☄️" },
  { id: "snowflake", name: "Snowflake", emoji: "❄️" },
  { id: "maple", name: "Maple Leaf", emoji: "🍁" },
  { id: "eclipse", name: "Eclipse", emoji: "🌑" },
  { id: "mountain", name: "Mountain", emoji: "🏔️" },
  { id: "ninja", name: "Ninja", emoji: "🥷" },
  { id: "phoenix", name: "Phoenix", emoji: "🔥🕊️" },
  { id: "clover", name: "Four Leaf Clover", emoji: "🍀" },
  { id: "pirate", name: "Pirate", emoji: "🏴‍☠️" },
  { id: "vampire", name: "Vampire", emoji: "🧛‍♂️" },
  { id: "sakura", name: "Sakura", emoji: "🌸" },
  { id: "balloon", name: "Balloon", emoji: "🎈" },
  { id: "dragonfruit", name: "Dragon Fruit", emoji: "🐉🍈" },
];



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
  //{
  //  id: "autotapper_24h",
  //  name: "2x Auto Tapper (24h)",
  //  description:
  //    "Doubles your auto tapper output for 24 hours. Stackable, but cannot be active twice at once.",
  //  effect: "autoTapper",
  //  multiplier: 2,
  //  price: 200,
  //  duration: 24 * 60 * 60 * 1000, // 24 hours in ms
  //  isPermanent: false,
   // isLimited: false,
 // },
 // {
 //   id: "tappower_24h",
   // name: "2x Tap Power (24h)",
//    description:
  //    "Doubles your tap power output for 24 hours. Stackable, but cannot be active twice at once.",
    //effect: "tapPower",
//    multiplier: 2,
  //  price: 200,
    //duration: 24 * 60 * 60 * 1000, // 24 hours in ms
    //isPermanent: false,
//    isLimited: false,
  //},
 // {
   // id: "renown_24h",
//    name: "2x Renown (24h)",
  //  description:
    //  "Doubles Renown for 24h. Can be stacked with Tap Power and Auto Tapper",
   // effect: "renownTokens",
 //   multiplier: 2,
//    price: 250,
 //   duration: 24 * 60 * 60 * 1000, // 24 hours in ms
   // isPermanent: false,
 //   isLimited: true,
//  },
//  {
 //   id: "tappower_p",
   // name: "2x Tap Power (permanent)",
 //   description:
   //   "Doubles your Tap Power output permanently. Cannot be stacked with 24h Boosts. Disables upon enabling a 24h Boost.",
//    effect: "tapPowerPerm",
  //  multiplier: 2,
    //price: 200,
//    duration: null,
  //  isPermanent: true,
    //isLimited: true,
// },
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

  // --- New themes below ---
  pogoda_day: {
    id: "pogoda_day",
    name: "Pogoda (Day)",
    icon: "🌤️",
    background: "linear-gradient(to bottom, #f0e68c, #aee1f9)",
    image:
      "https://ucarecdn.com/48f12801-c888-42a8-b9a6-fd5502f1a35f/-/format/auto/",
  },
  pogoda_night: {
    id: "pogoda_night",
    name: "Pogoda (Night)",
    icon: "🌙",
    background: "linear-gradient(to bottom, #151e3d, #4b6cb7)",
    image:
      "https://ucarecdn.com/3fd70a5c-750a-48bf-9c3b-75e928745e5d/-/format/auto/",
  },
  zen_garden: {
    id: "zen_garden",
    name: "Zen Garden",
    icon: "🪷",
    background: "linear-gradient(to bottom, #b6e2d3, #f5e6c6)",
    image:
      "https://ucarecdn.com/54da3ab4-095e-4c95-af24-213ce48187d8/-/format/auto/",
  },
  aurora_borealis: {
    id: "aurora_borealis",
    name: "Aurora Borealis",
    icon: "🌌",
    background: "linear-gradient(to bottom, #232526, #24c6dc, #5433ff)",
    image:
      "https://ucarecdn.com/3d2bb9a6-3bc4-4725-b9cb-3b81f7471aff/-/format/auto/",
  },
};


const PROFILE_ICONS = [
  {
    id: "tree",
    name: "Tree",
    emoji: "🌳",
    price: 5,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "seedling",
    name: "Seedling",
    emoji: "🌱",
    price: 5,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "cloudMoon",
    name: "Cloud Moon",
    emoji: "🌜",
    price: 5,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "sun",
    name: "Sun",
    emoji: "🌞",
    price: 5,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "star",
    name: "Star Icon",
    emoji: "⭐",
    price: 6,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "alien",
    name: "Alien",
    emoji: "👽",
    price: 5,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "fire",
    name: "Fire",
    emoji: "🔥",
    price: 5,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "ghost",
    name: "Ghost",
    emoji: "👻",
    price: 5,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "cat",
    name: "Cat Face",
    emoji: "🐱",
    price: 5,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "unicorn",
    name: "Unicorn",
    emoji: "🦄",
    price: 5,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "robot",
    name: "Robot",
    emoji: "🤖",
    price: 5,
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
    price: 5,
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
    price: 5,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "frog",
    name: "Frog",
    emoji: "🐸",
    price: 5,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "fox",
    name: "Fox",
    emoji: "🦊",
    price: 5,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "penguin",
    name: "Penguin",
    emoji: "🐧",
    price: 5,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "bunny",
    name: "Bunny",
    emoji: "🐰",
    price: 5,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "duck",
    name: "Duck",
    emoji: "🦆",
    price: 5,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "hamster",
    name: "Hamster",
    emoji: "🐹",
    price: 6,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "owl",
    name: "Owl",
    emoji: "🦉",
    price: 4,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "hedgehog",
    name: "Hedgehog",
    emoji: "🦔",
    price: 5,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "panda",
    name: "Panda",
    emoji: "🐼",
    price: 5,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "monkey",
    name: "Monkey",
    emoji: "🐵",
    price: 5,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "logo",
    name: "Special Logo",
    emoji: null,
    image:
      "https://ucarecdn.com/af9e3e7b-6303-4643-afbe-61d3a28941ff/-/format/auto/",
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
    price: 5,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "butterfly",
    name: "Butterfly",
    emoji: "🦋",
    price: 5,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "ladybug",
    name: "Ladybug",
    emoji: "🐞",
    price: 7,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "chick",
    name: "Chick",
    emoji: "🐤",
    price: 7,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "dog",
    name: "Dog",
    emoji: "🐶",
    price: 200,
    currency: "renownTokens",
    isLimited: true,
  },
  {
    id: "bear",
    name: "Bear",
    emoji: "🐻",
    price: 6,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "dolphin",
    name: "Dolphin",
    emoji: "🐬",
    price: 6,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "whale",
    name: "Whale",
    emoji: "🐳",
    price: 7,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "snail",
    name: "Snail",
    emoji: "🐌",
    price: 5,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "peach",
    name: "Peach",
    emoji: "🍑",
    price: 5,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "avocado",
    name: "Avocado",
    emoji: "🥑",
    price: 5,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "mushroom",
    name: "Mushroom",
    emoji: "🍄",
    price: 4,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "cherry",
    name: "Cherry",
    emoji: "🍒",
    price: 3,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "cookie",
    name: "Cookie",
    emoji: "🍪",
    price: 3,
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
  {
  id: "lighthouse",
  name: "Lighthouse",
  emoji: "🗼",
  price: 6,
  currency: "renownTokens",
  isLimited: false,
},
{
  id: "moon",
  name: "Moon",
  emoji: "🌕",
  price: 5,
  currency: "renownTokens",
  isLimited: false,
},
{
  id: "comet",
  name: "Comet",
  emoji: "☄️",
  price: 7,
  currency: "renownTokens",
  isLimited: false,
},
{
  id: "snowflake",
  name: "Snowflake",
  emoji: "❄️",
  price: 4,
  currency: "renownTokens",
  isLimited: false,
},
{
  id: "maple",
  name: "Maple Leaf",
  emoji: "🍁",
  price: 4,
  currency: "renownTokens",
  isLimited: false,
},
{
  id: "eclipse",
  name: "Eclipse",
  emoji: "🌑",
  price: 6,
  currency: "renownTokens",
  isLimited: false,
},
{
  id: "mountain",
  name: "Mountain",
  emoji: "🏔️",
  price: 5,
  currency: "renownTokens",
  isLimited: false,
},
{
  id: "ninja",
  name: "Ninja",
  emoji: "🥷",
  price: 35,
  currency: "renownTokens",
  isLimited: true,
  limitedStock: 5,
},
{
  id: "phoenix",
  name: "Phoenix",
  emoji: "🔥🕊️",
  price: 35,
  currency: "renownTokens",
  isLimited: true,
  limitedStock: 5,
},
{
  id: "clover",
  name: "Four Leaf Clover",
  emoji: "🍀",
  price: 6,
  currency: "renownTokens",
  isLimited: false,
},
{
  id: "pirate",
  name: "Pirate",
  emoji: "🏴‍☠️",
  price: 35,
  currency: "renownTokens",
  isLimited: true,
  limitedStock: 3,
},
{
  id: "vampire",
  name: "Vampire",
  emoji: "🧛‍♂️",
  price: 35,
  currency: "renownTokens",
  isLimited: true,
  limitedStock: 5,
},
{
  id: "sakura",
  name: "Sakura",
  emoji: "🌸",
  price: 4,
  currency: "renownTokens",
  isLimited: false,
},
{
  id: "balloon",
  name: "Balloon",
  emoji: "🎈",
  price: 4,
  currency: "renownTokens",
  isLimited: false,
},
{
  id: "dragonfruit",
  name: "Dragon Fruit",
  emoji: "🐉🍈",
  price: 50,
  currency: "renownTokens",
  isLimited: true,
  limitedStock: 1,
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

const WEATHER_ICONS = {
  Sun: "☀️",
  Rain: "🌧️",
  Thunder: "⛈️",
  Lightning: "⚡",
  Snow: "❄️",
  Sleet: "🌨️",
  Hail: "🌨️",
  Windy: "💨",
  Cloudy: "☁️",
  Foggy: "🌫️",
  Clear: "☀️"
};



function MainComponent() {
  const [userId, setUserId] = useState(null);
  const [pin, setPin] = useState(null);
  const [showWeatherFlash, setShowWeatherFlash] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [currentPinInput, setCurrentPinInput] = useState("");
  const [creatingGuild, setCreatingGuild] = useState(false);
const [newGuildName, setNewGuildName] = useState("");
const [newGuildIcon, setNewGuildIcon] = useState("robot"); // default icon
  const [newPinInput, setNewPinInput] = useState("");
  const [confirmPinInput, setConfirmPinInput] = useState("");
  const [pinErrorMessage, setPinErrorMessage] = useState("");
  const [pinSuccessMessage, setPinSuccessMessage] = useState("");
  const [showOfflineEarnings, setShowOfflineEarnings] = useState(false);
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
  const [friends, setFriends] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [friendError, setFriendError] = useState(null);
    const [showFriendsList, setShowFriendsList] = useState(false);
const [pendingRequests, setPendingRequests] = useState([]);
const [searchQuery, setSearchQuery] = useState('');
const [searchResults, setSearchResults] = useState([]);
const [activeShopBoosts, setActiveShopBoosts] = useState([]);
const [lastDailyClaim, setLastDailyClaim] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
    const [showRequests, setShowRequests] = useState(false);
const [guild, setGuild] = useState(null);
  const [profileName, setProfileName] = useState("");
const [profileIcon, setProfileIcon] = useState("");
const [sidebarOpen, setSidebarOpen] = useState(false);


  const [activeTab, setActiveTab] = useState("tap");


useEffect(() => {
  // Tries to grab userId from localStorage, but will work anonymously too
  const userId = localStorage.getItem("userId");
  logPageview({
    userId: userId ? parseInt(userId, 10) : null, // or leave out for anonymous
    // Optionally, set pagePath: "/help" or "/notice-board" for clarity
  });
}, []);
// Fetch friends list and pending requests only when userId is set
useEffect(() => {
  if (!userId) return;

  // Always load guild info with friendtab
  fetchGuildData(userId);

  // Fetch Friends List
  setFriendsLoading(true);
  setFriendError(null);

  fetch(`/api/friends?action=get&userId=${encodeURIComponent(userId)}`)
    .then((res) => res.json())
    .then((data) => {
      if (data.error) {
        setFriendError(data.error);
        setFriends([]);
      } else {
        setFriends(data.friends || []);
      }
      setFriendsLoading(false);
    })
    .catch(() => {
      setFriendError("Failed to fetch friends");
      setFriends([]);
      setFriendsLoading(false);
    });

  // Fetch Pending Requests
  fetchPendingRequests();

}, [userId]);


  useEffect(() => {
  if (showRequests) {
    fetchPendingRequests();  // your existing fetch function for pending requests
  }
}, [showRequests]);

useEffect(() => {
  const saved = localStorage.getItem("activeBoost");
  if (saved) setActiveBoost(JSON.parse(saved));

  const shopBoosts = localStorage.getItem("activeShopBoosts");
  if (shopBoosts) setActiveShopBoosts(JSON.parse(shopBoosts));

  const dailyClaim = localStorage.getItem("lastDailyClaim");
  setLastDailyClaim(Number(dailyClaim) || 0);
}, []);

useEffect(() => {
  const storedUserId = localStorage.getItem("userId");
  const storedPin = localStorage.getItem("pin");

  setUserId(storedUserId);
  setPin(storedPin);
}, []);

  useEffect(() => {
  const fetchProfile = async () => {
    const { data } = await supabase
      .from("game_saves")
      .select("profile_name, profile_icon")
      .eq("user_id", userId)
      .single();

    if (data) {
      setProfileName(data.profile_name);
      setProfileIcon(data.profile_icon);
    }
  };

  if (userId) fetchProfile();
}, [userId]);



  const [
    doubleEarningsOfflineEarningsBackup,
    setDoubleEarningsOfflineEarningsBackup,
  ] = useState(null);
    useEffect(() => {
    loadGame();
  }, [userId, pin]);
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
      highest_house_level: 1,
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

const fetchGuildData = async (id = userId) => {
  if (!id) return;

  // 1. Get this user and their guild_id
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("guild_id, is_guild_leader")
    .eq("user_id", parseInt(id))
    .single();

  if (userError || !userData?.guild_id) {
    console.warn("No guild found for this user.");
    setGuild(null);
    return;
  }

  const guildId = userData.guild_id;

  // 2. Get the guild details
  const { data: guildData, error: guildError } = await supabase
    .from("guilds")
    .select("*")
    .eq("id", guildId)
    .single();

  if (guildError || !guildData?.id) {
    console.warn("Failed to fetch guild data:", guildError?.message || "No data returned");
    setGuild(null);
    return;
  }

  // 3. Get all user_ids in this guild from users table
  const { data: guildUsers, error: guildUsersError } = await supabase
    .from("users")
    .select("user_id")
    .eq("guild_id", guildId);

  const userIds = guildUsers?.map(u => u.user_id) || [];

  // 4. Fetch their profile info and house_level from game_saves
  let members = [];
  if (userIds.length > 0) {
    const { data: memberProfiles, error: memberProfilesError } = await supabase
      .from("game_saves")
      .select("user_id, profile_name, profile_icon, house_level")
      .in("user_id", userIds);

    members = memberProfiles || [];
  }

  const totalScore = members.reduce((sum, m) => sum + (m.house_level || 0), 0);

  // 5. Update guild score in database (if valid)
  const { error: updateError } = await supabase
    .from("guilds")
    .update({ score: totalScore })
    .eq("id", guildId);

  if (updateError) {
    console.error("Failed to update guild score:", updateError.message);
  }

  // 6. Set local state
  setGuild({
    id: guildData.id,
    name: guildData.name,
    icon: guildData.icon,
    leader_id: guildData.leader_id,
    is_leader: userData.is_guild_leader,
    members,
    score: totalScore,
  });
};
const leaveGuild = async () => {
  if (!userId) return;

  const { error } = await supabase
    .from("users")
    .update({ guild_id: null })        // remove guild assignment
    .eq("user_id", userId);            // target the current player only

  if (error) {
    setNotification("Failed to leave guild.");
  } else {
    setGuild(null);                    // clear local guild state
    setNotification("You left the guild.");
    fetchGuildData(userId);           // refresh user’s new state
  }
};
  



useEffect(() => {
  if (activeTab !== "guilds" || !userId) return;

  // Fetch immediately
  fetchGuildData(userId);

  // Set interval to refetch every 5 seconds
  const interval = setInterval(() => {
    fetchGuildData(userId);
  }, 5000);

  // Clear interval when tab or userId changes or component unmounts
  return () => clearInterval(interval);
}, [activeTab, userId]);

useEffect(() => {
  if (activeTab !== "guilds" || !guild?.id) return;

  // Fetch chat messages immediately
  fetchMessages();

  // Then set interval to refetch every 5 seconds
  const interval = setInterval(() => {
    fetchMessages();
  }, 5000);

  return () => clearInterval(interval);
}, [activeTab, guild?.id]);

const inviteToGuild = async (friendId) => {
  if (!guild || !guild.id) return;

  const { error } = await supabase
    .from("guild_invites")
    .insert([
      {
        guild_id: guild.id,
        invited_user_id: friendId,
        inviter_user_id: userId, // or guild.leader_id
        status: "pending",
      },
    ]);

  if (error) {
    setNotification("Failed to send invite.");
  } else {
    setNotification("Guild invite sent!");
  }
};

  const [guildInvites, setGuildInvites] = useState([]);

const fetchGuildInvites = async () => {
  const { data, error } = await supabase
    .from("guild_invites")
    .select(`
      id,
      guild_id,
      inviter_user_id,
      created_at,
      guilds (
        name,
        icon
      )
    `)
    .eq("invited_user_id", userId)
    .eq("status", "pending");

  if (error) {
    setGuildInvites([]);
  } else {
    setGuildInvites(data);
  }
};

  const acceptGuildInvite = async (inviteId, guildId) => {
  // 1. Update user's guild_id
  const { error: userErr } = await supabase
    .from("users")
    .update({ guild_id: guildId })
    .eq("user_id", userId);

  // 2. Mark invite as accepted
  const { error: inviteErr } = await supabase
    .from("guild_invites")
    .update({ status: "accepted" })
    .eq("id", inviteId);

  if (!userErr && !inviteErr) {
    setNotification("You joined the guild!");
    fetchGuildInvites(); // Refresh invites
    fetchGuildData();    // Refresh current guild
  } else {
    setNotification("Failed to join the guild.");
  }
};

  useEffect(() => {
  if (!guild && activeTab === "guilds" && userId) {
    fetchGuildInvites();
  }
}, [guild, activeTab, userId]);

  const UPGRADE_DISPLAY_NAMES = {
    tapPowerUpgrades: "Tap Power Upgrades",
    autoTapperUpgrades: "Auto Tapper Upgrades",
    critChanceUpgrades: "Critical Chance Upgrades",
    tapSpeedBonusUpgrades: "Tap Speed Bonus Upgrades",
  };

const fetchMessages = async () => {
  if (!guild?.id) return;

  const { data, error } = await supabase
    .from("guild_chat")
    .select(`
      id,
      message,
      inserted_at,
      user_id,
      game_saves:game_saves!fk_guild_chat_user_to_game_saves (
        profile_name,
        profile_icon
      )
    `)
    .eq("guild_id", guild.id)
    .gte("inserted_at", new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString())
    .order("inserted_at", { ascending: true });

  if (!error && data) {
    const formatted = data.map((msg) => ({
      id: msg.id,
      message: msg.message,
      inserted_at: msg.inserted_at,
      user_id: msg.user_id,
      profile_name: msg.game_saves?.profile_name || "Unknown",
      profile_icon: msg.game_saves?.profile_icon || null,
    }));
    setGuildMessages(formatted);
  } else {
    setGuildMessages([]);
    console.error("Failed to fetch messages", error);
  }
};

useEffect(() => {
  if (!guild?.id) return;

  fetchMessages();

  const channel = supabase
    .channel(`guild_chat_${guild.id}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'guild_chat',
        filter: `guild_id=eq.${guild.id}`,
      },
      async (payload) => {
        const { data, error } = await supabase
          .from('guild_chat')
          .select(`
            id,
            message,
            inserted_at,
            user_id,
            game_saves:game_saves!fk_guild_chat_user_to_game_saves (
              profile_name,
              profile_icon
            )
          `)
          .eq('id', payload.new.id)
          .single();

        if (!error && data) {
          setGuildMessages((prev) => [
            ...prev,
            {
              id: data.id,
              message: data.message,
              inserted_at: data.inserted_at,
              user_id: data.user_id,
              profile_name: data.game_saves?.profile_name || "Unknown",
              profile_icon: data.game_saves?.profile_icon || null,
            }
          ]);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [guild?.id]);
const [menuOpen, setMenuOpen] = useState(false); // open by default
  const [notification, setNotification] = useState(null);

  const [rainDrops, setRainDrops] = React.useState([]);
  const [showStats, setShowStats] = useState(false);
  const [activeTheme, setActiveTheme] = React.useState("heaven");
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [pendingOfflineEarnings, setPendingOfflineEarnings] = useState(null);
  const [lastTapTimes, setLastTapTimes] = useState([]);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showMaddoxModal, setShowMaddoxModal] = useState(false);
                                                     
 const [muted, setMuted] = useState(false);
  const [playClick] = useSound("/sounds/click.wav", { volume: muted ? 0 : 0.4 });
const [playUpgrade] = useSound("/sounds/upgrade.wav", { volume: muted ? 0 : 0.4 });
const [playBg] = useSound("/sounds/taptaptwobg.mp3", {
  volume: muted ? 0 : 0.3,
  loop: true,
  interrupt: false,
});

  useEffect(() => {
  playBg();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
  
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
  const DISCOUNT_FACTOR = 0.8; // 20% discount
const [showGuildChat, setShowGuildChat] = useState(true);
const [guildMessages, setGuildMessages] = useState([]);
const [newMessage, setNewMessage] = useState("");

  
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


const handleCreateGuild = async (e) => {
  e.preventDefault();
  if (!userId || !newGuildName) return;

  // Step 1: Create the guild
  const { data: newGuild, error: guildError } = await supabase
    .from("guilds")
    .insert([
      {
        name: newGuildName,
        leader_id: parseInt(userId),
        icon: newGuildIcon,
      },
    ])
    .select()
    .single();

  if (guildError) {
    console.error("Error creating guild:", guildError);
    setNotification("Failed to create guild.");
    return;
  }

  // Step 2: Update user to join that guild
  const { error: userError } = await supabase
    .from("users")
    .update({
      guild_id: newGuild.id,
      is_guild_leader: true,
    })
    .eq("user_id", parseInt(userId)); // ✅ FIXED: parseInt here

  if (userError) {
    console.error("Error setting user to guild:", userError);
    setNotification("Guild created but failed to join.");
    return;
  }

  setNotification("Guild created!");

  // Reset form state
  setCreatingGuild(false);
  setNewGuildName("");
  setNewGuildIcon("robot");

  // Refresh guild data in UI
  await fetchGuildData();
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



  
const renderFriendsTab = () => {
  return (
    <div className={`${glassStyle} bg-gradient-to-br from-white/40 via-purple-100/40 to-white/20 rounded-3xl p-6 ${buttonGlow} max-w-xl mx-auto shadow-2xl border border-white/20 backdrop-blur-xl`}>
      {/* Tabs Header */}
      <div className="flex justify-center gap-7 mb-8">
        <button
          onClick={() => setActiveTab("friends")}
          className={`
            px-7 pb-2 font-bold text-lg rounded-t-2xl transition
            ${activeTab === "friends"
              ? "border-b-4 border-purple-500 text-purple-800 bg-white/70 shadow"
              : "text-gray-500 hover:text-purple-700 hover:bg-white/40"}
          `}
          aria-label="Friends Tab"
        >
          Friends
        </button>
        <button
          onClick={() => setActiveTab("guilds")}
          className={`
            px-7 pb-2 font-bold text-lg rounded-t-2xl transition
            ${activeTab === "guilds"
              ? "border-b-4 border-indigo-500 text-indigo-800 bg-white/70 shadow"
              : "text-gray-500 hover:text-indigo-700 hover:bg-white/40"}
          `}
          aria-label="Guilds Tab"
        >
          Guilds
        </button>
      </div>

      {/* FRIENDS TAB */}
      {activeTab === "friends" && (
        <>
          {/* Add/Search + Requests Header */}
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={() => setShowSearch((prev) => !prev)}
              className="text-purple-700 bg-white/60 hover:bg-purple-200 hover:text-purple-900 shadow px-3 py-1 rounded-xl transition"
              title="Add Friend"
            >
              <i className="fas fa-user-plus"></i>
            </button>
            <h2 className="text-2xl font-crimson-text text-[#3b2376] tracking-tight">Friends</h2>
            <button
              onClick={() => setShowRequests((prev) => !prev)}
              className="text-yellow-600 bg-white/60 hover:bg-yellow-200 hover:text-yellow-800 shadow px-3 py-1 rounded-xl transition"
              title="Friend Requests"
            >
              <i className="fas fa-exclamation-circle"></i>
            </button>
          </div>

          {/* Chat Button (disabled/soon) */}
          <div className="flex justify-center mb-4">
            <button
              disabled
              className="cursor-not-allowed text-gray-400 bg-gray-100/80 px-4 py-2 rounded-full text-sm shadow"
              title="Chat coming soon"
            >
              <i className="fas fa-comments-slash mr-2"></i> Chat (Coming Soon)
            </button>
          </div>

          {/* Search Friend Section */}
          {showSearch && (
            <div className="space-y-2 mb-7 bg-white/60 rounded-2xl border border-white/30 p-4 shadow-inner">
              <input
                type="text"
                placeholder="Search user ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-white/80 border border-purple-200 text-[#2d3748] focus:ring-2 focus:ring-purple-400 transition"
              />
              <button
                onClick={handleSearch}
                className="w-full py-2 bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white rounded-xl font-bold shadow transition"
              >
                Search
              </button>
              {searchQuery && (
                searchResults.length > 0 ? (
                  <div className="space-y-4 mt-2">
                    <h4 className="font-bold text-[#4b277c]">Search Results:</h4>
                    {searchResults.map((user) => {
                      const iconObj = PROFILE_ICONS.find(ic => ic.id === user.profile_icon);
                      return (
                        <div
                          key={user.user_id}
                          className="flex items-center justify-between bg-white/80 rounded-xl p-4 shadow-md hover:shadow-lg transition"
                        >
                          {/* Avatar + Info */}
                          <div className="flex items-center gap-4">
                            {iconObj ? (
                              iconObj.image ? (
                                <img src={iconObj.image} alt={iconObj.name} className="w-12 h-12 rounded-full border-2 border-purple-500 object-cover" />
                              ) : (
                                <span className="text-2xl">{iconObj.emoji}</span>
                              )
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center border-2 border-purple-400">
                                <i className="fas fa-user text-purple-400"></i>
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-[#3b2376]">
                                {user.profile_name || 'Unknown'}{' '}
                                <span className="text-sm text-gray-500">({user.user_id})</span>
                              </p>
                              <p className="text-xs text-purple-700 font-semibold">{user.house_name || 'No House'}</p>
                            </div>
                          </div>
                          {/* Stats */}
                          <div className="text-right text-[#2d3748] text-xs space-y-1 mr-2">
                            <p><span className="font-semibold">Taps:</span> {user.total_taps ?? 0}</p>
                            <p><span className="font-semibold">Upgrades:</span> {user.combined_upgrade_level ?? 0}</p>
                            <p><span className="font-semibold">Coins:</span> {formatNumberShort(user.total_coins_earned ?? 0)}</p>
                          </div>
                          {/* Add Friend */}
                          <button
                            onClick={() => sendFriendRequest(user.user_id)}
                            className="ml-2 px-4 py-1 bg-blue-500 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow transition"
                            disabled={user.user_id === userId}
                            title={user.user_id === userId ? "You can't add yourself" : "Add Friend"}
                          >
                            Add
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-4 text-center text-[#4b277c]">No user found with ID "{searchQuery}"</p>
                )
              )}
            </div>
          )}

          {/* Pending Requests */}
          {showRequests && (
            <div className="space-y-2 mb-7 bg-yellow-100/70 rounded-2xl border border-yellow-200/40 p-4 shadow-inner">
              <h4 className="font-bold text-yellow-900">Pending Requests:</h4>
              {pendingRequests.length > 0 ? (
                pendingRequests.map((req) => {
                  const iconObj = PROFILE_ICONS.find(ic => ic.id === req.profile_icon);
                  return (
                    <div
                      key={req.user_id}
                      className="flex items-center justify-between bg-yellow-50/80 rounded-xl p-3 shadow hover:shadow-lg transition"
                    >
                      <div className="flex items-center gap-3">
                        {iconObj ? (
                          iconObj.image ? (
                            <img src={iconObj.image} alt={iconObj.name} className="w-10 h-10 rounded-full border-2 border-purple-400 object-cover" />
                          ) : (
                            <span className="text-xl">{iconObj.emoji}</span>
                          )
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center border-2 border-purple-400">
                            <i className="fas fa-user text-purple-400"></i>
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-[#3b2376]">
                            {req.profile_name || 'Unknown'}{' '}
                            <span className="text-sm text-gray-500">({req.user_id})</span>
                          </p>
                          <p className="text-xs text-purple-700 font-semibold">{req.house_name || 'No House'}</p>
                        </div>
                      </div>
                      <div className="text-right text-[#2d3748] text-xs space-y-1 mr-2">
                        <p><span className="font-semibold">Taps:</span> {req.total_taps ?? 0}</p>
                        <p><span className="font-semibold">Upgrades:</span> {req.combined_upgrade_level ?? 0}</p>
                        <p><span className="font-semibold">Coins:</span> {formatNumberShort(req.total_coins_earned ?? 0)}</p>
                      </div>
                      <button
                        onClick={() => acceptFriendRequest(req.user_id)}
                        className="ml-2 px-4 py-1 bg-blue-500 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow transition"
                      >
                        Accept
                      </button>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-[#3b2376]">No requests</p>
              )}
            </div>
          )}

          {/* Friends List */}
          {friendsLoading && <p>Loading friends...</p>}
          {friendError && <p className="text-red-500">{friendError}</p>}
          {!friendsLoading && !friendError && friends.length === 0 && (
            <p className="text-center text-[#3b2376]">No friends found.</p>
          )}
          {!friendsLoading && !friendError && friends.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-bold text-[#4b277c]">Your Friends:</h4>
              {friends.map((friend) => {
                const iconObj = PROFILE_ICONS.find(ic => ic.id === friend.profile_icon);
                return (
                  <div
                    key={friend.friend_id}
                    className="flex justify-between items-center bg-white/60 rounded-xl p-3 shadow hover:shadow-md transition"
                  >
                    <div className="flex items-center gap-4 text-[#2d3748]">
                      {iconObj ? (
                        iconObj.image ? (
                          <img src={iconObj.image} alt={iconObj.name} className="w-10 h-10 rounded-full border-2 border-purple-400 object-cover" />
                        ) : (
                          <span className="text-2xl">{iconObj.emoji}</span>
                        )
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center border-2 border-purple-400">
                          <i className="fas fa-user text-purple-400"></i>
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-[#3b2376]">
                          {friend.profile_name || 'Unknown'}{' '}
                          <span className="text-xs text-gray-500">({friend.friend_id})</span>
                        </p>
                        <p className="text-xs">Taps: {formatNumberShort(friend.total_taps ?? 0)}</p>
                        <p className="text-xs">Upgrades: {friend.combined_upgrade_level ?? 0}</p>
                        <p className="text-xs">Coins: {formatNumberShort(friend.total_coins_earned ?? 0)}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={() => removeFriend(friend.friend_id)}
                        className="text-sm bg-red-500 text-white px-3 py-1 rounded-full hover:bg-red-600 font-bold shadow"
                      >
                        Remove
                      </button>
                      {guild?.is_leader &&
                        guild.members?.length < 5 &&
                        friend.guild_id == null && (
                          <button
                            onClick={() => inviteToGuild(friend.friend_id)}
                            className="text-sm bg-indigo-500 text-white px-3 py-1 rounded-full hover:bg-indigo-600 font-bold shadow"
                            title="Invite to your guild"
                          >
                            Invite to Guild
                          </button>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* GUILDS TAB */}
      {activeTab === "guilds" && (
        <div className="w-full max-w-lg mx-auto bg-gradient-to-br from-indigo-200/60 to-white/70 rounded-3xl p-7 shadow-2xl border border-white/20 backdrop-blur-lg">
          <h2 className="text-3xl font-bold text-indigo-900 text-center mb-3 tracking-wide drop-shadow-lg flex items-center justify-center gap-2">
            <span>
              {guild?.icon
                ? (GUILD_ICONS.find(ic => ic.id === guild.icon)?.emoji || "👥")
                : "👥"}
            </span>
            {guild ? guild.name : "Your Guild"}
          </h2>
          {/* Guild Score and Leave Option */}
          {guild && (
            <div className="flex flex-col sm:flex-row sm:justify-between items-center mt-2 mb-5 gap-2">
              <span className="bg-indigo-50/80 text-indigo-900 font-bold text-lg rounded-xl px-4 py-1 border border-indigo-200 shadow">
                Guild Score: <span className="text-indigo-800">{guild.score || 0}</span>
              </span>
              <button
                type="button"
                onClick={async () => {
                  if (!userId || !guild) return;
                  const isLeader = Number(userId) === Number(guild.leader_id);
                  if (isLeader) {
                    // 1. Kick all users out of the guild
                    const { error: clearUsersError } = await supabase
                      .from("users")
                      .update({ guild_id: null })
                      .eq("guild_id", guild.id);
                    // 2. Delete all related guild_invites
                    await supabase
                      .from("guild_invites")
                      .delete()
                      .eq("guild_id", guild.id);
                    // 3. Delete all related guild_chat messages
                    await supabase
                      .from("guild_chat")
                      .delete()
                      .eq("guild_id", guild.id);
                    // 4. Delete the actual guild
                    const { error: deleteGuildError } = await supabase
                      .from("guilds")
                      .delete()
                      .eq("id", guild.id);
                    if (clearUsersError || deleteGuildError) {
                      setNotification("Failed to disband the guild.");
                    } else {
                      setGuild(null);
                      setNotification("Guild disbanded.");
                      fetchGuildData(userId);
                    }
                  } else {
                    // Member leaving only
                    const { error } = await supabase
                      .from("users")
                      .update({ guild_id: null })
                      .eq("user_id", userId);
                    if (error) {
                      setNotification("Failed to leave guild.");
                    } else {
                      setGuild(null);
                      setNotification("You left the guild.");
                      fetchGuildData(userId);
                    }
                  }
                }}
                className="bg-red-600 hover:bg-red-800 text-white px-4 py-2 rounded-full text-sm shadow active:scale-95 transition"
              >
                Leave Guild
              </button>
            </div>
          )}

          {/* Guild Invites */}
          {!guild && guildInvites?.length > 0 && (
            <div className="space-y-4 mb-6">
              <h3 className="text-lg font-bold text-indigo-700 text-center">Guild Invites</h3>
              {guildInvites.map((invite) => (
                <div key={invite.id} className="bg-white/90 rounded-2xl px-4 py-3 flex items-center justify-between shadow border border-indigo-200">
                  <span>
                    <span className="text-2xl mr-2">
                      {GUILD_ICONS.find(ic => ic.id === invite.guilds?.icon)?.emoji || "👥"}
                    </span>
                    <span className="font-semibold text-indigo-900">{invite.guilds?.name || "Unnamed Guild"}</span>
                  </span>
                  <button
                    className="ml-4 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-full shadow"
                    onClick={() => acceptGuildInvite(invite.id, invite.guild_id)}
                  >
                    Accept
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Create Guild Section */}
          {!guild && (
            <div className="space-y-8 py-8">
              <p className="text-center text-gray-700 text-lg mb-2">You are not in a guild yet.</p>
              {!creatingGuild ? (
                <div className="text-center">
                  <button
                    onClick={() => setCreatingGuild(true)}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full shadow-lg transition active:scale-95"
                  >
                    <i className="fas fa-users mr-2" /> Create a Guild
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleCreateGuild}
                  className="flex flex-col space-y-6 items-center w-full"
                >
                  <input
                    type="text"
                    placeholder="Guild Name (max 20 chars)"
                    maxLength={20}
                    value={newGuildName}
                    onChange={e => setNewGuildName(e.target.value)}
                    className="w-64 px-3 py-2 rounded-xl bg-white/90 border border-indigo-300 focus:ring-2 focus:ring-indigo-400 text-gray-900 font-bold shadow"
                    required
                  />
                  {/* Emoji keyboard style grid */}
                  <div className="w-full max-w-xs mx-auto">
                    <label className="block text-center font-bold text-indigo-800 mb-2">Choose an Icon</label>
                    <div
                      className="grid grid-cols-6 gap-2 sm:grid-cols-10 p-2 bg-white/70 rounded-xl shadow-inner border border-indigo-100"
                      style={{ maxHeight: '180px', overflowY: 'auto', touchAction: 'pan-y' }}
                    >
                      {GUILD_ICONS.map((icon) => (
                        <button
                          key={icon.id}
                          type="button"
                          onClick={() => setNewGuildIcon(icon.id)}
                          className={`rounded-lg p-2 text-2xl transition border-2
                            ${newGuildIcon === icon.id
                              ? 'border-indigo-700 bg-indigo-100 scale-110'
                              : 'border-transparent hover:bg-indigo-50 active:scale-95'}`}
                          aria-label={icon.name}
                        >
                          {icon.emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-64 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full font-bold shadow transition active:scale-95"
                  >
                    Create Guild
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreatingGuild(false)}
                    className="w-64 py-1 mt-1 bg-gray-200 text-gray-800 rounded-full font-semibold hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Guild Members */}
          {guild && (
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{GUILD_ICONS.find(ic => ic.id === guild.icon)?.emoji || "👥"}</span>
                  <span className="font-bold text-xl text-indigo-800">{guild.name}</span>
                </div>
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                  Members {guild.members?.length ?? 0}/5
                </span>
              </div>
              <ul className="divide-y divide-indigo-100 bg-white/80 rounded-2xl overflow-hidden shadow-inner border border-indigo-100">
                {guild.members && guild.members.length > 0 ? (
                  // Sort members highest to lowest house_level
                  guild.members
                    .slice() // clone array
                    .sort((a, b) => (b.house_level || 0) - (a.house_level || 0))
                    .map(member => {
                      const iconObj = PROFILE_ICONS.find(ic => ic.id === member.profile_icon);
                      return (
                        <li key={member.user_id} className="flex items-center px-4 py-2 gap-4">
                          {iconObj ? (
                            iconObj.image ? (
                              <img
                                src={iconObj.image}
                                alt={iconObj.name}
                                className="w-9 h-9 rounded-full border-2 border-indigo-300 object-cover"
                              />
                            ) : (
                              <span className="text-2xl">{iconObj.emoji}</span>
                            )
                          ) : (
                            <span className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-400 font-bold text-lg">?</span>
                          )}
                          <span className="font-bold text-indigo-900">{member.profile_name || "Unknown"}</span>
                          <span className="ml-auto text-indigo-700 font-bold text-lg">{member.house_level || 0}</span>
                          {member.user_id === guild.leader_id && (
                            <span className="ml-2 text-xs bg-indigo-200 text-indigo-800 px-2 py-1 rounded-full font-bold">Leader</span>
                          )}
                        </li>
                      );
                    })
                ) : (
                  <li className="text-gray-600 px-4 py-2">No members found.</li>
                )}
              </ul>
              {guild.is_leader && guild.members?.length < 5 && (
                <div className="text-xs text-indigo-700 text-center mt-4">
                  Invite more friends from the <span className="font-bold">Friends</span> tab below.
                </div>
              )}
            </div>
          )}
          {/* Guild Chat */}
          {guild && (
            <>
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => setShowGuildChat(prev => !prev)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-full font-bold shadow-md transition active:scale-95"
                >
                  <i className="fas fa-comments mr-2" /> {showGuildChat ? "Hide Chat" : "Show Chat"}
                </button>
              </div>
              {showGuildChat && (
                <div className="mt-4 bg-white/70 backdrop-blur-xl rounded-2xl p-4 border border-indigo-200 shadow-lg max-h-[400px] flex flex-col space-y-3 overflow-hidden">
                  <div className="font-bold text-indigo-900 text-center text-lg mb-2 flex items-center justify-center gap-2">
                    <i className="fas fa-comments" /> Guild Chat
                  </div>
                  {/* Messages List */}
                  <div className="flex-1 overflow-y-auto px-2 py-1 space-y-2">
                    {guildMessages.length === 0 ? (
                      <p className="text-center text-gray-600 text-sm italic">No messages yet.</p>
                    ) : (
                      guildMessages.map((msg, i) => {
                        const iconId = msg.profile_icon;
                        const icon = PROFILE_ICONS.find(ic => ic.id === iconId);
                        const name = msg.profile_name || "Unknown";
                        return (
                          <div
                            key={i}
                            className="flex items-start gap-2 bg-white/90 px-3 py-2 rounded-xl shadow text-sm text-indigo-800"
                          >
                            {/* Profile Icon */}
                            {icon ? (
                              icon.image ? (
                                <img
                                  src={icon.image}
                                  alt={icon.name}
                                  className="w-8 h-8 rounded-full object-cover border border-indigo-400"
                                  title={icon.name}
                                />
                              ) : (
                                <span className="text-lg">{icon.emoji}</span>
                              )
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 border border-indigo-300">
                                <i className="fas fa-user" />
                              </div>
                            )}
                            {/* Message Content */}
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <span className="font-bold">{name}</span>
                                <span className="text-xs text-gray-500">
                                  {new Date(msg.inserted_at).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              <p>{msg.message}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  {/* Input Field */}
                  <div className="mt-2 space-y-2 sm:flex sm:items-center sm:space-y-0 sm:space-x-2">
                    <input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="w-full px-4 py-2 rounded-md bg-white/90 text-black placeholder-gray-500 focus:outline-none"
                      placeholder="Type a message..."
                    />
                    <button
                      onClick={handleSendMessage}
                      className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-700 font-bold transition"
                    >
                      Send
                    </button>
                  </div>

                </div>
              )}
    
            </>
          )}
        </div>
      )}
    </div>
  );
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
      let newOwnedThemes = Array.isArray(prev.ownedThemes) ? [...prev.ownedThemes] : [];
      let newOwnedBoosts = Array.isArray(prev.ownedBoosts) ? [...prev.ownedBoosts] : [];
      let newRenownTokens = typeof prev.renownTokens === "number" ? prev.renownTokens : 0;

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

      // Update permanentMultiplier based on new renown tokens count (1.5% per token)
      const newPermanentMultiplier = 1 + newRenownTokens * 0.015;

      const updated = {
        ...prev,
        ownedProfileIcons: newOwnedProfileIcons,
        ownedThemes: newOwnedThemes,
        ownedBoosts: newOwnedBoosts,
        renownTokens: newRenownTokens,
        permanentMultiplier: newPermanentMultiplier,
      };

      saveGame(updated);
      return updated;
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
  // First check if user has enough renown tokens before buying
  if (gameState.renownTokens < theme.price) {
    setNotification("Not enough Renown Tokens to buy this theme.");
    return;
  }

  if (theme.isLimited) {
    await buyLimitedItem({
      itemId: theme.id,
      itemType: "theme",
      price: theme.price,
    });
  } else {
    await buyRegularItem({
      itemId: theme.id,
      itemType: "theme",
      price: theme.price,
      userId,
      pin,
    });
  }

  // Deduct tokens and update multiplier immediately after purchase
  setGameState((prev) => {
    const newRenownTokens = prev.renownTokens - theme.price;
    const newPermanentMultiplier = 1 + newRenownTokens * 0.015;

    const updated = {
      ...prev,
      renownTokens: newRenownTokens,
      permanentMultiplier: newPermanentMultiplier,
      // Also add the theme to ownedThemes here if applicable
      ownedThemes: [...(prev.ownedThemes || []), theme.id],
    };
    saveGame(updated);
    return updated;
  });

  setNotification(`Purchased theme: ${theme.name}`);
};

const handleBuyIcon = async (icon) => {
  if (gameState.renownTokens < icon.price) {
    setNotification("Not enough Renown Tokens to buy this icon.");
    return;
  }

  if (icon.isLimited) {
    await buyLimitedItem({
      itemId: icon.id,
      itemType: "profileIcon",
      price: icon.price,
    });
  } else {
    await buyRegularItem({
      itemId: icon.id,
      itemType: "profileIcon",
      price: icon.price,
      userId,
      pin,
    });
  }

  setGameState((prev) => {
    const newRenownTokens = prev.renownTokens - icon.price;
    const newPermanentMultiplier = 1 + newRenownTokens * 0.015;

    const updated = {
      ...prev,
      renownTokens: newRenownTokens,
      permanentMultiplier: newPermanentMultiplier,
      // Add icon to ownedIcons if you track ownership
      ownedIcons: [...(prev.ownedIcons || []), icon.id],
    };
    saveGame(updated);
    return updated;
  });

  setNotification(`Purchased icon: ${icon.name}`);
};


  const handleEquipTheme = (theme) => {
    setGameState((prev) => {
      const updated = { ...prev, equippedTheme: theme.id };
      saveGame(updated);
      return updated;
    });
    setNotification(`Equipped theme: ${theme.name}`);
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
        opacity: 0.4,
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
    tapPower: (level) => Math.floor(20 * Math.pow(1.06, level)),

    autoTapper: (level) => Math.floor(500 * Math.pow(1.055, level)),

    critChance: (level) =>
      level < 84
        ? Math.floor(40 * Math.pow(1.06, level))
        : Math.floor(40 * Math.pow(1.06, 84) * Math.pow(1.09, level - 84)),
  

  tapSpeedBonus: (level) => Math.floor(80 * Math.pow(1.06, level)),

  }

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
const handleSendMessage = async () => {
  if (!newMessage.trim() || !guild?.id || !userId) return;

  const { error } = await supabase.from("guild_chat").insert([
    {
      guild_id: guild.id,
      user_id: userId,
      message: newMessage.trim(),
    },
  ]);

  if (!error) setNewMessage("");
};
useEffect(() => {
  if (!guild?.id) return;

  const loadChat = async () => {
    const { data, error } = await supabase
      .from("guild_chat")
      .select(`
        id,
        guild_id,
        user_id,
        message,
        inserted_at,
        game_saves (
          profile_name,
          profile_icon
        )
      `)
      .eq("guild_id", guild.id)
      .order("inserted_at", { ascending: true })
      .limit(100);

    if (!error && data) setGuildMessages(data);
  };

  loadChat();

  const channel = supabase
    .channel(`guild_chat_${guild.id}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'guild_chat',
      filter: `guild_id=eq.${guild.id}`,
    }, async (payload) => {
      const { data: enriched, error } = await supabase
        .from("guild_chat")
        .select(`
          id,
          guild_id,
          user_id,
          message,
          inserted_at,
          game_saves (
            profile_name,
            profile_icon
          )
        `)
        .eq("id", payload.new.id)
        .single();

      if (!error && enriched) {
        setGuildMessages(prev => [...prev, enriched]);
      }
    })
    .subscribe();

  return () => supabase.removeChannel(channel);
}, [guild?.id]);

function getWeatherIcon(currentWeather) {
  return WEATHER_ICONS[currentWeather] || "☀️";
}

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
if (loading) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
      <div className="text-white text-xl">Loading game, please wait...</div>
    </div>
  );
}

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
  
  async function fetchFriendsList() {
  setFriendsLoading(true);
  setFriendError(null);
  try {
    const res = await fetch(`/api/friends?action=get&userId=${userId}`);
    const data = await res.json();
    setFriends(data.friends || []);
  } catch (err) {
    setFriendError('Failed to load friends.');
  } finally {
    setFriendsLoading(false);
  }
}
async function fetchPendingRequests() {
  try {
    const res = await fetch(`/api/friends?action=pending&userId=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch pending requests');
    const data = await res.json();
    setPendingRequests(data.pending || []);
  } catch (error) {
    console.error('Failed to fetch pending requests:', error);
    setPendingRequests([]);
  }
}


async function handleSearch() {
  if (!searchQuery) return;
  try {
    const res = await fetch(`/api/friends?action=search&q=${searchQuery}`);
    const data = await res.json();
    setSearchResults(data.users || []);
  } catch {
    console.error('Search failed');
  }
}

async function sendFriendRequest(friendId) {
  await fetch(`/api/friends?action=request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, friendId }),
  });

  // Refresh pending requests
  if (activeTab === "Requests") {
    const res = await fetch(`/api/friends?action=pending&userId=${userId}`);
    const data = await res.json();
    setPendingRequests(data.pending || []);
  }

  setSearchResults([]);
}


async function acceptFriendRequest(fromId) {
  await fetch(`/api/friends?action=accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, friendId: fromId }),
  });
  fetchFriendsList();
  fetchPendingRequests();
}

async function removeFriend(friendId) {
  await fetch(`/api/friends?action=remove`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, friendId }),
  });
  fetchFriendsList();
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
                if (navigator.vibrate) {
  navigator.vibrate(50); // vibrate for 50 milliseconds
}

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
  setLoading(true); // Show loading overlay

  if (!userId || !pin) {
    // If you ever want to re-enable redirect, add:
    // window.location.href = "/login";
    setLoading(false);
    return;
  }

  try {
    const response = await fetch("/api/game-state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: parseInt(userId, 10), pin, action: "load" }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem("userId");
        localStorage.removeItem("pin");
        // If you ever want to re-enable redirect, add:
        // window.location.href = "/login";
        setLoading(false);
        return;
      }
      throw new Error("Failed to load game state");
    }

    const data = await response.json();
    if (data.gameState) {
      // Always calculate renownTokens and permanentMultiplier based on fresh data
      const renownTokens = Number(data.gameState.renown_tokens ?? data.gameState.renownTokens) || 0;
      const permanentMultiplier = 1 + renownTokens * 0.015;

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
        tapSpeedBonusUpgrades: Number(data.gameState.tap_speed_bonus_upgrades) || 0,
        totalTaps: Number(data.gameState.total_taps),
        totalCoinsEarned: Number(data.gameState.total_coins_earned),
        resets: Number(data.gameState.resets),
        permanentMultiplier, // always use the calculated value here
        currentSeason: Number(data.gameState.current_season),
        houseLevel: Number(data.gameState.house_level),
        highest_house_level:
          Number(data.gameState.highest_house_level ?? data.gameState.house_level) || 1,
        houseCoinsMultiplier: Number(data.gameState.house_coins_multiplier),
        hasFirstReset: Boolean(data.gameState.has_first_reset),
        currentWeather: data.gameState.current_weather || "Clear",
        currentYear: Number(data.gameState.current_year) || 0,
        houseName: data.gameState.house_name || "My Cozy Home",
        profileName: data.gameState.profile_name || "Player",
        coinsEarnedThisRun: Number(data.gameState.coins_earned_this_run) || 0,
        renownTokens, // the calculated value
      });
      // Handle quests and offline earnings as before...

      if (data.gameState.currentQuest) {
        const quest = data.gameState.currentQuest;
        const questTemplate = QUEST_TEMPLATES.find((q) => q.id === quest.id);

        let isComplete = false;
        if (questTemplate) {
          isComplete = questTemplate.check(data.gameState, quest);
        }

        if (isComplete) {
          const newQuest = generateQuest(data.gameState);
          setCurrentQuest(newQuest);
          setCanClaimQuest(false);
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
setShowOfflineEarnings(true); // <-- THIS IS WHAT WAS MISSING!
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
  } finally {
    setLoading(false); // Hide loading overlay always at the end
  }
};

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
    coins_earned_this_run: Math.floor(stateToSave.coinsEarnedThisRun || 0),
    permanent_multiplier: stateToSave.permanentMultiplier,
    current_season: stateToSave.currentSeason,
    house_level: stateToSave.houseLevel,
    highest_house_level: stateToSave.highest_house_level || stateToSave.houseLevel,  // <--- ADD THIS LINE
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
                  tokensToEarn * 0.015
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
                  if (navigator.vibrate) {
  navigator.vibrate(50); // vibrate for 50 milliseconds
}
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

  // Determine new highestHouseLevel:
  const newHighestHouseLevel =
    (gameState.houseLevel || 1) > (gameState.highestHouseLevel || 1)
      ? gameState.houseLevel
      : gameState.highestHouseLevel || 1;

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
    coinsEarnedThisRun: 0, // Reset to zero on prestige
    resets: gameState.resets + 1,
    highestHouseLevel: newHighestHouseLevel, // Update highest house level here
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
}, [gameState, saveGame, activeShopBoosts]);

const handleTap = useCallback(() => {
  // Redirect to /login if not logged in
  if (!userId || !pin) {
    window.location.href = "/login";
    return;
  }

  if (navigator.vibrate) navigator.vibrate(50);
  playClick(); // 🔊 Play sound immediately when tapped

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

  const weatherChangeChance = 0.016;
  let newWeather = gameState.currentWeather;
  if (Math.random() < weatherChangeChance) {
    newWeather = getNewWeather();
  }

  const newYear = Math.floor(combinedLevel / 200);

  const newState = {
    ...gameState,
    coins: gameState.coins + coinsEarned,
    totalCoinsEarned: gameState.totalCoinsEarned + coinsEarned,
    coinsEarnedThisRun: (gameState.coinsEarnedThisRun || 0) + coinsEarned,
    totalTaps: gameState.totalTaps + 1,
  };

  if (newWeather !== gameState.currentWeather) {
    newState.currentWeather = newWeather;
  }

  setGameState(newState);
  saveGame(newState);
  localStorage.setItem("lastActiveTime", Date.now());
}, [gameState, lastTapTimes, hasBoost, userId, pin]);


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

      if (navigator.vibrate) navigator.vibrate(50);

      // ✅ Play sound before upgrade is applied
      playUpgrade();

      state.coins -= cost;
      upgradesBought++;

      switch (type) {
        case "tapPower": {
          const level = state.tapPowerUpgrades + 1;
          const gain = 0.8 + level * 0.121;
          state.tapPower = Math.round((state.tapPower + gain) * 10) / 10;
          state.tapPowerUpgrades += 1;
          break;
        }
        case "autoTapper": {
          const level = state.autoTapperUpgrades + 1;
          const gain = 1.7 + level * 1.55;
          state.autoTapper = Math.round(state.autoTapper + gain);
          state.autoTapperUpgrades += 1;
          break;
        }
        case "critChance": {
          const current = state.critChance || 0;
          const level = state.critChanceUpgrades + 1;
          const startValue = 5;
          const maxLevel = 300;
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
          const gain = startValue + level * 1.4;
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
  [gameState, saveGame, setNotification, playUpgrade]
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
  totalTaps: [],
  guilds: [],
});

useEffect(() => {
  if (activeTab !== "leaderboard") return;

  const fetchLeaderboard = async () => {
    if (!userId || !pin) return;

    try {
      const response = await fetch("/api/game-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: parseInt(userId, 10),
          pin,
          action: "getLeaderboard",
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch leaderboard");

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setLeaderboardData({
        renown: data.renown || [],
        coins: data.coins || [],
        totalTaps: data.totalTaps || [],
        guilds: data.guilds || [],
      });
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    }
  };

  fetchLeaderboard();
  const interval = setInterval(fetchLeaderboard, 5000);
  return () => clearInterval(interval);
}, [userId, pin, activeTab]);

const renderLeaderboard = () => (
  <>
    <div className={`${glassStyle} bg-gradient-to-br from-[#e0e7ff]/70 to-white/40 rounded-3xl px-2 py-8 sm:p-8 ${buttonGlow} shadow-2xl max-w-2xl mx-auto relative`}>

      {/* Title */}
      <div className="flex flex-col items-center mb-6">
        <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-indigo-800 via-purple-600 to-pink-500 drop-shadow tracking-wider mb-1">
          Leaderboard
        </h2>
        <span className="uppercase tracking-wide text-xs font-bold text-[#8577aa]/60 letter-spacing-tight">Global Rankings</span>
      </div>

      {/* Select leaderboard type */}
      <div className="flex justify-center mb-6">
        <select
          value={leaderboardType}
          onChange={(e) => setLeaderboardType(e.target.value)}
          className="rounded-xl px-5 py-2 bg-white/60 font-semibold text-indigo-800 border border-white/30 shadow focus:outline-none focus:ring-2 focus:ring-indigo-200 transition w-full max-w-xs"
        >
          <option value="renown">🏆 Most Renown Tokens</option>
          <option value="coins">🪙 Most Coins Earned</option>
          <option value="totalTaps">👆 Most Taps</option>
          <option value="guilds">🛡️ Top Guild Scores</option>
        </select>
      </div>

      {/* Top 3 podium */}
      {leaderboardData[leaderboardType].length > 2 && (
        <div className="flex justify-center gap-4 mb-10 mt-4">
          {[1, 0, 2].map((podiumIdx, pos) => {
            const entry = leaderboardData[leaderboardType][podiumIdx];
            if (!entry) return <div className="w-20" key={podiumIdx} />;
            const iconObj = PROFILE_ICONS.find((ic) => ic.id === entry.profile_icon);
            const isGuild = leaderboardType === "guilds";
            const crown = pos === 1 ? "👑" : pos === 0 ? "🥈" : "🥉";
            const podiumColors = [
              "bg-gradient-to-br from-[#e5e7eb] to-[#c7d2fe]",
              "bg-gradient-to-br from-[#fef08a] via-[#fca5a5] to-[#e879f9]",
              "bg-gradient-to-br from-[#a7f3d0] to-[#fef9c3]",
            ];

            return (
              <div
                key={podiumIdx}
                className={`flex flex-col items-center px-2 ${pos === 1 ? "scale-110 z-10" : "scale-100 z-0"} transition-transform`}
              >
                <div className={`w-20 h-20 rounded-full shadow-xl border-4 border-white ${podiumColors[pos]} flex items-center justify-center`}>
                  {isGuild ? (
                    <i className={`fas fa-${entry.guild_icon || "users"} text-3xl text-indigo-900`} title={entry.guild_name} />
                  ) : iconObj ? (
                    iconObj.image ? (
                      <img
                        src={iconObj.image}
                        alt={iconObj.name}
                        className="w-16 h-16 rounded-full object-cover"
                        title={iconObj.name}
                      />
                    ) : (
                      <span className="text-4xl">{iconObj.emoji}</span>
                    )
                  ) : (
                    <i className="fas fa-user-circle text-gray-400 text-4xl"></i>
                  )}
                </div>
                <span className={`mt-2 text-2xl font-bold ${pos === 1 ? "text-yellow-500" : pos === 0 ? "text-gray-400" : "text-orange-400"}`}>
                  {crown}
                </span>
                <span className="mt-1 text-center font-bold text-indigo-900 text-base truncate max-w-[80px]">
                  {isGuild
                    ? entry.guild_name
                    : entry.profile_name || "Player"}
                </span>
                <span className="text-xs text-white-400">{isGuild ? null : `(${entry.user_id})`}</span>
                <span className="font-bold text-purple-700 text-sm mt-1">
                  {leaderboardType === "renown"
                    ? `${entry.renown_tokens} ⭐`
                    : leaderboardType === "coins"
                    ? `${formatNumberShort(Math.floor(entry.total_coins_earned))}🪙`
                    : leaderboardType === "totalTaps"
                    ? `${formatNumberShort(entry.total_taps || 0)}👆`
                    : leaderboardType === "guilds"
                    ? `${formatNumberShort(entry.guild_score || 0)} pts`
                    : ""}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Main List */}
      <div className="space-y-3">
        {leaderboardData[leaderboardType].map((entry, index) => {
          const iconObj = PROFILE_ICONS.find((ic) => ic.id === entry.profile_icon);
          const isPodium = index <= 2;
          const isGuild = leaderboardType === "guilds";
          const highlight =
            index === 0
              ? "bg-gradient-to-br from-yellow-200/80 to-yellow-100/30"
              : index === 1
              ? "bg-gradient-to-br from-gray-200/80 to-gray-100/30"
              : index === 2
              ? "bg-gradient-to-br from-orange-100/80 to-yellow-50/30"
              : "bg-white/10";
          const border =
            index === 0
              ? "border-yellow-400"
              : index === 1
              ? "border-gray-400"
              : index === 2
              ? "border-orange-300"
              : "border-transparent";
          const rankStr = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`;

          return (
            <div
              key={isGuild ? (entry.guild_id || entry.guild_name) : entry.user_id}
              className={`flex justify-between items-center rounded-xl px-4 py-3 shadow-md border ${highlight} ${border} ${isPodium ? "ring-2 ring-purple-200" : ""} transition`}
              style={{ filter: isPodium ? "brightness(1.12)" : "none" }}
            >
              <div className="flex items-center min-w-0 gap-3">
                <span className={`font-bold text-lg min-w-[40px] text-center ${isPodium ? "text-purple-700" : "text-gray-500"}`}>{rankStr}</span>
                {isGuild ? (
                  <i
                    className={`fas fa-${entry.guild_icon || "users"} text-indigo-700 text-xl`}
                    title={entry.guild_name}
                  />
                ) : iconObj ? (
                  iconObj.image ? (
                    <img
                      src={iconObj.image}
                      alt={iconObj.name}
                      className="w-9 h-9 rounded-full object-cover"
                      title={iconObj.name}
                    />
                  ) : (
                    <span className="text-2xl" title={iconObj.name}>{iconObj.emoji}</span>
                  )
                ) : (
                  <i className="fas fa-user-circle text-gray-400 text-2xl"></i>
                )}
                <div className="flex flex-col min-w-0">
                  <span className={`font-semibold ${isPodium ? "text-indigo-900" : "text-[#2d3748]"}`}>
                    {isGuild ? entry.guild_name : entry.profile_name || "Player"}
                  </span>
                  {isGuild ? null : (
                    <span className="text-xs text-white-400 truncate">{entry.user_id}</span>
                  )}
                </div>
              </div>
              <span className="font-bold text-right text-indigo-900 text-lg sm:text-xl">
                {leaderboardType === "renown"
                  ? `${entry.renown_tokens} ⭐`
                  : leaderboardType === "coins"
                  ? `${formatNumberShort(Math.floor(entry.total_coins_earned))}🪙`
                  : leaderboardType === "totalTaps"
                  ? `${formatNumberShort(entry.total_taps || 0)}👆`
                  : leaderboardType === "guilds"
                  ? `${formatNumberShort(entry.guild_score || 0)} pts`
                  : ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
     
  </>
);



 const renderShopTab = () => {
  const discountRate = 0.1; // 10% discount

  // Shop tabs
  const tabs = [
    { id: "themes", label: "Themes" },
    { id: "boosts", label: "Boosts" },
    { id: "profileIcons", label: "Icons" },
    { id: "limited", label: "Limited" },
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

  // --- NEW THEMES ---
  {
    id: "pogoda_day",
    name: "Pogoda (Day)",
    emoji: CUSTOM_THEMES.pogoda_day.icon,
    price: 55,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "pogoda_night",
    name: "Pogoda (Night)",
    emoji: CUSTOM_THEMES.pogoda_night.icon,
    price: 95,
    currency: "renownTokens",
    isLimited: true,
    stock: limitedStock["pogoda_night"] ?? 5,
  },
  {
    id: "zen_garden",
    name: "Zen Garden",
    emoji: CUSTOM_THEMES.zen_garden.icon,
    price: 30,
    currency: "renownTokens",
    isLimited: false,
  },
  {
    id: "aurora_borealis",
    name: "Aurora Borealis",
    emoji: CUSTOM_THEMES.aurora_borealis.icon,
    price: 120,
    currency: "renownTokens",
    isLimited: true,
    stock: limitedStock["aurora_borealis"] ?? 3,
  },
];

  const ownedIcons = gameState.ownedProfileIcons || [];
  const equippedIcon = gameState.profileIcon || null;
  const ownedThemes = gameState.ownedThemes || ["seasons"];
  const equippedTheme = gameState.equippedTheme || "seasons";
  const ownedBoosts = gameState.ownedBoosts || [];
  const canAfford = (price) => (gameState.renownTokens || 0) >= price;

  // ---- SHOP CONTENT TABS ----
  let tabContent = null;

  // THEMES TAB
  if (shopView === "themes") {
    const normalThemes = SHOP_THEMES.filter((t) => !t.isLimited);
    tabContent = (
      <div>
        <h3 className="text-2xl font-bold mb-6 text-center text-yellow-600 tracking-wide drop-shadow">Themes</h3>
        <div className="grid grid-cols-1 gap-4">
          {normalThemes.map((theme) => {
            const owned = ownedThemes.includes(theme.id);
            const equipped = equippedTheme === theme.id;
            const discountedPrice = Math.ceil(theme.price * (1 - discountRate));
            const afford = canAfford(discountedPrice);
            return (
              <div
                key={theme.id}
                className={`flex items-center justify-between bg-gradient-to-r from-white/70 via-yellow-50 to-white/60 border border-yellow-100 rounded-2xl p-4 shadow-md`}
              >
                <div className="flex items-center space-x-4">
                  <span className="text-4xl">{theme.emoji}</span>
                  <div>
                    <div className="font-bold text-lg text-yellow-800">{theme.name}</div>
                    <div className="text-xs flex items-center space-x-2 mt-1">
                      {theme.price > 0 && (
                        <>
                          <span className="line-through text-gray-400">{theme.price} ⭐</span>
                          <span className="bg-yellow-200 text-yellow-900 px-1.5 rounded font-bold">10% OFF</span>
                        </>
                      )}
                      <span className="font-bold text-yellow-700">{discountedPrice} ⭐</span>
                    </div>
                  </div>
                </div>
                <div>
                  {!owned ? (
                    <button
                      className={`px-5 py-2 rounded-lg font-bold shadow 
                        ${afford ? "bg-green-500 hover:bg-green-600 text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed"}
                        transition`}
                      disabled={!afford}
                      onClick={() => handleBuyTheme({ ...theme, price: discountedPrice })}
                    >
                      Buy
                    </button>
                  ) : equipped ? (
                    <span className="px-5 py-2 rounded-lg bg-green-400 text-white font-bold shadow">Equipped</span>
                  ) : (
                    <button
                      className="px-5 py-2 rounded-lg bg-blue-400 text-white font-bold shadow hover:bg-blue-500 transition"
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

  // BOOSTS TAB
  else if (shopView === "boosts") {
    const normalBoosts = BOOSTS.filter((b) => !b.isLimited);
    tabContent = (
      <div>
        <h3 className="text-2xl font-bold mb-6 text-center text-red-500 tracking-wide drop-shadow">Boosts</h3>
        <div className="grid grid-cols-1 gap-4">
          {normalBoosts.length === 0 && (
            <div className="text-center text-gray-400 py-10">Keep your eyes peeled!</div>
          )}
          {normalBoosts.map((boost) => {
            const owned = ownedBoosts.includes(boost.id);
            const alreadyActive = activeShopBoosts.some((b) => b.id === boost.id);
            const discountedPrice = Math.ceil(boost.price * (1 - discountRate));
            const afford = canAfford(discountedPrice);
            return (
              <div
                key={boost.id}
                className={`flex items-center justify-between bg-gradient-to-r from-white/70 via-red-50 to-white/60 border border-red-100 rounded-2xl p-4 shadow-md`}
              >
                <div>
                  <div className="font-bold text-lg text-red-700">{boost.name}</div>
                  <div className="text-xs flex items-center space-x-2 mt-1">
                    {boost.price > 0 && (
                      <>
                        <span className="line-through text-gray-400">{boost.price} ⭐</span>
                        <span className="bg-red-200 text-red-900 px-1.5 rounded font-bold">10% OFF</span>
                      </>
                    )}
                    <span className="font-bold text-red-500">{discountedPrice} ⭐</span>
                  </div>
                </div>
                <div>
                  <button
                    className={`px-5 py-2 rounded-lg font-bold shadow 
                      ${afford && !alreadyActive ? "bg-green-500 hover:bg-green-600 text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed"}
                      transition`}
                    disabled={!afford || alreadyActive}
                    onClick={() => {
                      if (!afford) {
                        setNotification("Not enough Renown Tokens!");
                        return;
                      }
                      if (navigator.vibrate) navigator.vibrate(50);
                      setGameState((prev) => ({
                        ...prev,
                        renownTokens: prev.renownTokens - discountedPrice,
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

  // PROFILE ICONS TAB
  else if (shopView === "profileIcons") {
    const normalIcons = PROFILE_ICONS.filter((i) => !i.isLimited);
    tabContent = (
      <div>
        <h3 className="text-2xl font-bold mb-6 text-center text-green-600 tracking-wide drop-shadow">Profile Icons</h3>
        <div className="grid grid-cols-1 gap-4">
          {normalIcons.length === 0 && (
            <div className="text-center text-gray-400 py-10">Keep your eyes peeled!</div>
          )}
          {normalIcons.map((icon) => {
            const owned = ownedIcons.includes(icon.id);
            const equipped = equippedIcon === icon.id;
            const discountedPrice = Math.ceil(icon.price * (1 - discountRate));
            const afford = canAfford(discountedPrice);
            return (
              <div
                key={icon.id}
                className={`flex items-center justify-between bg-gradient-to-r from-white/70 via-green-50 to-white/60 border border-green-100 rounded-2xl p-4 shadow-md`}
              >
                <div className="flex items-center space-x-4">
                  <span className="text-4xl">{icon.emoji}</span>
                  <div>
                    <div className="text-xs flex items-center space-x-2 mt-1">
                      {icon.price > 0 && (
                        <>
                          <span className="line-through text-gray-400">{icon.price} ⭐</span>
                          <span className="bg-green-200 text-green-900 px-1.5 rounded font-bold">10% OFF</span>
                        </>
                      )}
                      <span className="font-bold text-green-600">{discountedPrice} ⭐</span>
                    </div>
                  </div>
                </div>
                <div>
                  {!owned ? (
                    <button
                      className={`px-5 py-2 rounded-lg font-bold shadow 
                        ${afford ? "bg-green-500 hover:bg-green-600 text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed"}
                        transition`}
                      disabled={!afford}
                      onClick={() => handleBuyIcon({ ...icon, price: discountedPrice })}
                    >
                      Buy
                    </button>
                  ) : equipped ? (
                    <span className="px-5 py-2 rounded-lg bg-green-400 text-white font-bold shadow">Equipped</span>
                  ) : (
                    <button
                      className="px-5 py-2 rounded-lg bg-blue-400 text-white font-bold shadow hover:bg-blue-500 transition"
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

  // LIMITED TAB
  else if (shopView === "limited") {
    const limitedIcons = PROFILE_ICONS.filter((i) => i.isLimited);
    const limitedThemes = SHOP_THEMES.filter((t) => t.isLimited);
    const limitedBoosts = BOOSTS.filter((b) => b.isLimited);

    tabContent = (
      <div className="flex flex-col space-y-10">
        {/* Limited Profile Icons */}
        <div>
          <h3 className="text-xl font-bold mb-3 text-center text-yellow-600">Limited Profile Icons</h3>
          {limitedIcons.length === 0 ? (
            <div className="text-center text-gray-400 py-8">No limited profile icons yet.</div>
          ) : (
            limitedIcons.map((icon) => {
              const owned = ownedIcons.includes(icon.id);
              const equipped = equippedIcon === icon.id;
              const discountedPrice = Math.ceil(icon.price * (1 - discountRate));
              const afford = canAfford(discountedPrice);
              const stock = limitedStock[icon.id] ?? 0;
              const outOfStock = stock <= 0;
              const isImageIcon = !!icon.image;

              return (
                <div
                  key={icon.id}
                  className="flex items-center justify-between bg-gradient-to-r from-yellow-50 via-white/70 to-yellow-100 border-2 border-yellow-400 rounded-2xl p-4 shadow-lg mb-2"
                >
                  <div className="flex items-center space-x-4">
                    {/* Emoji or Image */}
                    {isImageIcon ? (
                      <img
                        src={icon.image}
                        alt=""
                        className="w-12 h-12 rounded-full object-cover border border-yellow-400"
                      />
                    ) : (
                      <span className="text-4xl">{icon.emoji}</span>
                    )}

                    <div>
                      <div className="text-sm text-yellow-900 font-semibold">{icon.name}</div>
                      <div className="text-xs flex items-center space-x-2 mt-1">
                        {icon.price > 0 && (
                          <>
                            <span className="line-through text-gray-400">{icon.price} ⭐</span>
                            <span className="bg-yellow-200 text-yellow-900 px-1.5 rounded font-bold">10% OFF</span>
                          </>
                        )}
                        <span className="font-bold text-yellow-600">{discountedPrice} ⭐</span>
                        <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full
                          ${outOfStock ? "bg-red-200 text-red-700" : "bg-green-200 text-green-800"}
                        `}>
                          {stock} left
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    {!owned ? (
                      <button
                        className={`px-5 py-2 rounded-lg font-bold shadow 
                          ${afford && !outOfStock ? "bg-green-500 hover:bg-green-600 text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed"}
                          transition`}
                        disabled={!afford || outOfStock}
                        onClick={() =>
                          buyLimitedItem({ itemId: icon.id, itemType: "profileIcon", price: discountedPrice })
                        }
                      >
                        {outOfStock ? "Out of Stock" : "Buy"}
                      </button>
                    ) : equipped ? (
                      <span className="px-5 py-2 rounded-lg bg-green-400 text-white font-bold shadow">Equipped</span>
                    ) : (
                      <button
                        className="px-5 py-2 rounded-lg bg-blue-400 text-white font-bold shadow hover:bg-blue-500 transition"
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
          <h3 className="text-xl font-bold mb-3 text-center text-yellow-600">Limited Themes</h3>
          {limitedThemes.length === 0 ? (
            <div className="text-center text-gray-400 py-8">No limited themes yet.</div>
          ) : (
            limitedThemes.map((theme) => {
              const owned = ownedThemes.includes(theme.id);
              const equipped = equippedTheme === theme.id;
              const discountedPrice = Math.ceil(theme.price * (1 - discountRate));
              const afford = canAfford(discountedPrice);
              const stock = limitedStock[theme.id] ?? 0;
              const outOfStock = stock <= 0;
              return (
                <div
                  key={theme.id}
                  className="flex items-center justify-between bg-gradient-to-r from-yellow-50 via-white/70 to-yellow-100 border-2 border-yellow-400 rounded-2xl p-4 shadow-lg mb-2"
                >
                  <div className="flex items-center space-x-4">
                    <span className="text-4xl">{theme.emoji}</span>
                    <div>
                      <div className="font-semibold text-lg text-yellow-800">{theme.name}</div>
                      <div className="text-xs flex items-center space-x-2 mt-1">
                        {theme.price > 0 && (
                          <>
                            <span className="line-through text-gray-400">{theme.price} ⭐</span>
                            <span className="bg-yellow-200 text-yellow-900 px-1.5 rounded font-bold">10% OFF</span>
                          </>
                        )}
                        <span className="font-bold text-yellow-600">{discountedPrice} ⭐</span>
                        <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full
                          ${outOfStock ? "bg-red-200 text-red-700" : "bg-green-200 text-green-800"}
                        `}>
                          {stock} left
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    {!owned ? (
                      <button
                        className={`px-5 py-2 rounded-lg font-bold shadow 
                          ${afford && !outOfStock ? "bg-green-500 hover:bg-green-600 text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed"}
                          transition`}
                        disabled={!afford || outOfStock}
                        onClick={() =>
                          buyLimitedItem({ itemId: theme.id, itemType: "theme", price: discountedPrice })
                        }
                      >
                        {outOfStock ? "Out of Stock" : "Buy"}
                      </button>
                    ) : equipped ? (
                      <span className="px-5 py-2 rounded-lg bg-green-400 text-white font-bold shadow">Equipped</span>
                    ) : (
                      <button
                        className="px-5 py-2 rounded-lg bg-blue-400 text-white font-bold shadow hover:bg-blue-500 transition"
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

        {/* Limited Boosts */}
        <div>
          <h3 className="text-xl font-bold mb-3 text-center text-red-600">Limited Boosts</h3>
          {limitedBoosts.length === 0 ? (
            <div className="text-center text-gray-400 py-8">No limited boosts yet.</div>
          ) : (
            limitedBoosts.map((boost) => {
              const discountedPrice = Math.ceil(boost.price * (1 - discountRate));
              const afford = canAfford(discountedPrice);
              const stock = limitedStock[boost.id] ?? 0;
              const outOfStock = stock <= 0;
              const alreadyActive = activeShopBoosts.some((b) => b.id === boost.id);
              const owned = ownedBoosts.includes(boost.id);

              return (
                <div
                  key={boost.id}
                  className="flex items-center justify-between bg-gradient-to-r from-yellow-50 via-white/70 to-yellow-100 border-2 border-yellow-400 rounded-2xl p-4 shadow-lg mb-2"
                >
                  <div>
                    <div className="font-bold text-lg text-red-800">{boost.name}</div>
                    <div className="text-xs flex items-center space-x-2 mt-1">
                      {boost.price > 0 && (
                        <>
                          <span className="line-through text-gray-400">{boost.price} ⭐</span>
                          <span className="bg-yellow-200 text-yellow-900 px-1.5 rounded font-bold">10% OFF</span>
                        </>
                      )}
                      <span className="font-bold text-yellow-600">{discountedPrice} ⭐</span>
                      <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full
                        ${outOfStock ? "bg-red-200 text-red-700" : "bg-green-200 text-green-800"}
                      `}>
                        {stock} left
                      </span>
                    </div>
                  </div>
                  <div>
                    {!owned ? (
                      <button
                        className={`px-5 py-2 rounded-lg font-bold shadow 
                          ${afford && !outOfStock ? "bg-green-500 hover:bg-green-600 text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed"}
                          transition`}
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
                            renownTokens: prev.renownTokens - discountedPrice,
                          }));
                          equipShopBoost(boost);
                        }}
                      >
                        {outOfStock ? "Out of Stock" : "Buy"}
                      </button>
                    ) : alreadyActive ? (
                      <button
                        className="px-5 py-2 rounded-lg bg-gray-500 text-white font-bold shadow"
                        onClick={() => unequipShopBoost(boost.id)}
                      >
                        Unequip
                      </button>
                    ) : (
                      <button
                        className="px-5 py-2 rounded-lg bg-blue-400 text-white font-bold shadow hover:bg-blue-500 transition"
                        onClick={() => equipShopBoost(boost)}
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

  // INVENTORY TAB
  else if (shopView === "inventory") {
    tabContent = (
      <div>
        <h3 className="text-xl font-bold mb-6 text-yellow-500 text-center">Inventory</h3>
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
                    className={`flex items-center justify-between rounded-xl px-3 py-2 cursor-pointer border transition-all
                      ${theme.isLimited ? "border-yellow-400 bg-yellow-100" : "border-gray-200 bg-white"}
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
                    <span className="text-2xl mr-2">{theme.emoji || "🎨"}</span>
                    <span className="font-medium">{theme.name || theme.id}</span>
                    {theme.isLimited && (
                      <span className="text-yellow-500 font-bold ml-2">★</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          {/* Profile Icons */}
          <div>
            <h4 className="font-semibold mb-2 text-green-500">Icons</h4>
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
                    className={`flex items-center rounded-xl px-3 py-2 cursor-pointer border w-full min-w-0 transition-all
                      ${icon.isLimited ? "border-yellow-400 bg-yellow-100" : "border-gray-200 bg-white"}
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
                      <span className="text-yellow-500 font-bold ml-2">★</span>
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

  // DEFAULT / EMPTY FALLBACK
  else {
    tabContent = (
      <div className="text-center text-gray-400 py-10">Keep your eyes peeled!</div>
    );
  }

  // -------- MAIN SHOP RETURN ---------
  return (
    <div className="relative max-w-2xl mx-auto mt-8 px-2 sm:px-0">
      {/* Weather */}
      <div className="flex flex-col items-center justify-center mb-6">
        <div className="text-lg font-bold mb-1 text-purple-800">
          Weather:{" "}
          {typeof gameState.currentWeather === "string"
            ? gameState.currentWeather
            : "Clear"}
        </div>
        <div className="text-sm text-red-500 mb-3">{weatherDescription}</div>
      </div>

      {/* Active Boosts */}
      <div className="flex flex-wrap gap-2 mb-6 justify-center">
        {activeShopBoosts.map((b) => (
          <div
            key={b.id}
            className="px-4 py-1 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold shadow-md text-sm flex items-center"
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

      {/* Coins + Renown Display */}
      <div className="flex justify-center gap-4 mb-8">
        <div className={`${glassStyle} bg-white/40 rounded-2xl p-5 border border-white/40 flex flex-col items-center w-36`}>
          <span className="text-4xl">🪙</span>
          <span className="text-xl font-bold mt-1 text-yellow-400">{formatNumberShort(Math.floor(gameState.coins))}</span>
          <span className="text-xs text-yellow-500 mt-1 font-semibold">Coins</span>
        </div>
        <div className={`${glassStyle} bg-white/40 rounded-2xl p-5 border border-white/40 flex flex-col items-center w-36`}>
          <span className="text-4xl">⭐</span>
          <span className="text-xl font-bold mt-1 text-pink-400">{Math.floor(gameState.renownTokens)}</span>
          <span className="text-xs text-pink-500 mt-1 font-semibold">Renown</span>
        </div>
      </div>

      {/* SHOP CONTAINER */}
      <div className={`${glassStyle} bg-gradient-to-br from-white/90 via-purple-100/90 to-white/90 rounded-3xl p-8 shadow-2xl border border-white/30 relative`}>
        {/* Inventory Button */}
        <button
          onClick={() => setShopView("inventory")}
          className="absolute right-6 top-6 p-2 rounded-full bg-white/60 border border-white/30 shadow hover:scale-110 transition z-20 text-2xl"
          title="View Inventory"
        >
          🎒
        </button>

        <h2 className="text-3xl font-bold text-purple-800 text-center mb-8 tracking-wide drop-shadow">Shop</h2>

        {/* Shop Tabs */}
        <div className="flex justify-center gap-3 mb-7 overflow-x-auto scrollbar-thin pb-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setShopView(t.id)}
              className={`px-6 py-2 rounded-xl font-bold shadow border border-white/30 bg-white/30 text-purple-700 backdrop-blur
                ${shopView === t.id ? "ring-2 ring-purple-300 bg-purple-100/70 text-purple-900" : "hover:bg-white/40"}
                transition whitespace-nowrap`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div
          className="overflow-y-auto scrollbar-thin scrollbar-thumb-purple-200"
          style={{
            minHeight: "40vh",
            maxHeight: "55vh",
            paddingRight: "4px",
          }}
        >
          {tabContent}
        </div>
      </div>

      {/* AdBanner */}
      <div className="mt-8">
         
      </div>
    </div>
  );
};


 const renderProfileTab = () => {
  // Find the icon object for the currently equipped icon
  const equippedIconObj =
    PROFILE_ICONS.find((ic) => ic.id === gameState.profileIcon) || null;

  return (
    <div className={`${glassStyle} bg-gradient-to-br from-white/80 via-purple-100/80 to-white/70 rounded-3xl p-7 ${buttonGlow} shadow-2xl border border-white/20 backdrop-blur-xl max-w-lg mx-auto space-y-8`}>
      {/* Heading */}
      <h2 className="text-3xl font-crimson-text text-center text-[#4527A0] drop-shadow tracking-wider mb-4">
        Profile
      </h2>

      {/* Profile Icon */}
      <div className="flex flex-col items-center">
        {equippedIconObj ? (
          equippedIconObj.image ? (
            <img
              src={equippedIconObj.image}
              alt={equippedIconObj.name}
              className="w-28 h-28 rounded-full object-cover mb-2 shadow-lg border-4 border-purple-200"
              title={equippedIconObj.name}
            />
          ) : (
            <span className="text-[5.5rem] mb-2 drop-shadow" title={equippedIconObj.name}>
              {equippedIconObj.emoji}
            </span>
          )
        ) : (
          <i className="fas fa-user-circle text-gray-300 text-[5.5rem] mb-2 drop-shadow"></i>
        )}
      </div>

      {/* Editable Name */}
      <div className="w-full max-w-xs mx-auto">
        <label className="block text-purple-800 font-bold mb-2 tracking-wide text-lg">Name</label>
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
          className="w-full px-4 py-3 rounded-xl border-2 border-purple-200 bg-white/70 backdrop-blur-sm text-[#2d3748] font-semibold shadow focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
          placeholder="Enter your name"
        />
      </div>

      {/* Save Button */}
      <div className="flex flex-col items-center space-y-6 mt-4 w-full max-w-xs mx-auto">
        <button
          onClick={() => {
            saveGame({ ...gameState });
            setNotification("Profile saved!");
          }}
          className="w-full px-8 py-3 rounded-xl bg-gradient-to-r from-green-400 via-green-500 to-green-600 text-white font-extrabold shadow-xl hover:shadow-2xl active:scale-95 transition"
        >
          Save
        </button>

        {/* Change Pin & Hard Reset Side by Side */}
        <div className="flex gap-4 w-full">
          <button
            onClick={() => {
              setPinErrorMessage("");
              setPinSuccessMessage("");
              setCurrentPinInput("");
              setNewPinInput("");
              setConfirmPinInput("");
              setShowChangePinModal(true);
            }}
            className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 text-white font-bold shadow hover:bg-purple-500 transition active:scale-95"
          >
            Change Pin
          </button>
          <button
            onClick={() => setShowHardResetModal(true)}
            className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-red-400 via-red-500 to-red-600 text-white font-bold shadow hover:bg-red-500 transition active:scale-95"
          >
            HARD RESET
          </button>
        </div>
      </div>
      <div className="mt-8">
         
      </div>
    </div>
  );
};


  const renderResetTab = () => {
    const tokensToEarn = getTokensFromCoins(gameState.coinsEarnedThisRun || 0);
    const canReset = tokensToEarn > 0;
    const currentMultiplier = gameState.permanentMultiplier || 1;
    const newMultiplier = currentMultiplier + tokensToEarn * 0.015;

    return (
      <div className="space-y-6 p-4">
        {/* Title */}
        <div className="text-center text-lg text-[#939599] mb-6">
          Reset your progress to gain Renown Tokens!
        </div>

        {/* Current Renown Tokens */}
        <p className="text-center text-md font-semibold text-[#2d3748]">
          <strong>Current Renown Tokens:</strong>{" "}
          <span className="text-green-600">{gameState.renownTokens || 0}</span>
        </p>

        {/* Explanation */}
        <p className="text-center text-sm text-[#939599] max-w-md mx-auto">
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
        <div className="text-center text-[#939599] mt-4">
          <strong>Your current multiplier:</strong>{" "}
          {currentMultiplier.toFixed(2)}x
        </div>

        {/* Show new multiplier after reset */}
        {canReset && (
          <div className="text-center text-[#939599] mt-1">
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
    <div className={`${glassStyle} bg-gradient-to-br from-white/60 via-purple-100/50 to-white/30 rounded-3xl p-7 ${buttonGlow} shadow-2xl border border-white/20 backdrop-blur-xl max-w-lg mx-auto`}>
      {/* DAILY BONUS */}
      <div className="my-7 flex flex-col items-center">
        {bonusCooldown === 0 ? (
          <button
            onClick={claimDailyBonus}
            className="px-8 py-3 rounded-2xl bg-gradient-to-r from-green-400 via-green-500 to-green-700 text-white font-bold shadow-xl hover:shadow-2xl active:scale-95 transition"
          >
            <span role="img" aria-label="gift">🎁</span> Claim Daily Bonus!
          </button>
        ) : (
          <span className="text-sm text-gray-500 font-medium bg-white/80 px-4 py-2 rounded-full shadow">
            Next bonus in {Math.ceil(bonusCooldown / 1000 / 60 / 60)} hour{Math.ceil(bonusCooldown / 1000 / 60 / 60) !== 1 && "s"}
          </span>
        )}
      </div>

      <div className={`${glassStyle} bg-white/80 rounded-2xl p-6 ${buttonGlow} shadow-inner`}>
        {/* House Name + Rename */}
        <div className="relative mb-6 flex flex-col items-center">
          <h2 className="text-2xl font-extrabold text-center text-[#512DA8] tracking-wide drop-shadow-sm">
            {gameState.houseName || "My Cozy Home"}
          </h2>
          <button
            onClick={() => {
              setNewHouseName(gameState.houseName || "");
              setShowHouseRenameModal(true);
            }}
            aria-label="Rename house"
            className="absolute right-0 top-1/2 transform -translate-y-1/2 flex items-center justify-center w-10 h-10 bg-purple-100/80 rounded-xl hover:bg-purple-200 transition-colors border border-purple-200 shadow"
          >
            <i className="fas fa-edit text-purple-700"></i>
          </button>
        </div>

        {/* Level + Multiplier */}
        <div className="flex gap-5 mb-6">
          <div className="flex-1 bg-white/60 rounded-xl p-4 text-center border border-purple-100 shadow">
            <div className="text-md font-bold text-purple-900 tracking-wide">Level</div>
            <div className="text-3xl font-extrabold text-purple-700">{gameState.houseLevel}</div>
          </div>
          <div className="flex-1 bg-white/60 rounded-xl p-4 text-center border border-purple-100 shadow">
            <div className="text-md font-bold text-purple-900 tracking-wide">Coin Multiplier</div>
            <div className="text-2xl font-extrabold text-purple-700">{(gameState.houseCoinsMultiplier * 100).toFixed(1)}%</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-5">
          <div className="w-full bg-gray-300/60 rounded-full h-4 shadow-inner overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#c7d2fe] via-[#a5b4fc] to-[#059669] shadow transition-all duration-600"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs mt-1 text-[#939599] font-semibold">
            <span>{Math.floor(gameState.coins).toLocaleString()}</span>
            <span>/</span>
            <span>{nextUpgradeCost.toLocaleString()} coins</span>
          </div>
        </div>

        {/* Upgrade Button */}
        <div className="flex justify-center w-full mt-5">
          <button
            onClick={() => {
              if (!canAfford) return;
              playUpgrade();
              if (navigator.vibrate) navigator.vibrate(50);
              setGameState((prev) => {
                const newHouseLevel = prev.houseLevel + 1;
                const updatedState = {
                  ...prev,
                  coins: prev.coins - nextUpgradeCost,
                  houseLevel: newHouseLevel,
                  highest_house_level:
                    newHouseLevel > (prev.highest_house_level || 0)
                      ? newHouseLevel
                      : prev.highest_house_level || 0,
                  houseCoinsMultiplier: 1.0 + newHouseLevel * 0.1,
                };
                saveGame(updatedState);
                return updatedState;
              });
              setNotification("House Upgraded!");
            }}
            disabled={!canAfford}
            className={`
              w-full max-w-xs py-4 rounded-2xl font-extrabold text-lg flex items-center justify-center gap-3 shadow-lg transition-all duration-300
              ${canAfford
                ? "bg-gradient-to-r from-[#7C3AED] via-[#10B981] to-[#059669] text-white hover:shadow-2xl hover:scale-105"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"}
            `}
          >
            <i className="fas fa-home" style={{ fontSize: "1.3em" }} aria-hidden="true" />
            <span>
              {canAfford
                ? "Upgrade House (Ready!)"
                : `Upgrade House (${formatNumberShort(nextUpgradeCost)} coins)`}
            </span>
          </button>
        </div>

        {/* Referral/Gift Code */}
        <div className="mt-8 mb-2 p-5 bg-gradient-to-br from-purple-100/60 via-purple-50/80 to-white/80 rounded-2xl shadow flex flex-col items-center w-full max-w-xs mx-auto border border-purple-200">
          <div className="text-lg font-bold text-purple-700 mb-2 tracking-wide">
            Enter Gift/Referral Code
          </div>
          <div className="flex w-full gap-2">
            <input
              type="text"
              value={referralInput}
              onChange={(e) => setReferralInput(e.target.value)}
              className="flex-1 w-0 px-3 py-2 rounded-xl border border-purple-300 text-[#2d3748] focus:ring-2 focus:ring-[#a78bfa] bg-white/90 font-semibold"
              placeholder="Enter code"
              maxLength={32}
              disabled={referralUsed}
            />
            <button
              className="flex-shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-[#a78bfa] to-[#7c3aed] text-white font-bold disabled:opacity-50 transition"
              onClick={handleReferralSubmit}
              disabled={!referralInput || referralUsed}
            >
              Confirm
            </button>
          </div>
          {referralMessage && (
            <div
              className={`mt-2 text-center font-bold ${
                referralMessageType === "success"
                  ? "text-green-600"
                  : "text-red-500"
              }`}
            >
              {referralMessage}
            </div>
          )}
        </div>
        {/* Ad Banner (below box) */}
        <div className="mt-6">
           
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
              className="w-full px-4 py-2 rounded-xl bg-white/40 border border-white/30 text-[#2d3748] placeholder-[#939599]/50 focus:outline-none focus:ring-2 focus:ring-purple-300"
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
              className="px-4 py-2 rounded-lg text-[#939599] hover:bg-white/20 transition-all duration-200"
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
  className={`relative min-h-screen transition-colors duration-1000 pb-25
    ${gameState.currentWeather === "Sun" ? "sun-bright" : ""}
    ${gameState.currentWeather === "Windy" ? "windy-shake" : ""}
  `}
  style={
    gameState.equippedTheme &&
    gameState.equippedTheme !== "seasons" &&
    CUSTOM_THEMES[gameState.equippedTheme]?.image
      ? {
          backgroundImage: `url(${CUSTOM_THEMES[gameState.equippedTheme].image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }
      : SEASONAL_THEMES[gameState.currentSeason]?.image
      ? {
          backgroundImage: `url(${SEASONAL_THEMES[gameState.currentSeason].image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }
      : { background: "linear-gradient(to bottom, #fff, #eee)" }
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
        <h2 className="text-xl font-bold mb-4 text-[#2d3748]">Send Feedback</h2>
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
                    setNotification("Feedback must be at least 5 characters long");
                    return;
                  }
                  try {
                    const response = await fetch("/api/submit-feedback/", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        userId: Number(userId),
                        feedback: feedbackText.trim(),
                      }),
                    });
                    const data = await response.json();
                    if (data.success) {
                      setFeedbackSent(true);
                      setNotification("Thank you for your feedback!");
                      setTimeout(() => {
                        setShowFeedback(false);
                        setFeedbackSent(false);
                        setFeedbackText("");
                      }, 1500);
                    } else {
                      throw new Error(data.error || "Failed to submit feedback");
                    }
                  } catch (error) {
                    setNotification(
                      error.message || "Failed to submit feedback. Please try again."
                    );
                  }
                }}
                style={{
                  background: "linear-gradient(90deg, #c4b5fdcc 0%, #a78bfacc 100%)",
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
{/* Hamburger Icon, fixed top right */}
<div className="fixed top-4 right-4 z-50">
  <button
    onClick={() => setSidebarOpen(true)}
    className="w-12 h-12 rounded-full flex items-center justify-center bg-white/30 shadow-xl border border-white/40 backdrop-blur-lg hover:scale-110 transition-all"
    aria-label="Open Menu"
  >
    <i className="fas fa-bars text-2xl text-[#2d3748]"></i>
  </button>
</div>

{/* Sidebar (always rendered for slide animation) */}
<div>
  {/* Overlay backdrop */}
  <div
    className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300
      ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
    `}
    onClick={() => setSidebarOpen(false)}
    aria-label="Close Sidebar"
  />

  {/* Slide-in Sidebar */}
  <aside
    className={`
      fixed top-0 right-0 h-full w-[85vw] max-w-xs z-50 flex
      transition-transform duration-300
      ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
    `}
    style={{ boxShadow: "0 10px 60px 16px rgba(41,13,72,0.38)" }}
  >
   {/* LEFT VERTICAL ICON BAR */}
<div className="flex flex-col items-center gap-2 py-8 px-2 bg-gradient-to-b from-purple-900/60 via-purple-800/40 to-purple-900/50 border-r border-white/20 min-w-[56px] relative">
  {/* Icons */}
  <button
    onClick={() => {
      localStorage.removeItem("userId");
      localStorage.removeItem("pin");
      setSidebarOpen(false);
      window.location.href = "/login";
    }}
    className="w-10 h-10 flex items-center justify-center rounded-xl border border-white/30 bg-white/10 hover:bg-white/20 text-[#f4f4f4] transition"
    title="Logout"
    aria-label="Logout"
  >
    <i className="fas fa-sign-out-alt text-lg"></i>
  </button>
  <button
    onClick={() => { setShowFeedback(true); setSidebarOpen(false); }}
    className="w-10 h-10 flex items-center justify-center rounded-xl border border-white/30 bg-white/10 hover:bg-white/20 text-[#f4f4f4] transition"
    title="Feedback"
    aria-label="Feedback"
  >
    <i className="fas fa-comment-alt text-lg"></i>
  </button>
  <button
    onClick={() => { setMuted((m) => !m); setSidebarOpen(false); }}
    className="w-10 h-10 flex items-center justify-center rounded-xl border border-white/30 bg-white/10 hover:bg-white/20 text-[#f4f4f4] transition"
    aria-label={muted ? "Unmute sounds" : "Mute sounds"}
    title={muted ? "Unmute" : "Mute"}
  >
    <i className={`fas ${muted ? "fa-volume-mute" : "fa-volume-up"} text-lg`}></i>
  </button>
  <button
    onClick={() => {
      setSidebarOpen(false);
      window.location.href = "/help";
    }}
    className="w-10 h-10 flex items-center justify-center rounded-xl border border-white/30 bg-white/10 hover:bg-white/20 text-[#f4f4f4] transition"
    title="Help"
    aria-label="Help"
  >
    <i className="fas fa-question text-lg"></i>
  </button>

  {/* Divider */}
  <div className="h-6" />

  {/* Instagram */}
  <a
    href="https://instagram.com/taptapstudiosuk"
    target="_blank"
    rel="noopener noreferrer"
    className="w-10 h-10 flex items-center justify-center rounded-xl border border-white/30 bg-gradient-to-br from-pink-500 via-yellow-400 to-purple-600 hover:bg-white/20 text-white transition"
    title="Instagram"
    aria-label="Instagram"
  >
    <i className="fab fa-instagram text-lg"></i>
  </a>

  {/* Discord */}
  <a
    href="https://discord.gg/e5jVsxCt"
    target="_blank"
    rel="noopener noreferrer"
    className="w-10 h-10 flex items-center justify-center rounded-xl border border-white/30 bg-gradient-to-br from-indigo-500 to-indigo-700 hover:bg-white/20 text-white transition"
    title="Discord"
    aria-label="Discord"
  >
    <i className="fab fa-discord text-lg"></i>
  </a>
</div>


    {/* MAIN SIDEBAR AREA */}
    <div className="flex-1 flex flex-col items-center py-8 px-6 bg-gradient-to-br from-purple-800/95 via-purple-600/95 to-purple-900/90 backdrop-blur-xl overflow-y-auto relative">
         {/* LOGO - centered */}
<div className="flex flex-col items-center mt-2 mb-4">
  <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-white flex items-center justify-center bg-black">
    <img
      src="https://ucarecdn.com/af9e3e7b-6303-4643-afbe-61d3a28941ff/-/format/auto/"
      alt="Tap Tap Two Logo"
      className="h-full w-full object-cover"
      style={{ display: "block" }}
    />
  </div>
  <span className="text-xs text-white font-medium tracking-wide mt-1" style={{ letterSpacing: "0.03em" }}>
    an andysocial game
  </span>
</div>

      
      {/* Weather Widget - TOP of sidebar main area */}
      <div className="flex items-center gap-3 bg-white/10 border border-white/30 rounded-xl px-4 py-2 mb-4 w-full max-w-xs">
        {/* Icon */}
        <span className="text-3xl">{getWeatherIcon(gameState.currentWeather)}</span>
        {/* Weather name/desc */}
        <div>
          <div className="font-semibold text-white text-base">
            {CUSTOM_THEME_WEATHER_RENAMES[gameState.equippedTheme]?.[gameState.currentWeather] ||
              gameState.currentWeather || "Clear"}
          </div>
          <div className="text-xs text-white opacity-80 mt-0.5">{weatherDescription}</div>
        </div>
      </div>
      
      {/* Close X */}
      <button
        onClick={() => setSidebarOpen(false)}
        className="absolute top-4 right-5 w-10 h-10 flex items-center justify-center rounded-full bg-white/30 hover:bg-white/60 text-[#2d3748] shadow"
        aria-label="Close Menu"
        style={{ zIndex: 100 }}
      >
        <i className="fas fa-times text-2xl"></i>
      </button>
      {/* Maddox Button */}
      <button
        onClick={() => { setShowMaddoxModal(true); setSidebarOpen(false); }}
        className="relative flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-[#1e293b] to-[#dc2626] shadow-xl hover:scale-110 transition-all border-2 border-[#dc2626] mb-3"
        aria-label="Maddox Promo"
      >
        <img
          src="https://ucarecdn.com/7eaeaf25-2192-4082-a415-dd52f360d379/-/format/auto/"
          alt="Maddox Logo"
          className="w-7 h-7 rounded-full object-contain"
        />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center border-2 border-white shadow">
          <span className="text-xs font-bold text-white" style={{ lineHeight: "1" }}>
            !
          </span>
        </span>
      </button>
      {/* Menu Buttons, ORDERED */}
      <div className="w-full flex flex-col items-center gap-3 mt-2">
        {/* Game */}
        <button
          onClick={() => { setActiveTab("tap"); setSidebarOpen(false); }}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/30 bg-white/10 hover:bg-white/20 text-white transition font-medium"
        >
          <i className="fas fa-gamepad"></i>
          <span>Tap</span>
        </button>
        {/* Battle */}
        <a
          href="/battle"
          onClick={() => setSidebarOpen(false)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/30 bg-white/10 hover:bg-white/20 text-white transition font-medium"
        >
          <i className="fas fa-crosshairs"></i>
          <span>Battle</span>
        </a>
        {/* Boss */}
<a
  href="/boss"
  onClick={() => setSidebarOpen(false)}
  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-red-500/50 bg-red-700/30 hover:bg-red-700/40 text-white transition font-medium mt-2"
>
  <i className="fas fa-dragon"></i>
  <span>Boss</span>
  <span className="ml-2 px-2 py-0.5 text-xs rounded bg-red-600 text-white font-bold">NEW</span>
</a>
        {/* Reset */}
        <button
          onClick={() => { setShowResetModal(true); setSidebarOpen(false); }}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/30 bg-white/10 hover:bg-white/20 text-white transition font-medium relative"
        >
          <i className="fas fa-sync-alt"></i>
          <span>Reset</span>
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
              backgroundColor: "#4f46e5",
              transform: "translate(50%, -50%)",
              zIndex: 20,
            }}
          >
            {getTokensFromCoins(gameState.coinsEarnedThisRun || 0)}
          </span>
        </button>
        {/* House */}
        <button
          onClick={() => { setActiveTab("house"); setSidebarOpen(false); }}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/30 bg-white/10 hover:bg-white/20 text-white transition font-medium"
        >
          <i className="fas fa-home"></i>
          <span>House</span>
        </button>
        {/* Friends */}
        <button
          onClick={() => { setActiveTab("friends"); setSidebarOpen(false); }}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/30 bg-white/10 hover:bg-white/20 text-white transition font-medium"
        >
          <i className="fas fa-users"></i>
          <span>Friends</span>
        </button>
        {/* Profile */}
        <button
          onClick={() => { setActiveTab("profile"); setSidebarOpen(false); }}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/30 bg-white/10 hover:bg-white/20 text-white transition font-medium"
        >
          <i className="fas fa-user"></i>
          <span>Profile</span>
        </button>
        {/* --- ANY OTHER (unknown) tabs/buttons should go here --- */}
        {/* Leaderboard */}
        <button
          onClick={() => { setActiveTab("leaderboard"); setSidebarOpen(false); }}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/30 bg-white/10 hover:bg-white/20 text-white transition font-medium"
        >
          <i className="fas fa-trophy"></i>
          <span>Leaderboard</span>
        </button>
        {/* Notice Board */}
        <a
          href="/notice-board"
          onClick={() => setSidebarOpen(false)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/30 bg-white/10 hover:bg-white/20 text-white transition font-medium"
        >
          <i className="fas fa-bullhorn"></i>
          <span>Notice Board</span>
        </a>
        {/* Shop */}
        <button
          onClick={() => { setActiveTab("shop"); setSidebarOpen(false); }}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/30 bg-white/10 hover:bg-white/20 text-white transition font-medium"
        >
          <i className="fas fa-store"></i>
          <span>Shop</span>
        </button>
        
        {/* A2HS Tip Message */}
        <div className="mt-6 px-4 py-3 text-[11px] leading-snug text-white/70 bg-white/10 border-t border-white/20 w-full max-w-xs rounded-xl shadow-inner text-center">
          <p className="mb-1">
            <span className="font-bold text-white">iPhone:</span> Tap <span className="italic">"Share"</span>, scroll down, then <span className="italic">“Add to Home Screen”</span>.
          </p>
          <p>
            <span className="font-bold text-white">Android:</span> Tap <span className="italic">"⋮ Menu"</span>, then <span className="italic">"Add to Home screen"</span>.
          </p>
        </div>
     <a
  href="/privacy"
  className="text-xs text-gray-400 italic cursor-pointer hover:underline"
>
  Privacy Policy
</a>

      </div>
    </div>
  </aside>
</div>



  {["tap", "house", "leaderboard"].includes(activeTab) && (
  <div className="text-center">
    <h2 className="text-3xl mb-5 font-crimson-text text-purple-700 drop-shadow tracking-wide">
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

    <div
      className="grid grid-cols-3 max-w-xs mx-auto mt-6 mb-10 gap-3
        bg-gradient-to-br from-white/70 via-purple-100/60 to-purple-200/40
        border border-white/50 shadow-xl rounded-2xl p-3
        backdrop-blur"
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
          className="flex flex-col items-center justify-center rounded-xl px-2 py-2
            bg-white/50 border border-white/70 shadow
            transition hover:scale-105 hover:bg-purple-200/80
            backdrop-blur"
        >
          <span className="text-2xl select-none drop-shadow">{icon}</span>
          <p className="text-md font-bold mt-0.5 text-[#403258]">{formatNumberShort(value)}</p>
        </div>
      ))}
    </div>
  </div>
)}

<div className="max-w-md mx-auto">
  {activeTab === "tap" ? (
    <div className="flex flex-col items-center justify-center space-y-6">
      {/* Main Tap Button (Unchanged) */}
      <div className="relative">
        <button
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(50);
            const storedUserId = localStorage.getItem("userId");
            const storedPin = localStorage.getItem("pin");
            if (!storedUserId || !storedPin) {
              window.location.href = "/login";
              return;
            }
            handleTap();
          }}
          className={`
            tappable-main-btn group relative w-[220px] h-[220px] rounded-full flex items-center justify-center
            border-[6px] border-white/30
            bg-gradient-to-br from-white/80 via-white/60 to-gray-300/90
            shadow-xl
            overflow-hidden
            transition-transform active:scale-95
            hover:shadow-[0_20px_50px_10px_rgba(80,80,180,0.28)]
            outline-none focus-visible:ring-4 focus-visible:ring-purple-400
            select-none
          `}
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          {/* Spinning Energy Ring */}
          <span className={`
            tappable-spin absolute z-0 inset-0 rounded-full pointer-events-none
            ${
              gameState.equippedTheme && gameState.equippedTheme !== "seasons"
                ? CUSTOM_THEMES[gameState.equippedTheme]?.buttonGlow
                : SEASONAL_THEMES[gameState.currentSeason].buttonGlow
            }
            opacity-30 border-4 border-transparent ring-8 ring-[rgba(140,120,255,0.10)]
          `} />
          {/* Inner Glass Rim */}
          <span className="absolute z-10 inset-4 rounded-full bg-white/40 border-2 border-white/50 blur-[2px] opacity-70 pointer-events-none"/>
          {/* Gloss Highlight */}
          <span className="absolute z-20 top-8 left-10 w-32 h-16 rounded-full bg-white/70 blur-xl opacity-25 pointer-events-none group-hover:opacity-50 transition-opacity"/>
          {/* Shine Sweep */}
          <span className="absolute z-30 inset-0 rounded-full pointer-events-none">
            <span className="tappable-shine" />
          </span>
          {/* Center Icon */}
          <span className="relative z-40 flex items-center justify-center select-none">
            {gameState.equippedTheme && gameState.equippedTheme !== "seasons" ? (
              <span className="text-7xl drop-shadow-lg group-active:scale-110 transition-transform duration-150">
                {CUSTOM_THEMES[gameState.equippedTheme]?.icon || "❓"}
              </span>
            ) : (
              <i
                className={`fas ${SEASONAL_THEMES[gameState.currentSeason].icon} text-7xl ${
                  gameState.currentSeason === 0
                    ? "text-green-400"
                    : gameState.currentSeason === 1
                    ? "text-yellow-400"
                    : gameState.currentSeason === 2
                    ? "text-orange-400"
                    : "text-blue-400"
                } drop-shadow-lg group-active:scale-110 transition-transform duration-150`}
              />
            )}
          </span>
          {/* Button rim shadow */}
          <span className="absolute z-0 inset-0 rounded-full shadow-[0_0_32px_14px_rgba(80,80,140,0.14)] pointer-events-none"/>
          {/* 3D bottom edge */}
          <span className="absolute bottom-0 left-0 right-0 h-10 rounded-b-full bg-gradient-to-t from-gray-300/70 to-transparent z-10 pointer-events-none"/>
        </button>
        {hasBoost && (
          <div className="absolute -top-2 -right-2 bg-pink-500 text-white rounded-full px-2 py-1 text-xs shadow-lg">
            {Math.floor(boostTimeLeft / 60)}:{(boostTimeLeft % 60).toString().padStart(2, "0")}
          </div>
        )}
      </div>
      {/* Quest Box */}
      {!hasBoost && currentQuest && (
        <div className="w-full rounded-2xl p-6 mb-1
            bg-gradient-to-br from-white/80 via-purple-100/70 to-fuchsia-100/50
            border border-fuchsia-200/50 shadow-xl
            backdrop-blur
            flex flex-col items-center"
        >
          <h2 className="text-xl text-fuchsia-700 mb-2 font-bold flex items-center gap-2">
            <span role="img" aria-label="gift">🎁</span> Quest
          </h2>
          <div className="text-[#7c539f] mb-3 text-center font-medium">{currentQuest.description}</div>
          <div className="flex items-center justify-center gap-2 mb-3 w-full">
            {/* Progress Bar */}
            <div className="flex-1">
              {(() => {
                const questTemplate = QUEST_TEMPLATES.find((q) => q.id === currentQuest.id);
                let progress = 0;
                if (questTemplate && currentQuest.targetAmount !== undefined) {
                  if (questTemplate.id === "combined_level") {
                    const combined =
                      (gameState.tapPowerUpgrades || 0) +
                      (gameState.autoTapperUpgrades || 0) +
                      (gameState.critChanceUpgrades || 0) +
                      (gameState.tapSpeedBonusUpgrades || 0);
                    progress = Math.min(
                      ((combined - currentQuest.startCombined) / currentQuest.targetAmount) * 100,
                      100
                    );
                  } else if (questTemplate.id === "earn_coins") {
                    const earned = gameState.totalCoinsEarned - currentQuest.startCoins;
                    progress = Math.min((earned / currentQuest.targetAmount) * 100, 100);
                  } else if (questTemplate.id === "upgrade_house") {
                    const upgradesDone = gameState.houseLevel - currentQuest.startLevel;
                    progress = Math.max(Math.min((upgradesDone / currentQuest.targetAmount) * 100, 100), 0);
                  } else if (currentQuest.startLevel !== undefined) {
                    let level = 0;
                    if (questTemplate.id === "upgrade_tap_power") {
                      level = gameState.tapPowerUpgrades || 0;
                    } else if (questTemplate.id === "upgrade_auto_tapper") {
                      level = gameState.autoTapperUpgrades || 0;
                    } else if (questTemplate.id === "upgrade_crit_chance") {
                      level = gameState.critChanceUpgrades || 0;
                    } else if (questTemplate.id === "upgrade_tap_speed") {
                      level =
                        gameState.tapSpeedBonusUpgrades || gameState.tap_speed_bonus_upgrades || 0;
                    }
                    progress = Math.min(((level - currentQuest.startLevel) / currentQuest.targetAmount) * 100, 100);
                  }
                }
                progress = Math.max(progress, 0);
                return (
                  <div className="w-full h-3 bg-white/30 border border-purple-100 rounded-full overflow-hidden relative shadow-sm">
                    <div
                      className="h-full bg-gradient-to-r from-fuchsia-400 via-purple-400 to-purple-600 transition-all duration-300"
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
                localStorage.setItem("currentQuest", JSON.stringify(newQuest));
                saveGame({
                  ...gameState,
                  currentQuest: newQuest,
                  canClaimQuest: false,
                });
                setNotification("Quest refreshed!");
              }}
              aria-label="Refresh Quest"
              title="Refresh Quest"
              className="ml-2 flex items-center justify-center bg-white/60 hover:bg-white border border-fuchsia-100 rounded-full p-2 transition shadow"
              style={{
                fontSize: "1.25rem",
                width: "32px",
                height: "32px",
                minWidth: "32px",
                minHeight: "32px",
              }}
            >
              <i className="fas fa-sync-alt text-purple-400"></i>
            </button>
          </div>
          {/* Claim button only if complete */}
          {canClaimQuest && (
            <button
              onClick={claimQuestReward}
              className="px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow hover:shadow-xl transition-all duration-200 mt-2"
            >
              Claim 10x Boost!
            </button>
          )}
        </div>
      )}
      {/* Upgrades Box */}
      <div className={`w-full rounded-2xl p-6 bg-gradient-to-br from-purple-100/70 via-white/60 to-fuchsia-100/60 border border-purple-200/30 shadow-2xl ${buttonGlow} backdrop-blur-md`}>
        <h2 className="text-2xl font-crimson-text mb-4 text-center text-purple-900 drop-shadow">
          Upgrades
        </h2>
        <div className="text-center text-sm text-purple-600 font-semibold mb-4">
          Combined Upgrade Level: <span className="font-bold">{combinedLevel}</span>
        </div>
        <div className="flex gap-2 mb-4 justify-center">
          {[1, 10, 100, "Max"].map((val) => (
            <button
              key={val}
              onClick={() => setUpgradeMultiplier(val === "Max" ? "Max" : val)}
              className={`px-3 py-1 rounded font-bold
                ${
                  upgradeMultiplier === val
                    ? "bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white shadow"
                    : "bg-purple-100/80 text-purple-700 hover:bg-purple-200"
                }
                transition`}
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
                ? getMaxAffordableUpgrades(type, upgradeLevel, gameState.coins)
                : upgradeMultiplier;
            const totalCost = getTotalUpgradeCost(type, upgradeLevel, multiplier);
            const canAfford = gameState.coins >= totalCost;
            const currentValueRaw = gameState[type] || 0;
            const roundedValue =
              type === "critChance"
                ? currentValueRaw
                : Math.round(currentValueRaw * 10) / 10;
            const currentValueShort = formatNumberShort(roundedValue);
            const currentValueFormatted =
              type === "critChance" ? `${currentValueShort}%` : currentValueShort;
            return (
              <div
                key={type}
                className={`rounded-xl p-4 bg-white/30 border border-purple-200/40 shadow-md flex flex-col space-y-2 items-center backdrop-blur`}
              >
                <div className="flex justify-between items-center w-full">
                  <h3 className="font-semibold text-lg text-purple-900 flex items-center">
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
                        setTooltipVisibleFor((prev) => (prev === type ? null : type))
                      }
                      aria-label={`Info about ${type}`}
                      className="ml-2 text-purple-400 hover:text-purple-700 focus:outline-none"
                      style={{ fontSize: "0.9rem" }}
                    >
                      <i className="fas fa-info-circle" />
                    </button>
                    {tooltipVisibleFor === type && <Tooltip text={UPGRADE_DESCRIPTIONS[type]} />}
                  </h3>
                  <span className="text-sm text-purple-400 font-semibold">
                    Level {upgradeLevel + 1}
                  </span>
                </div>
                <p className="text-sm text-purple-700">Current: {currentValueFormatted}</p>
                <button
                  onClick={() => handleUpgrade(type, multiplier)}
                  disabled={!canAfford}
                  className={`w-full px-4 py-2 rounded-xl font-semibold transition
                    ${
                      canAfford
                        ? "bg-gradient-to-r from-purple-500 via-fuchsia-500 to-purple-700 text-white hover:scale-105 shadow"
                        : "bg-gray-200/70 text-gray-400 cursor-not-allowed"
                    }`}
                >
                  {`Buy${multiplier > 1 ? ` x${multiplier}` : ""} (${formatNumberShort(totalCost)})`}
                </button>
              </div>
            );
          })}
          
        {/* ✅ ONE Ad below all upgrades */}
        <div className="mt-6 flex justify-center">
           
        </div>
          
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
  ) : (activeTab === "friends" || activeTab === "guilds") ? (
    renderFriendsTab({ friends, guild, inviteToGuild })
  ) : null}
</div>
</div>

{showResetModal && renderResetModal()}
{showHouseRenameModal && renderHouseRenameModal()}
{showOfflineEarnings && pendingOfflineEarnings && (
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
      <h3 className="text-xl font-medium text-[#2d3748] mb-4">Offline Earnings!</h3>
      <p className="mb-4 text-lg text-[#939599] text-center">
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
            totalCoinsEarned: gameState.totalCoinsEarned + pendingOfflineEarnings.coins,
          };
          setGameState(newState);
          setPendingOfflineEarnings(null);
          setShowOfflineEarnings(false);
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
      <h2 className="text-xl font-semibold text-white mb-4 text-center">ARE YOU SURE?</h2>
      <p className="text-white text-center mb-6 font-semibold">
        THIS IS PERMANENT AND CANNOT BE UNDONE.
      </p>

      {hardResetError && (
        <div className="text-red-400 mb-4 text-center">{hardResetError}</div>
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
      <h2 className="text-xl font-semibold text-white mb-4">Change Pin</h2>

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
        <div className="text-green-300 mb-2 text-sm">{pinSuccessMessage}</div>
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
              setPinErrorMessage("New pin must be at least 4 characters.");
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
                setPin(newPinInput);
                localStorage.setItem("pin", newPinInput);
                setTimeout(() => {
                  setShowChangePinModal(false);
                  setCurrentPinInput("");
                  setNewPinInput("");
                  setConfirmPinInput("");
                  setPinErrorMessage("");
                  setPinSuccessMessage("");
                }, 1200);
              } else {
                setPinErrorMessage(data.error || "Incorrect current pin.");
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
      <h2 className="text-2xl mb-2 font-bold text-white drop-shadow">Daily Bonus!</h2>
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
      <h2 className="text-xl font-bold mb-1 text-[#dc2626]">Announcement!</h2>
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
          <span className="bg-yellow-200 px-2 py-1 rounded text-[#eab308]">maddox</span>{" "}
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
        SEASON_FLASH_DARK_COLOURS[gameState.currentSeason] || "rgba(0,0,0,0.35)",
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
    rgba(200, 200, 200, 0.35) 0%,
    rgba(180, 180, 180, 0.4) 100%
  );
  backdrop-filter: blur(3px);
  opacity: 0.3;
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

  /* Spinning energy ring */
  .tappable-spin {
    animation: spin 7s linear infinite;
  }
  @keyframes spin {
    100% { transform: rotate(360deg); }
  }

  /* Shine Sweep Animation */
  .tappable-shine {
    position: absolute;
    left: 0; top: 0; width: 100%; height: 100%;
    border-radius: 9999px;
    pointer-events: none;
    background: linear-gradient(80deg, rgba(255,255,255,0.85) 15%, rgba(255,255,255,0.1) 70%, transparent 100%);
    opacity: 0;
    animation: shine-move 2.1s cubic-bezier(0.4,0,0.2,1) infinite;
  }
  @keyframes shine-move {
    0%   { opacity: 0; transform: translateX(-60%) scale(1.1);}
    10%  { opacity: 0.65; }
    40%  { opacity: 0.8; transform: translateX(60%) scale(1.08);}
    100% { opacity: 0; transform: translateX(110%) scale(1.04);}
  }


      `}</style>
    </div>
  );
}

export default MainComponent;
