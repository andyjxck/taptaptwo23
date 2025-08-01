'use client';
import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/utilities/supabaseClient";
export const revalidate = 0;
export const dynamic = "force-client";
import useSound from "use-sound"; // 👈 add this line
import { logPageview } from "@/utilities/logPageview";



function MainComponent() {


  // Game phases: 'start', 'lobby', 'ready', 'playing', 'finished'
  const [countdown, setCountdown] = React.useState(null); // null means no countdown active
  const [gamePhase, setGamePhase] = React.useState("start");
  const [timeLeft, setTimeLeft] = React.useState(180);
  const [gameDuration, setGameDuration] = React.useState(180);

  const [playerScore, setPlayerScore] = React.useState(0);
  const [opponentScore, setOpponentScore] = React.useState(0);
  const [totalTaps, setTotalTaps] = React.useState(0);
  const [showRules, setShowRules] = React.useState(false);
  const [gameMode, setGameMode] = React.useState(""); // 'ai' or 'multiplayer'
  const [aiDifficulty, setAiDifficulty] = React.useState("medium");
  const [playerName, setPlayerName] = React.useState("");
  const [opponentId, setOpponentId] = React.useState(null);
  const [userId, setUserId] = React.useState(null);
  const [profileName, setProfileName] = React.useState("");
  const [profileIcon, setProfileIcon] = React.useState("");
  const [allTimeTotalTaps, setAllTimeTotalTaps] = React.useState(0);
  const [renownTokens, setRenownTokens] = React.useState(0);
  const [renownAwarded, setRenownAwarded] = React.useState(false);
  const [totalTapsInGame, setTotalTapsInGame] = React.useState(0);
   const [muted, setMuted] = useState(false);
  const [playClick] = useSound("/sounds/click.wav", { volume: muted ? 0 : 0.4 });
const [playUpgrade] = useSound("/sounds/upgrade.wav", { volume: muted ? 0 : 0.4 });
// AI coins state (start low)
  const [activeTab, setActiveTab] = useState("join");
const [aiCoins, setAiCoins] = React.useState(0);
 const [isPlayerReady, setIsPlayerReady] = React.useState(false);
  const [isOpponentReady, setIsOpponentReady] = React.useState(false);

  // Player upgrades
  const [tapPower, setTapPower] = React.useState(1);
  const [tapPowerLevel, setTapPowerLevel] = React.useState(1);
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [upgradesPurchased, setUpgradesPurchased] = React.useState(0);
  const [floatingNumbers, setFloatingNumbers] = React.useState([]);

  // Profile data

  // Logo state
  const [logoUrl, setLogoUrl] = React.useState("");
  const [logoLoading, setLogoLoading] = React.useState(false);
  // Room and player management
  const [roomCode, setRoomCode] = React.useState("");
  const [currentRoom, setCurrentRoom] = React.useState("");
  const [opponentName, setOpponentName] = React.useState("Opponent");
  const timeLeftRef = useRef(timeLeft);
React.useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);

// AI upgrades levels (start low)
const [aiTapPower, setAiTapPower] = React.useState(1);
const [aiTapPowerLevel, setAiTapPowerLevel] = React.useState(1);
const aiCoinsRef = React.useRef(aiCoins);
  const aiTapPowerRef = React.useRef(aiTapPower);
  const aiTapPowerLevelRef = useRef(aiTapPowerLevel);
React.useEffect(() => { aiCoinsRef.current = aiCoins; }, [aiCoins]);
React.useEffect(() => { aiTapPowerRef.current = aiTapPower; }, [aiTapPower]);
  React.useEffect(() => { aiTapPowerLevelRef.current = aiTapPowerLevel; }, [aiTapPowerLevel]);
const updateAIStatsInDB = async ({
  roomCode,
  ai_coins,
  ai_tap_power,
  ai_tap_power_level,
  player_score,
  userId,
}) => {
  try {
    const res = await fetch('/api/battle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'updateAIStats',
        code: roomCode,
        ai_coins,
        ai_tap_power,
        ai_tap_power_level,
        player_score,
        userId,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error('Failed to update AI stats:', errorData.error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error updating AI stats:', err);
    return false;
  }
};

    const totalScore =
  playerScore + (gameMode === "ai" ? (aiCoins || 0) : (opponentScore || 0)) || 1;

const playerPercent = Math.round((playerScore / totalScore) * 100);
const opponentPercent = 100 - playerPercent;
  
// 🔁 Track player score and tap power via refs
const playerScoreRef = useRef(playerScore);
useEffect(() => {
  playerScoreRef.current = playerScore;
}, [playerScore]);

const tapPowerRef = useRef(tapPowerLevel);
useEffect(() => {
  tapPowerRef.current = tapPowerLevel;
}, [tapPowerLevel]);

React.useEffect(() => {
  const shouldRun =
    gamePhase === "playing" &&
    gameMode === "ai" &&
    !!currentRoom &&
    !!aiDifficulty;

  if (!shouldRun) return;

  console.log("✅ AI upgrade interval started");

  const upgradeInterval =
    aiDifficulty === "hard" ? 1750 :
    aiDifficulty === "medium" ? 2500 :
    3400;

  const upgradeTimer = setInterval(async () => {
    const currentTimeLeft = timeLeftRef.current;
    if (currentTimeLeft <= 5) {
      console.log("⏳ Skipping upgrades: under 5 seconds left");
      return;
    }

    // 🎯 Current values
    let coins = aiCoinsRef.current;
    let tapPower = aiTapPowerRef.current;
    let tapPowerLvl = aiTapPowerLevelRef.current;

    const playerTapPower = tapPowerRef.current || 1;
    const playerCoins = playerScoreRef.current || 0;

    const scoreGap = playerCoins - coins;

    // 🪃 CATCH-UP BOOST SECTION
    const gapThreshold = 10_000;
    if (scoreGap > gapThreshold) {
      const severity = scoreGap / gapThreshold; // e.g. 3x threshold = 3.0
      const boostFactor = Math.min(Math.log10(severity + 1), 2.5); // Log scale cap

      const extraCoins = Math.floor(boostFactor * scoreGap * 0.4);  // ⚖️ Tweak multiplier
      const extraPower = Math.floor(boostFactor * 8);               // ⚖️ Tweak multiplier

      console.log(`🪃 AI BOOST: +${extraCoins} coins, +${extraPower} tap power`);

      coins += extraCoins;
      tapPower += extraPower;

      setAiCoins(coins);
      setAiTapPower(tapPower);
      setOpponentScore(coins);

      aiCoinsRef.current = coins;
      aiTapPowerRef.current = tapPower;

      try {
        await updateAIStatsInDB({
          roomCode: currentRoom,
          ai_coins: coins,
          ai_tap_power: tapPower,
          ai_tap_power_level: tapPowerLvl,
          player_score: playerCoins,
          userId,
        });
        console.log("✅ AI boost synced");
      } catch (err) {
        console.error("❌ Boost sync failed", err);
      }

      return; // ✅ Skip normal upgrade after a boost
    }

    // 🧠 NORMAL UPGRADE LOGIC
    const shouldUpgrade = tapPower <= playerTapPower || coins < playerCoins;
    if (!shouldUpgrade) {
      console.log("🟡 AI strong enough — no upgrade");
      return;
    }

    console.log("🔧 AI upgrading...");
    console.log({ coins, tapPower, tapPowerLvl, playerTapPower, playerCoins });

    let newCoins = coins;
    let newTapPower = tapPower;
    let newTapPowerLvl = tapPowerLvl;
    let upgradesBought = 0;

    while (true) {
      const cost = Math.floor(10 * Math.pow(1.3, newTapPowerLvl - 1));
      if (newCoins < cost) break;

      newCoins -= cost;
      newTapPower += Math.floor(newTapPower * 0.16) + 2;
      newTapPowerLvl += 1;
      upgradesBought++;
    }

    if (upgradesBought > 0) {
      console.log(`✅ AI upgraded ${upgradesBought}x to level ${newTapPowerLvl}`);

      setAiCoins(newCoins);
      setAiTapPower(newTapPower);
      setAiTapPowerLevel(newTapPowerLvl);
      setOpponentScore(newCoins);

      aiCoinsRef.current = newCoins;
      aiTapPowerRef.current = newTapPower;
      aiTapPowerLevelRef.current = newTapPowerLvl;

      try {
        await updateAIStatsInDB({
          roomCode: currentRoom,
          ai_coins: newCoins,
          ai_tap_power: newTapPower,
          ai_tap_power_level: newTapPowerLvl,
          player_score: playerCoins,
          userId,
        });
        console.log("✅ AI upgrades synced");
      } catch (err) {
        console.error("❌ Upgrade sync failed", err);
      }
    } else {
      console.log("❌ AI couldn't afford upgrade");
    }
  }, upgradeInterval);

  return () => clearInterval(upgradeTimer);
}, [gamePhase, gameMode, currentRoom, aiDifficulty]);


  React.useEffect(() => {
    let interval;
    if (gamePhase === "playing" && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setGamePhase("finished");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gamePhase, timeLeft]);

  React.useEffect(() => {
  console.log("Current gamePhase:", gamePhase);
}, [gamePhase]);

  
React.useEffect(() => {
  console.log("Current gameMode:", gameMode);
}, [gameMode]);

// Step 1: When game finishes and renown not awarded, update renownTokens and mark awarded
React.useEffect(() => {
  if (gamePhase === "finished" && !renownAwarded) {
    setAllTimeTotalTaps(prev => prev + totalTapsInGame);

    const playerWon = playerScore > opponentScore;
    const tie = playerScore === opponentScore;
    const renownEarned = playerWon ? 10 : tie ? 5 : 3;

    setRenownTokens(prev => prev + renownEarned);
    setRenownAwarded(true);
  }
}, [gamePhase, playerScore, opponentScore, totalTapsInGame, renownAwarded]);

// Step 2: When renownTokens state changes AND renown was awarded, save progress
React.useEffect(() => {
  if (renownAwarded && userId) {
    saveGameProgress(userId);
  }
}, [renownTokens, renownAwarded, userId]);

async function saveGameProgress(currentUserId) {
  try {
    const response = await fetch('/api/battle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'saveProgress',
        userId: currentUserId,
        total_taps: totalTapsInGame,
        renown_tokens: renownTokens, // now updated value
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      console.error('Save failed:', result.error);
    }
  } catch (error) {
    console.error('Save error:', error);
  }
}

const formatTime = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

useEffect(() => {
  if (!currentRoom || !userId) return;

  const channel = supabase
    .channel('room-sync')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'battle_games',
        filter: `room_code=eq.${currentRoom}`,
      },
      async (payload) => {
        const { data, error } = await supabase
          .from('battle_games')
          .select('*')
          .eq('room_code', currentRoom)
          .single();

        if (error || !data) {
          console.error('Failed to fetch room data:', error);
          return;
        }

        const amPlayer1 = data.player1_id === userId;

        setPlayerScore(amPlayer1 ? data.player1_score : data.player2_score);
        setOpponentScore(amPlayer1 ? data.player2_score : data.player1_score);
        setOpponentName(amPlayer1 ? data.player2_name || 'Opponent' : data.player1_name || 'Opponent');
        setOpponentId(amPlayer1 ? data.player2_id : data.player1_id);

        setIsPlayerReady(amPlayer1 ? data.player1_ready : data.player2_ready);
        setIsOpponentReady(amPlayer1 ? data.player2_ready : data.player1_ready);

        // AI state updates
        if (gameMode === 'ai' && amPlayer1) {
          setAiCoins(data.ai_coins || 0);
          setAiTapPower(data.ai_tap_power || 1);
          setAiTapPowerLevel(data.ai_tap_power_level || 1);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [currentRoom, userId, gameMode]);


 

    const startGameTimer = () => {
  setGamePhase("playing"); // Change game phase to playing
  setTimeLeft(180); // Set game time to 3 minutes (in seconds)
};

  
 const loadProfile = async (id) => {
  try {
    const response = await fetch("/api/battle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "fetchProfile",
        userId: parseInt(id, 10),
        profileName: profileName,
        player_score: 0, // ✅ use the actual value
      }),
    });

    console.log("loadProfile called with userId:", id);
    console.log("Fetch response received:", response);

    const data = await response.json().catch(() => null);
    console.log("Parsed JSON data:", data);

    if (!response.ok) {
      console.error(`Fetch failed with status ${response.status}`);
      if (data && data.error) {
        console.error("Backend error message:", data.error);
      } else {
        console.error("No backend error message available.");
      }
      throw new Error(`Fetch failed with status ${response.status}`);
    }

    if (!data.profile) {
      console.error("Backend returned no profile.");
      if (data && data.error) {
        console.error("Backend error message:", data.error);
      }
      return;
    }

    setProfileName(data.profile.profile_name);
    setLogoUrl(data.profile.profile_icon);
    setAllTimeTotalTaps(data.profile.total_taps);
    setRenownTokens(data.profile.renown_tokens);

  useEffect(() => {
  const storedUserId = localStorage.getItem("userId");
  const storedPin = localStorage.getItem("pin");
  if (!storedUserId || !storedPin) {
    window.location.href = "/login";
    return;
  }
  setUserId(storedUserId);
  setPin(storedPin);
  setUserReady(true);

  // --- LOG PAGEVIEW after confirming auth ---
  logPageview({
    userId: parseInt(storedUserId, 10),
    // You can add pagePath: "/your-page" if you want a custom path,
    // otherwise it will use window.location.pathname
    // referrer is auto-detected
  });
}, []);
 
    // --- END ADD ---
  } catch (err) {
    console.error("Profile load failed:", err);
  }
};
  

  // Calculate upgrade costs (1.3x multiplier)
  const getTapPowerCost = () =>
    Math.floor(10 * Math.pow(1.2, tapPowerLevel - 1));
  
  // Generate random room code
  const generateRoomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };
// Batching refs
const scoreBatchRef = React.useRef(0);
const lastAnimationTimeRef = React.useRef(0);

const handleTap = async () => {
  if (gamePhase !== "playing") return;

  const now = Date.now();
  playClick();

  // Animation throttle
  if (now - lastAnimationTimeRef.current > 150) {
    setIsAnimating(true);
    lastAnimationTimeRef.current = now;
    setTimeout(() => setIsAnimating(false), 150);
  }

  // This is the coins you get per tap, always just tapPower now
  const coinsEarned = tapPower;

  // Update local or AI score
  if (gameMode === "ai") {
    setPlayerScore(prev => prev + coinsEarned);
  } else {
    // Batch the score locally
    scoreBatchRef.current += coinsEarned;

    // Send each tap update to server (fire and forget, but with error catch)
    if (currentRoom && userId) {
      try {
        const res = await fetch('/api/battle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'updateTaps',
            code: currentRoom,
            userId: userId,
            taps: coinsEarned,
          }),
        });
        if (!res.ok) {
          const errorText = await res.text();
          console.error("Tap update failed:", errorText);
        }
      } catch (err) {
        console.error('Error sending tap:', err);
      }
    }
  }

  // Update total taps count
  setTotalTapsInGame(prev => prev + 1);

  // Spawn floating number (remove isCrit)
  const id = now + Math.random();
  const angle = Math.random() * 2 * Math.PI;
  const distance = Math.random() * 150 + 50; // 50 to 200px from center
  const x = Math.cos(angle) * distance;
  const y = Math.sin(angle) * distance;

  setFloatingNumbers(prev => [
    ...prev,
    { id, value: coinsEarned, x, y }
  ]);

  setTimeout(() => {
    setFloatingNumbers(prev => prev.filter(num => num.id !== id));
  }, 1000);
};


// Flush batched player score updates every 100ms (only multiplayer mode)
React.useEffect(() => {
  const interval = setInterval(() => {
    if (scoreBatchRef.current > 0) {
      setPlayerScore(prev => prev + scoreBatchRef.current);
      scoreBatchRef.current = 0;
    }
  }, 100);
  return () => clearInterval(interval);
}, []);

  // Upgrade functions
 const upgradeTapPower = () => {
  const cost = getTapPowerCost();
  if (playerScore >= cost) {
    playUpgrade()
    setPlayerScore(prev => prev - cost);
    setTapPower(prev => prev + Math.floor(prev * 0.16) + 2); // +35% +2
    setTapPowerLevel(prev => prev + 1);
    setUpgradesPurchased(prev => prev + 1);
  }
};


  // Game flow functions
const createRoom = async () => {
  if (!userId || !profileName) {
  console.error("Missing userId or profileName", { userId, profileName });
  return;
}

  const newRoomCode = generateRoomCode();

  try {
    const res = await fetch('/api/battle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        userId: userId,
        code: newRoomCode,
        profileName: profileName,   
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error('Failed to create room:', err.error);
      return;
    }

    const data = await res.json();
    setCurrentRoom(data.roomCode || newRoomCode);
    setGameMode('multiplayer');
    setGamePhase('lobby');

    // Set your own player name
    setPlayerName(profileName || `Player ${userId}`);

    // Fetch opponent name (should be empty for new room)
    setOpponentName('Waiting for player...');

  } catch (error) {
    console.error('Error creating room:', error);
  }
};

const joinRoom = async () => {
  if (roomCode.length !== 6) return;

  try {
    const response = await fetch('/api/battle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'join',
        code: roomCode.toUpperCase(),
        userId: userId,
         profileName: profileName,   
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(`Failed to join room: ${data.error || 'Unknown error'}`);
      return;
    }

    setCurrentRoom(roomCode.toUpperCase());
    setGameMode('multiplayer');
    setGamePhase('lobby');

    // Set your own player name
    setPlayerName(profileName || `Player ${userId}`);

    // Now fetch the room info to get opponent name
    await fetchRoomStatus();

  } catch (err) {
    console.error('joinRoom error:', err);
    alert('Error joining room. See console.');
  }
};

const playAI = async () => {
  const generateAIRoomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "AI";
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const newRoomCode = generateAIRoomCode();

  const response = await fetch('/api/battle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'create',
      code: newRoomCode,
      userId: userId,
      profileName: profileName || 'You',
      isAI: true, // optional flag for future
      aiDifficulty: aiDifficulty,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("AI room creation failed:", data?.error);
    return;
  }

  setGameMode("ai");
  setOpponentName(`AI (${aiDifficulty})`);
  setCurrentRoom(newRoomCode);
  setIsOpponentReady(true);
  setIsPlayerReady(true);
  setGamePhase("lobby");
  setPlayerName(profileName || "You");
};


  const toggleReady = async () => {
  if (gameMode === "ai") {
    // No DB update for AI mode, just toggle local state:
    setIsPlayerReady((prev) => !prev);
    
    // If player is ready, start the AI game
    setGamePhase("playing");
    return;
  }

  if (!currentRoom || !userId) return;

  const { data, error } = await supabase
    .from('battle_games')
    .select('*')
    .eq('room_code', currentRoom)
    .single();

  if (error || !data) return console.error(error || 'Room not found');

  const isPlayer1 = data.player1_id === userId;

  const updateData = isPlayer1
    ? { player1_ready: !data.player1_ready }
    : { player2_ready: !data.player2_ready };

  const { error: updateError } = await supabase
    .from('battle_games')
    .update(updateData)
    .eq('room_code', currentRoom);

  if (updateError) console.error(updateError);
};

const startGame = () => {
  setGamePhase("playing");
  setTimeLeft(gameDuration);
  setPlayerScore(0);
  setOpponentScore(0);
  setTotalTapsInGame(0);
  setUpgradesPurchased(0);
  setFloatingNumbers([]);
  setTapPower(1);
  setTapPowerLevel(1);
  // 🧠 Reset AI state
  setAiCoins(0);
  setAiTapPower(1);
  setAiTapPowerLevel(1);
  fetchRoomStatus(); 
};

const resetToStart = () => {
  setGamePhase("start");
  setIsPlayerReady(false);
  setIsOpponentReady(false);
  setPlayerScore(0);
  setOpponentScore(0);
  setTotalTapsInGame(0);
  setTimeLeft(gameDuration);
  setCurrentRoom("");
  setRoomCode("");
  setGameMode("");
  setUpgradesPurchased(0);
  setFloatingNumbers([]);
  setTapPower(1);
  setTapPowerLevel(1);
  // 🧠 Reset AI state
  setAiCoins(0);
  setAiTapPower(1);
  setAiTapPowerLevel(1);
};
  


  
// --- AI TAPPING LOGIC (25% faster) ---
React.useEffect(() => {
  if (gamePhase !== "playing" || gameMode !== "ai") return;

  let intervalId;

  const getRandomInterval = () => {
    if (aiDifficulty === "easy") {
      // Was 200-333ms, now 150-249ms
      return Math.floor(Math.random() * (249 - 150 + 1)) + 150;
    } else if (aiDifficulty === "medium") {
      // Was 143-200ms, now 107-150ms
      return Math.floor(Math.random() * (150 - 107 + 1)) + 107;
    } else {
      // Was 90-125ms, now 67-93ms
      return Math.floor(Math.random() * (93 - 67 + 1)) + 67;
    }
  };

  const scheduleNextTap = () => {
    const tapPower = aiTapPowerRef.current || 1;

    setAiCoins(prev => {
      const newCoins = prev + tapPower;
      setOpponentScore(newCoins);
      return newCoins;
    });

    intervalId = setTimeout(scheduleNextTap, getRandomInterval());
  };

  scheduleNextTap();

  return () => clearTimeout(intervalId);
}, [gamePhase, gameMode, aiDifficulty]);


React.useEffect(() => {
  if (gamePhase === "lobby" && isPlayerReady && isOpponentReady) {
    setCountdown(3); // start countdown at 3 seconds
  }
}, [gamePhase, isPlayerReady, isOpponentReady]);

React.useEffect(() => {
  if (countdown === null) return; // No countdown running, exit early

  if (countdown === 0) {
    // Countdown finished, start the game
    setGamePhase("playing");  // Transition to playing phase
    setTimeLeft(gameDuration); // Set the game timer to the full duration (180 seconds)
    setCountdown(null);         // Clear the countdown state
    startGameTimer();           // Call the function to start the game timer
    return;
  }

  const timerId = setTimeout(() => setCountdown(countdown - 1), 1000); // Decrement countdown every second
  return () => clearTimeout(timerId); // Cleanup the timer on component unmount or when countdown changes
}, [countdown, gameDuration]);


  
const fetchTotalTapsInGame = async (roomCode) => {
  const res = await fetch('/api/battle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'getTapsInGame', code: roomCode }),
  });
  const data = await res.json();
  if (res.ok) {
    setTotalTapsInGame(data.totalTapsInGame || 0);
  } else {
    console.error('Failed to fetch total taps:', data.error);
  }
};

const fetchRoomStatus = async () => {
  if (!currentRoom) return;

  try {
    const res = await fetch('/api/battle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'getRoomStatus',
        code: currentRoom,
      }),
    });

    if (!res.ok) {
      console.error('Failed to fetch room status');
      return;
    }

    const data = await res.json();

    if (data.room) {
      const room = data.room;
      const amPlayer1 = room.player1_id === userId;

      setIsPlayerReady(amPlayer1 ? room.player1_ready : room.player2_ready);
      setIsOpponentReady(amPlayer1 ? room.player2_ready : room.player1_ready);
      setPlayerScore(amPlayer1 ? room.player1_score : room.player2_score);
      setOpponentScore(amPlayer1 ? room.player2_score : room.player1_score);

      setPlayerName(amPlayer1 ? (room.player1_name || `Player ${userId}`) : (room.player2_name || `Player ${userId}`));
      setOpponentName(amPlayer1 ? (room.player2_name || 'Opponent') : (room.player1_name || 'Opponent'));

      if (gameMode === "ai") {
        setAiCoins(room.ai_coins || 0);
        setAiTapPower(room.ai_tap_power || 1);
        setAiTapPowerLevel(room.ai_tap_power_level || 1);
      }
    }
  } catch (err) {
    console.error('Polling error:', err);
  }
};


const TopProfileBar = ({ profileName, userId, profileIcon, renownTokens, allTimeTotalTaps }) => {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  return (
    <div className="z-50 flex flex-col items-center space-y-2 mb-4">
      <div className="text-center">
        <h1 className="text-white text-3xl font-bold tracking-tight">Tap Tap Two</h1>
        <p className="text-white/60 text-sm">an andysocial game</p>
      </div>

      <div
        className="flex items-center space-x-3 px-4 py-2 bg-white/10 rounded-full backdrop-blur-xl border border-white/20 shadow-lg cursor-pointer hover:scale-105 transition-all duration-200"
        onClick={() => setDropdownOpen(!dropdownOpen)}
      >
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
          {profileIcon ? (
            <img src={profileIcon} alt="Profile" className="w-full h-full object-cover rounded-full" />
          ) : (
            <i className="fas fa-user text-white text-sm"></i>
          )}
        </div>
        <div className="text-white text-sm font-semibold">
          {profileName} {userId && `(${userId})`}
        </div>
        <i className={`fas fa-chevron-${dropdownOpen ? "up" : "down"} text-white/70`} />
      </div>

      {dropdownOpen && (
        <div className="mt-2 px-4 py-2 bg-white/10 text-white rounded-xl text-sm space-y-1 border border-white/20 backdrop-blur-xl shadow-xl">
          <div><i className="fas fa-coins text-yellow-400 mr-2"></i>{renownTokens} tokens</div>
          <div><i className="fas fa-hand-pointer text-blue-400 mr-2"></i>{allTimeTotalTaps?.toLocaleString() || 0} taps</div>
        </div>
      )}
    </div>
  );
};

const UpgradeButton = ({
  title,
  level,
  cost,
  description,
  onClick,
  disabled,
  maxLevel,
  position,
  icon,
}) => (
  <div className={`absolute ${position} z-15`}>
    <button
      onClick={onClick}
      disabled={disabled || (maxLevel && level >= maxLevel)}
      className={`
        p-3 rounded-2xl backdrop-blur-xl border border-white/30 shadow-2xl
        ${
          disabled || (maxLevel && level >= maxLevel)
            ? "bg-white/5 text-gray-400 cursor-not-allowed"
            : "bg-white/10 text-white hover:bg-white/20 hover:scale-105 cursor-pointer active:scale-95"
        }
        transition-all duration-300 ease-out
        w-32 sm:w-36 text-center
        hover:shadow-white/20
      `}
      style={{
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <div className="text-xl sm:text-2xl mb-1">{icon}</div>
      <div className="font-bold text-xs sm:text-sm mb-1">{title}</div>
      <div className="text-white/70 text-xs mb-1">Lv.{level}</div>
      <div className="text-yellow-300 text-xs mb-1">{cost}</div>
      <div className="text-white/60 text-xs leading-tight">{description}</div>
      {maxLevel && level >= maxLevel && (
        <div className="text-red-300 text-xs mt-1 font-bold">MAX</div>
      )}
    </button>
  </div>
);

return (
  <div
    className="min-h-screen w-full relative overflow-hidden"
    style={{
      backgroundImage: 'url("https://ucarecdn.com/139b8b80-05c1-4d0b-b975-e374f0b59da1/-/format/auto/")',
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundAttachment: "fixed",
    }}
  >
    {/* ===== START PHASE ===== */}
    {gamePhase === "start" && (
      <>
        {/* Background Blurs */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          />
          <div
            className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          />
        </div>

        <div className="p-4 pt-6 flex flex-col items-center justify-between min-h-screen relative z-10">
          {/* Top Bar and Title */}
          <TopProfileBar
            profileName={profileName}
            userId={userId}
            profileIcon={profileIcon}
            renownTokens={renownTokens}
            allTimeTotalTaps={allTimeTotalTaps}
          />

          {/* Center Modal with Tabs */}
          <div className="relative z-10 w-full max-w-sm bg-white/10 border border-white/20 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-2xl">
            <div className="flex justify-around mb-6">
              <button
                className={`px-4 py-2 rounded-xl font-bold text-white ${
                  activeTab === "join"
                    ? "bg-white/20 border border-white/30"
                    : "hover:bg-white/10"
                }`}
                onClick={() => setActiveTab("join")}
              >
                Create / Join
              </button>
              <button
                className={`px-4 py-2 rounded-xl font-bold text-white ${
                  activeTab === "ai"
                    ? "bg-white/20 border border-white/30"
                    : "hover:bg-white/10"
                }`}
                onClick={() => setActiveTab("ai")}
              >
                AI
              </button>
            </div>

            {activeTab === "join" && (
              <>
                <input
                  type="text"
                  placeholder="Room Code (6 chars)"
                  value={roomCode}
                  onChange={(e) =>
                    setRoomCode(e.target.value.toUpperCase().slice(0, 6))
                  }
                  className="w-full px-4 py-4 rounded-2xl bg-white/10 text-white placeholder-white/50 border border-white/20 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-white/30 text-center font-mono text-lg tracking-widest mb-4"
                />
                <button
                  onClick={createRoom}
                  disabled={roomCode.length > 0}
                  className={`w-full mb-4 px-6 py-4 rounded-2xl font-bold transition-all duration-300 shadow-xl backdrop-blur-xl border border-white/20 ${
                    roomCode.length === 0
                      ? "bg-gradient-to-r from-green-500/80 to-emerald-600/80 text-white hover:scale-105"
                      : "bg-white/5 text-white/40 cursor-not-allowed"
                  }`}
                >
                  <i className="fas fa-plus mr-2" />
                  Create Room
                </button>

                <button
                  onClick={joinRoom}
                  disabled={roomCode.length !== 6}
                  className={`w-full px-6 py-4 rounded-2xl font-bold transition-all duration-300 shadow-xl backdrop-blur-xl border border-white/20 ${
                    roomCode.length === 6
                      ? "bg-gradient-to-r from-blue-500/80 to-cyan-600/80 text-white hover:scale-105"
                      : "bg-white/5 text-white/40 cursor-not-allowed"
                  }`}
                >
                  <i className="fas fa-sign-in-alt mr-2" />
                  Join Room
                </button>
              </>
            )}

            {activeTab === "ai" && (
              <>
                <select
                  value={aiDifficulty}
                  onChange={(e) => setAiDifficulty(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white/10 text-white border border-white/20 backdrop-blur-xl mb-4"
                >
                  <option value="easy" className="bg-purple-900 text-white">
                    🟢 Easy AI
                  </option>
                  <option value="medium" className="bg-purple-900 text-white">
                    🟡 Medium AI
                  </option>
                  <option value="hard" className="bg-purple-900 text-white">
                    🔴 Hard AI
                  </option>
                </select>

                <button
                  onClick={playAI}
                  className="w-full px-6 py-4 bg-gradient-to-r from-orange-500/80 to-red-600/80 text-white rounded-2xl font-bold hover:scale-105 active:scale-95 shadow-xl border border-white/20 backdrop-blur-xl"
                >
                  <i className="fas fa-robot mr-2" />
                  Battle AI
                </button>
              </>
            )}
          </div>

          {/* Footer Return Button */}
          <div className="z-10 mt-6">
            <a
              href="https://taptaptwo.co.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-4 py-3 bg-white/10 text-white rounded-xl font-bold text-sm hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg border border-white/20 backdrop-blur-xl"
            >
              <i className="fas fa-arrow-left" />
              <span>Return to Tap Tap Two</span>
            </a>
          </div>
        </div>
      </>
    )}

    {/* ===== LOBBY PHASE ===== */}
    {gamePhase === "lobby" && (
      <>
        <div className="flex flex-col items-center pt-10 px-4 relative min-h-screen z-10">
          {/* Top Bar */}
          <TopProfileBar
            profileName={profileName}
            userId={userId}
            profileIcon={profileIcon}
            allTimeTotalTaps={allTimeTotalTaps}
            renownTokens={renownTokens}
          />
          {/* Modal */}
          <div
            className="relative backdrop-blur-xl bg-white/10 rounded-3xl p-6 sm:p-8 border border-white/20 w-full max-w-md shadow-2xl"
            style={{
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}
          >
            {/* Room Info */}
            <div className="text-center mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
                Room: {currentRoom}
              </h2>
              <p className="text-white/70 text-sm">
                Waiting for players to ready up...
              </p>
            </div>

            {/* Player Ready States */}
            <div className="space-y-4 mb-6">
              {[
                { name: playerName, ready: isPlayerReady },
                { name: opponentName, ready: isOpponentReady },
              ].map((p, idx) => (
                <div
                  key={idx}
                  className={`flex justify-between items-center p-4 rounded-xl border transition-all duration-300 ${
                    p.ready
                      ? "bg-green-500/20 border-green-400/30"
                      : "bg-white/5 border-white/20"
                  }`}
                >
                  <span className="text-white font-bold">{p.name}</span>
                  <span
                    className={`text-sm font-bold ${
                      p.ready ? "text-green-300" : "text-white/50"
                    }`}
                  >
                    {p.ready ? "✓ Ready" : "Not Ready"}
                  </span>
                </div>
              ))}
            </div>

            {/* Rules Collapsible */}
            <details className="mb-6">
              <summary className="cursor-pointer text-center text-white font-bold py-2 hover:underline">
                Game Rules
              </summary>
              <div className="mt-4 text-white/80 text-sm leading-relaxed space-y-1">
                <p>• Tap the main button to earn coins</p>
                <p>• Use coins to upgrade your Tap Power</p>
                <p>• Player with most coins when time runs out wins!</p>
                <p>• Winner earns 10 tokens, loser earns 3</p>
              </div>
            </details>

            {/* Buttons */}
            <div className="space-y-3">
              <button
                onClick={toggleReady}
                disabled={isPlayerReady && isOpponentReady || countdown !== null}
                className={`w-full px-6 py-4 rounded-xl font-bold transition-all duration-300 border shadow-xl ${
                  isPlayerReady
                    ? "bg-red-600/80 text-white hover:scale-105 active:scale-95"
                    : "bg-green-600/80 text-white hover:scale-105 active:scale-95"
                } ${
                  isPlayerReady && isOpponentReady || countdown !== null
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                <i
                  className={`fas ${isPlayerReady ? "fa-times" : "fa-check"} mr-2`}
                ></i>
                {isPlayerReady ? "Cancel Ready" : "Ready Up!"}
              </button>

              <button
                onClick={resetToStart}
                disabled={isPlayerReady && isOpponentReady}
                className={`w-full px-6 py-4 bg-white/10 text-white rounded-xl font-bold border hover:bg-white/20 active:scale-95 transition-all duration-300 ${
                  isPlayerReady && isOpponentReady ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Leave Room
              </button>
            </div>
          </div>
        </div>
      </>
    )}

    {/* ===== PLAYING PHASE ===== */}
    {gamePhase === "playing" && (
      <>
        {/* Background blobs */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          />
          <div
            className="absolute top-1/2 left-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          />
        </div>

        <div className="flex flex-col relative overflow-hidden px-2 pt-14 pb-8 min-h-screen z-10">
          {/* Scoreboard */}
          <div className="z-10 max-w-2xl mx-auto w-full px-3 select-none mt-2">
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 p-4 shadow-xl rounded-2xl flex justify-between items-center text-xs sm:text-base font-bold w-full">
              {/* Player 1 */}
              <div className="flex items-center space-x-1">
                <i className="fas fa-user text-yellow-400"></i>
                <span>{playerName}</span>
                <span className="text-yellow-300 text-base">
                  {(playerScore || 0).toLocaleString()}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="relative flex-1 mx-4 h-4 rounded-full bg-gray-800 overflow-hidden">
                <div
                  className="absolute left-0 top-0 bottom-0 bg-yellow-400 transition-all duration-500"
                  style={{ width: `${((playerScore || 0) / ((playerScore || 0) + (opponentScore || 0) || 1)) * 100}%` }}
                />
                <div
                  className="absolute right-0 top-0 bottom-0 bg-pink-400 transition-all duration-500"
                  style={{ width: `${((opponentScore || 0) / ((playerScore || 0) + (opponentScore || 0) || 1)) * 100}%` }}
                />
              </div>

              {/* Player 2 */}
              <div className="flex items-center space-x-1 justify-end">
                <i
                  className={
                    gameMode === "ai"
                      ? "fas fa-robot text-pink-400"
                      : "fas fa-user-friends text-pink-400"
                  }
                ></i>
                <span>{opponentName}</span>
                <span className="text-pink-300 text-base">
                  {gameMode === "ai"
                    ? (aiCoins || 0).toLocaleString()
                    : (opponentScore || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Timer */}
          <div className="z-10 max-w-2xl mx-auto w-full flex justify-center mt-3 mb-1">
            <div className="font-mono text-2xl sm:text-3xl tracking-widest bg-black/30 px-6 py-2 rounded-lg border border-white/20 text-white select-none shadow-md">
              {formatTime(timeLeft)}
            </div>
          </div>

          {/* Centered Tap Button */}
          <div className="flex flex-1 justify-center items-center z-10 mt-2 relative max-w-md mx-auto w-full">
            <button
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(250);
                handleTap();
              }}
              onMouseDown={(e) => {
                e.preventDefault();
              }}
              className="w-[180px] h-[180px] rounded-full bg-white/30 backdrop-blur-xl border border-white/20 relative overflow-hidden transition-all duration-200 active:scale-95 shadow-2xl group flex items-center justify-center"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-white/30 opacity-50 group-hover:opacity-75 transition-opacity duration-200"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-28 h-28 bg-gradient-to-r from-red-400 to-yellow-400 rounded-full animate-pulse opacity-50"></div>
              </div>
              <i className="fas fa-swords text-6xl text-white relative z-10 drop-shadow"></i>
            </button>
          </div>

          {/* Centered Tap Power Upgrade Button */}
          <div className="z-10 max-w-md mx-auto w-full flex justify-center mt-8 mb-4">
            <button
              onClick={() => upgradeTapPower()}
              disabled={playerScore < getTapPowerCost()}
              className={`
                flex flex-col items-center justify-center w-full max-w-sm px-6 py-5 rounded-2xl bg-white/20 border border-white/30
                font-bold text-lg text-white shadow-xl backdrop-blur-xl
                transition-all duration-200 hover:bg-white/30 active:scale-95
                ${playerScore < getTapPowerCost() ? "opacity-50 cursor-not-allowed" : "hover:scale-105"}
              `}
              style={{
                minWidth: 0,
                maxWidth: 360,
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
              }}
            >
              <span className="text-3xl mb-1">💪</span>
              <span className="mb-1">Upgrade Tap Power</span>
              <span className="text-xs text-white/80 mb-1">
                Lv.{tapPowerLevel} &bull; +{tapPower} per tap
              </span>
              <span className="text-yellow-300 text-sm mb-0">{getTapPowerCost()} coins</span>
            </button>
          </div>

          {/* Leave + Mute */}
          <div className="z-10 max-w-md mx-auto flex flex-col items-center text-white gap-2 mt-1 mb-2">
            <button
              onClick={resetToStart}
              className="flex items-center px-4 py-2 bg-red-500/80 text-white text-sm rounded-full hover:bg-red-500 active:scale-95 transition-all duration-200 backdrop-blur-xl border border-white/20 shadow"
            >
              <i className="fas fa-times mr-1" /> Leave
            </button>

            <button
              onClick={() => setMuted((m) => !m)}
              className="flex items-center justify-center px-4 py-1 text-[#4a5568] hover:bg-gray-100 rounded-full border border-white/20"
              aria-label={muted ? "Unmute sounds" : "Mute sounds"}
            >
              <i className={`fas ${muted ? "fa-volume-mute" : "fa-volume-up"}`}></i>
            </button>
          </div>

          {floatingNumbers.map((num) => (
            <div
              key={num.id}
              className="absolute pointer-events-none font-bold text-xl sm:text-2xl drop-shadow-lg text-green-300"
              style={{
                left: `calc(50% + ${num.x}px)`,
                top: `calc(50% + ${num.y}px)`,
                transform: "translate(-50%, -50%)",
                animation: "floatUp 1s ease-out forwards",
              }}
            >
              +{num.value}
            </div>
          ))}

          <style jsx global>{`
            @keyframes floatUp {
              0% {
                opacity: 1;
                transform: translate(-50%, -50%) translateY(0px) scale(1);
              }
              50% {
                transform: translate(-50%, -50%) translateY(-50px) scale(1.1);
              }
              100% {
                opacity: 0;
                transform: translate(-50%, -50%) translateY(-100px) scale(0.8);
              }
            }
          `}</style>
        </div>
      </>
    )}

    {/* ===== FINISHED PHASE ===== */}
    {gamePhase === "finished" && (
      <>
        {/* Animated background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
        </div>

        <div className="flex flex-col items-center p-4 pt-4 relative min-h-screen z-10">
          {/* Floating TopProfileBar */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30">
            <TopProfileBar
              profileName={profileName}
              userId={userId}
              profileIcon={profileIcon}
              allTimeTotalTaps={allTimeTotalTaps}
              renownTokens={renownTokens}
              floating
            />
          </div>

          <div
            className="relative backdrop-blur-xl bg-white/10 rounded-3xl p-6 sm:p-8 border border-white/20 w-full max-w-sm text-center shadow-2xl flex flex-col mt-24"
            style={{
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              zIndex: 10,
            }}
          >
            <div className="text-4xl sm:text-5xl mb-4">
              {playerScore > opponentScore ? "🎉" : playerScore === opponentScore ? "🤝" : "😢"}
            </div>

            <div className="text-xl sm:text-2xl font-bold mb-6 text-white">
              {playerScore > opponentScore
                ? "Victory!"
                : playerScore === opponentScore
                ? "Tie Game!"
                : "Defeat!"}
            </div>

            <div className="space-y-3 mb-6 text-white">
              <div className="text-lg font-bold">Final Score</div>
              <div
                className="backdrop-blur-xl bg-white/10 rounded-2xl p-4 border border-white/20"
                style={{
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                }}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold">{playerName}</span>
                  <span className="text-yellow-300 font-bold">
                    {(playerScore || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold">{opponentName}</span>
                  <span className="text-red-300 font-bold">
                    {(opponentScore || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div
              className="backdrop-blur-xl bg-white/10 rounded-2xl p-4 mb-6 border border-white/20"
              style={{
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
              }}
            >
              <div className="text-white font-bold mb-3">Battle Stats</div>
              <div className="text-white/80 text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Total Taps:</span>
                  <span className="font-bold">{totalTapsInGame}</span>
                </div>
                <div className="flex justify-between">
                  <span>Upgrades:</span>
                  <span className="font-bold">{upgradesPurchased}</span>
                </div>
                <div className="flex justify-between">
                  <span>Coins Earned:</span>
                  <span className="font-bold">
                    {(playerScore || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between border-t border-white/20 pt-2 mt-2">
                  <span className="text-yellow-300">Tokens Earned:</span>
                  <span className="text-yellow-300 font-bold">
                    +
                    {playerScore > opponentScore
                      ? 10
                      : playerScore === opponentScore
                      ? 5
                      : 3}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={resetToStart}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-500/80 to-cyan-600/80 text-white rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all duration-300 shadow-xl backdrop-blur-xl border border-white/20 mb-4"
              style={{
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
              }}
            >
              <i className="fas fa-redo mr-2"></i>
              Battle Again
            </button>

            <a
              href="https://taptaptwo.co.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-block px-6 py-4 bg-white/10 text-white rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all duration-300 shadow-xl backdrop-blur-xl border border-white/20"
              style={{
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                textAlign: "center",
              }}
            >
              Return to Tap Tap Two
            </a>
          </div>
        </div>
      </>
    )}
  </div>
);



return null;

}

export default MainComponent;
