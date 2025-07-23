"use client";
import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/utilities/supabaseClient";



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
  const [totalTapsInGame, setTotalTapsInGame] = React.useState(0);
// AI coins state (start low)
const [aiCoins, setAiCoins] = React.useState(0);

// AI upgrades levels (start low)
const [aiTapPower, setAiTapPower] = React.useState(1);
const [aiTapPowerLevel, setAiTapPowerLevel] = React.useState(1);

const [aiCritChance, setAiCritChance] = React.useState(0);
const [aiCritLevel, setAiCritLevel] = React.useState(0);

const [aiTapSpeedBonus, setAiTapSpeedBonus] = React.useState(0);
const [aiTapSpeedLevel, setAiTapSpeedLevel] = React.useState(0);
  const [aiAutoTapper, setAiAutoTapper] = React.useState(0);
const [aiAutoTapperLevel, setAiAutoTapperLevel] = React.useState(1);
const aiCoinsRef = React.useRef(aiCoins);
const aiCritChanceRef = React.useRef(aiCritChance);
const aiCritLevelRef = React.useRef(aiCritLevel);
const aiTapPowerLevelRef = React.useRef(aiTapPowerLevel);
const aiTapSpeedLevelRef = React.useRef(aiTapSpeedLevel);
const aiAutoTapperLevelRef = React.useRef(aiAutoTapperLevel);
const aiAutoTapperRef = React.useRef(aiAutoTapper);
React.useEffect(() => { aiCoinsRef.current = aiCoins; }, [aiCoins]);
React.useEffect(() => { aiCritChanceRef.current = aiCritChance; }, [aiCritChance]);
React.useEffect(() => { aiCritLevelRef.current = aiCritLevel; }, [aiCritLevel]);
React.useEffect(() => { aiTapPowerLevelRef.current = aiTapPowerLevel; }, [aiTapPowerLevel]);
React.useEffect(() => { aiTapSpeedLevelRef.current = aiTapSpeedLevel; }, [aiTapSpeedLevel]);
React.useEffect(() => { aiAutoTapperLevelRef.current = aiAutoTapperLevel; }, [aiAutoTapperLevel]);
React.useEffect(() => { aiAutoTapperRef.current = aiAutoTapper; }, [aiAutoTapper]);

 // AI Upgrade Cost Functions (use refs inside the effect)
const getAiTapPowerCost = () =>
  Math.floor(10 * Math.pow(aiTapPowerLevelRef.current - 1, 1.3) || 10 * Math.pow(1.3, aiTapPowerLevelRef.current - 1));
const getAiCritCost = () =>
  Math.floor(25 * Math.pow(1.4, aiCritLevelRef.current));
const getAiTapSpeedCost = () =>
  Math.floor(50 * Math.pow(1.6, aiTapSpeedLevelRef.current));
const getAiAutoTapperCost = () =>
  Math.floor(100 * Math.pow(1.45, aiAutoTapperLevelRef.current));

React.useEffect(() => {
  if (gamePhase !== "playing" || gameMode !== "ai") return;

  const upgradeInterval = 5000; // every 5 seconds

  const upgradeTimer = setInterval(() => {
    setAiCoins((currentAiCoins) => {
      let coins = currentAiCoins;
      console.log("💰 AI Coins Before Upgrade:", coins);

      const tapPowerCost = Math.floor(10 * Math.pow(1.3, aiTapPowerLevelRef.current - 1));
      if (coins >= tapPowerCost) {
        coins -= tapPowerCost;
        setAiTapPower(prev => {
          console.log("🆙 Upgrading AI Tap Power:", prev, "->", prev + Math.floor(prev * 0.2) + 2);
          return prev + Math.floor(prev * 0.2) + 2;
        });
        setAiTapPowerLevel(prev => prev + 1);
        console.log("✅ AI bought Tap Power. New Coins:", coins);
      }

      const critCost = Math.floor(25 * Math.pow(1.4, aiCritLevelRef.current));
      if (coins >= critCost && aiCritChanceRef.current < 100) {
        coins -= critCost;
        setAiCritChance(prev => {
          const newChance = Math.min(prev + 2 + Math.floor(aiCritLevelRef.current / 3), 100);
          console.log("🆙 Upgrading AI Crit Chance:", prev, "->", newChance);
          return newChance;
        });
        setAiCritLevel(prev => prev + 1);
        console.log("✅ AI bought Crit Chance. New Coins:", coins);
      }

      const tapSpeedCost = Math.floor(50 * Math.pow(1.6, aiTapSpeedLevelRef.current));
      if (coins >= tapSpeedCost) {
        setAiTapSpeedBonus(prev => {
          console.log("🆙 Upgrading AI Tap Speed Bonus:", prev);
          return prev + 25 + Math.floor(aiTapSpeedLevelRef.current * 1.3);
        });
        setAiTapSpeedLevel(prev => prev + 1);
        coins -= tapSpeedCost;
        console.log("✅ AI bought Tap Speed. New Coins:", coins);
      }

      const autoTapperCost = Math.floor(100 * Math.pow(1.45, aiAutoTapperLevelRef.current));
      if (coins >= autoTapperCost && aiAutoTapperRef.current < 50000) {
        coins -= autoTapperCost;
        setAiAutoTapper(prev => {
          const newAuto = Math.min(prev + 10 + Math.floor(aiAutoTapperLevelRef.current * 1.2), 100000);
          console.log("🆙 Upgrading AI AutoTapper:", prev, "->", newAuto);
          return newAuto;
        });
        setAiAutoTapperLevel(prev => prev + 1);
        console.log("✅ AI bought Auto Tapper. New Coins:", coins);
      }

      console.log("💰 AI Coins After Upgrade:", coins);
      return coins;
    });
  }, upgradeInterval);

  return () => clearInterval(upgradeTimer);
}, [gamePhase, gameMode]);




// Game timer effect
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

const formatTime = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

  // Room and player management
  const [roomCode, setRoomCode] = React.useState("");
  const [currentRoom, setCurrentRoom] = React.useState("");
  const [opponentName, setOpponentName] = React.useState("Opponent");
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

        // HERE - set opponentId properly
        setOpponentId(amPlayer1 ? data.player2_id : data.player1_id);

        setIsPlayerReady(amPlayer1 ? data.player1_ready : data.player2_ready);
        setIsOpponentReady(amPlayer1 ? data.player2_ready : data.player1_ready);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [currentRoom, userId]);

  const [isPlayerReady, setIsPlayerReady] = React.useState(false);
  const [isOpponentReady, setIsOpponentReady] = React.useState(false);

  // Player upgrades
  const [tapPower, setTapPower] = React.useState(1);
  const [tapPowerLevel, setTapPowerLevel] = React.useState(1);
  const [critChance, setCritChance] = React.useState(0);
  const [critLevel, setCritLevel] = React.useState(0);
  const [tapSpeedBonus, setTapSpeedBonus] = React.useState(0);
  const [tapSpeedLevel, setTapSpeedLevel] = React.useState(0);
  const [autoTapper, setAutoTapper] = React.useState(0);
  const [autoTapperLevel, setAutoTapperLevel] = React.useState(0);

  const [isAnimating, setIsAnimating] = React.useState(false);
  const [upgradesPurchased, setUpgradesPurchased] = React.useState(0);
  const [floatingNumbers, setFloatingNumbers] = React.useState([]);

  // Profile data

  // Logo state
  const [logoUrl, setLogoUrl] = React.useState("");
  const [logoLoading, setLogoLoading] = React.useState(false);

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
      profileName: profileName, // ✅ use the actual value
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
    } catch (err) {
      console.error("Profile load failed:", err);
    }
  };

  React.useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(parseInt(storedUserId, 10));
      loadProfile(storedUserId);
    } else {
      // No userId in localStorage, redirect to login
      window.location.href = "/login";
    }
  }, []);

  

  // Calculate upgrade costs (1.3x multiplier)
  const getTapPowerCost = () =>
    Math.floor(10 * Math.pow(1.3, tapPowerLevel - 1));
  const getCritCost = () => Math.floor(25 * Math.pow(1.4, critLevel));
  const getTapSpeedCost = () => Math.floor(50 * Math.pow(1.6, tapSpeedLevel));
  const getAutoTapperCost = () =>
    Math.floor(100 * Math.pow(1.45, autoTapperLevel));

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
const floatingNumbersBatchRef = React.useRef([]);
const lastAnimationTimeRef = React.useRef(0);

const handleTap = () => {
  if (gamePhase !== "playing") return;

  const now = Date.now();
  if (now - lastAnimationTimeRef.current > 150) {
    setIsAnimating(true);
    lastAnimationTimeRef.current = now;
    setTimeout(() => setIsAnimating(false), 150);
  }

  let coinsEarned = tapPower;
  coinsEarned += Math.floor(coinsEarned * (tapSpeedBonus / 100));

  const isCrit = Math.random() * 100 < critChance;
  if (isCrit) coinsEarned *= 2;

  // Update score differently for AI and Multiplayer modes:
if (gameMode === "ai") {
  // Add coinsEarned to playerScore for instant feedback
  setPlayerScore(prev => prev + coinsEarned);

  // ALSO add coinsEarned to aiCoins for AI upgrades
  setAiCoins(prev => prev + coinsEarned);
  } else {
    // Batch score updates in multiplayer mode to optimize performance
    scoreBatchRef.current += coinsEarned;

    // Send tap immediately to backend for multiplayer mode
    if (currentRoom && userId) {
      fetch('/api/battle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateTaps',
          code: currentRoom,
          userId: userId,
          taps: coinsEarned,
        }),
      }).catch(err => console.error('Error sending tap:', err));
    }
  }

  setTotalTapsInGame(prev => prev + 1);

  const floatingId = now + Math.random();
  floatingNumbersBatchRef.current.push({
    id: floatingId,
    value: coinsEarned,
    isCrit,
    x: Math.random() * 100 - 50,
    y: Math.random() * 100 - 50,
  });

  setTimeout(() => {
    setFloatingNumbers(prev => prev.filter(num => num.id !== floatingId));
  }, 1000);
};

// Flush batched player score updates every 100ms (only relevant for multiplayer)
React.useEffect(() => {
  const interval = setInterval(() => {
    if (scoreBatchRef.current > 0) {
      setPlayerScore(prev => prev + scoreBatchRef.current);
      scoreBatchRef.current = 0; // reset score batch
    }
  }, 100);
  return () => clearInterval(interval);
}, []);

// Flush batched floating numbers every 100ms
React.useEffect(() => {
  const interval = setInterval(() => {
    if (floatingNumbersBatchRef.current.length > 0) {
      setFloatingNumbers(prev => [...prev, ...floatingNumbersBatchRef.current]);
      floatingNumbersBatchRef.current = []; // Reset floating numbers batch
    }
  }, 100);
  return () => clearInterval(interval);
}, []);


  // Upgrade functions
 const upgradeTapPower = () => {
  const cost = getTapPowerCost();
  if (playerScore >= cost) {
    setPlayerScore(prev => prev - cost);
    setTapPower(prev => prev + Math.floor(prev * 0.2) + 2); // +35% +2
    setTapPowerLevel(prev => prev + 1);
    setUpgradesPurchased(prev => prev + 1);
  }
};

const upgradeCritChance = () => {
  const cost = getCritCost();
  if (playerScore >= cost && critChance < 100) {
    setPlayerScore(prev => prev - cost);
    setCritChance(prev => Math.min(prev + 2 + Math.floor(critLevel / 3), 100)); // +5%, scaling slightly
    setCritLevel(prev => prev + 1);
    setUpgradesPurchased(prev => prev + 1);
  }
};

const upgradeTapSpeed = () => {
  const cost = getTapSpeedCost();
  if (playerScore >= cost) {
    setPlayerScore(prev => prev - cost);
    setTapSpeedBonus(prev => prev + 25 + Math.floor(tapSpeedLevel * 1.3)); // scales faster
    setTapSpeedLevel(prev => prev + 1);
    setUpgradesPurchased(prev => prev + 1);
  }
};

const upgradeAutoTapper = () => {
  const cost = getAutoTapperCost();
  if (playerScore >= cost && autoTapper < 50000) {
    setPlayerScore(prev => prev - cost);
    setAutoTapper(prev => Math.min(prev + 10 + Math.floor(autoTapperLevel * 1.2), 100000)); // growth scaling
    setAutoTapperLevel(prev => prev + 1);
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
  // Generate unique AI room code like "AI4X2B9"
  const generateAIRoomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "AI";
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const newRoomCode = generateAIRoomCode();

  const { error } = await supabase
    .from('battle_games')
    .insert([{
      room_code: newRoomCode,
      player1_id: userId,
      player2_id: 0,
      player1_name: profileName || "You",
      player2_name: `AI (${aiDifficulty})`,
      player1_ready: true,
      player2_ready: true,
      status: 'active',
      player1_score: 0,
      player2_score: 0,
    }]);

  if (error) {
    console.error("Failed to create AI room:", error.message);
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
  setTotalTapsInGame(0);    // Reset total taps for current game
  setUpgradesPurchased(0);
  setFloatingNumbers([]);
  setTapPower(1);
  setTapPowerLevel(1);
  setCritChance(0);
  setCritLevel(0);
  setTapSpeedBonus(0);
  setTapSpeedLevel(0);
  setAutoTapper(0);
  setAutoTapperLevel(0);
  fetchRoomStatus(); 
};

const resetToStart = () => {
  setGamePhase("start");
  setIsPlayerReady(false);
  setIsOpponentReady(false);
  setPlayerScore(0);
  setOpponentScore(0);
  setTotalTapsInGame(0);  // Reset on reset too
  setTimeLeft(gameDuration);
  setCurrentRoom("");
  setRoomCode("");
  setGameMode("");
  setUpgradesPurchased(0);
  setFloatingNumbers([]);
  setTapPower(1);
  setTapPowerLevel(1);
  setCritChance(0);
  setCritLevel(0);
  setTapSpeedBonus(0);
  setTapSpeedLevel(0);
  setAutoTapper(0);
  setAutoTapperLevel(0);
};
 
  

// Auto tapper effect without tapBatchRef
React.useEffect(() => {
  let interval;
  if (gamePhase === "playing" && autoTapper > 0) {
    interval = setInterval(() => {
      setPlayerScore(prev => prev + autoTapper);
      setTotalTapsInGame(prev => prev + 1);

      // No tapBatchRef batching, so no backend sync here.
      // If you want backend sync, add separate logic.
    }, 1000);
  }
  return () => clearInterval(interval);
}, [gamePhase, autoTapper]);

 React.useEffect(() => {
  let interval;
  if (gamePhase === "playing" && gameMode === "ai") {
    interval = setInterval(() => {
      let aiMultiplier = 1;
      if (aiDifficulty === "easy") aiMultiplier = 0.7;
      else if (aiDifficulty === "medium") aiMultiplier = 1;
      else if (aiDifficulty === "hard") aiMultiplier = 1.4;

      const aiTaps = Math.floor((Math.random() * 4 + 2) * aiMultiplier);
      const aiPower = Math.floor((Math.random() * 3 + 1) * aiMultiplier);

      const coinsEarned = aiTaps * aiPower;

      setOpponentScore(prev => prev + coinsEarned);
      setAiCoins(prev => prev + coinsEarned);  // Add coins to AI for upgrades
    }, 1000);
  }
  return () => clearInterval(interval);
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


  
  // Update all-time total taps when game finishes
React.useEffect(() => {
  if (gamePhase === "finished") {
    setAllTimeTotalTaps((prev) => prev + totalTapsInGame);  // Use totalTapsInGame here
    const playerWon = playerScore > opponentScore;
    const tie = playerScore === opponentScore;
    const renownEarned = playerWon ? 10 : tie ? 5 : 3;
    setRenownTokens((prev) => prev + renownEarned);
  }
}, [gamePhase, playerScore, opponentScore, totalTapsInGame]);
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

      // Set player and opponent names from backend data
      setPlayerName(amPlayer1 ? (room.player1_name || `Player ${userId}`) : (room.player2_name || `Player ${userId}`));
      setOpponentName(amPlayer1 ? (room.player2_name || 'Opponent') : (room.player1_name || 'Opponent'));
    }
  } catch (err) {
    console.error('Polling error:', err);
  }
};

  
const TopProfileBar = ({
  profileName,
  userId,
  profileIcon,
  allTimeTotalTaps,
  renownTokens,
}) => (
  <div
    className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/10 border-b border-white/20 p-3 shadow-xl"
    style={{
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
    }}
  >
    <div className="flex items-center justify-between max-w-6xl mx-auto">
      {/* Left side - Profile info */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-lg overflow-hidden">
          {profileIcon ? (
            <img
              src={profileIcon}
              alt={`${profileName} icon`}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <i className="fas fa-user text-white text-sm"></i>
          )}
        </div>
        <div className="hidden sm:block">
          <div className="text-white font-bold text-sm">
            {profileName} {userId ? `(${userId})` : ""}
          </div>
          <div className="text-white/70 text-xs">
            <i className="fas fa-coins text-yellow-400 mr-1"></i>
            {renownTokens} tokens
          </div>
        </div>
      </div>

      {/* Center - Stats (mobile hidden) */}
      <div className="hidden md:flex items-center space-x-6">
        <div className="text-center">
          <div className="text-white/70 text-xs">Total Taps</div>
          <div className="text-white font-bold text-sm">
            {(allTimeTotalTaps|| 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Right side - Return button */}
      <a
        href="https://taptaptwo.co.uk"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-purple-500/80 to-pink-500/80 text-white rounded-xl font-bold hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg backdrop-blur-xl border border-white/20 text-xs sm:text-sm"
        style={{
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <i className="fas fa-arrow-left"></i>
        <span className="hidden sm:inline">Return to</span>
        <span>Tap Tap: Two</span>
      </a>
    </div>

    {/* Mobile stats row */}
    <div className="flex sm:hidden justify-center mt-2 pt-2 border-t border-white/10">
      <div className="flex items-center space-x-4 text-xs">
        <div className="text-white/70">
          <i className="fas fa-coins text-yellow-400 mr-1"></i>
          {renownTokens} tokens
        </div>
        <div className="text-white/70">
          <i className="fas fa-hand-pointer text-blue-400 mr-1"></i>
          {(allTimeTotalTaps|| 0).toLocaleString()} taps
        </div>
      </div>
    </div>
  </div>
);

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
  <div className={`absolute ${position} z-10`}>
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

// Starting page
if (gamePhase === "start") {
  return (
    <>
    <TopProfileBar
  profileName={profileName}
  userId={userId}
  profileIcon={profileIcon}
  allTimeTotalTaps={allTimeTotalTaps}
  renownTokens={renownTokens}
/>

<div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4 pt-20 relative overflow-hidden">
  {/* Animated background elements */}
  <div className="absolute inset-0">
    <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
    <div
      className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"
      style={{ animationDelay: "1s" }}
    ></div>
    <div
      className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl animate-pulse"
      style={{ animationDelay: "2s" }}
    ></div>
  </div>

  <div
    className="relative backdrop-blur-xl bg-white/10 rounded-3xl p-6 sm:p-8 border border-white/20 w-full max-w-sm shadow-2xl"
    style={{
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
    }}
  >
          {/* Logo and Title */}
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">
              Tap Tap: Battle
            </h1>
            <p className="text-white/70 text-sm">Competitive Tapping Arena</p>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Room Code (6 chars)"
              value={roomCode}
              onChange={(e) =>
                setRoomCode(e.target.value.toUpperCase().slice(0, 6))
              }
              className="w-full px-4 py-4 rounded-2xl bg-white/10 text-white placeholder-white/50 border border-white/20 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all duration-300 text-center font-mono text-lg tracking-widest"
              maxLength={6}
              style={{
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
              }}
            />

            <button
              onClick={createRoom}
              className="w-full px-6 py-4 bg-gradient-to-r from-green-500/80 to-emerald-600/80 text-white rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all duration-300 shadow-xl hover:shadow-green-500/25 backdrop-blur-xl border border-white/20"
              style={{
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
              }}
            >
              <i className="fas fa-plus mr-2"></i>
              Create Room
            </button>

            <button
              onClick={joinRoom}
              disabled={roomCode.length !== 6}
              className={`w-full px-6 py-4 rounded-2xl font-bold transition-all duration-300 shadow-xl backdrop-blur-xl border border-white/20 ${
                roomCode.length === 6
                  ? "bg-gradient-to-r from-blue-500/80 to-cyan-600/80 text-white hover:scale-105 active:scale-95 hover:shadow-blue-500/25"
                  : "bg-white/5 text-white/40 cursor-not-allowed"
              }`}
              style={{
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
              }}
            >
              <i className="fas fa-sign-in-alt mr-2"></i>
              Join Room
            </button>

            <div className="space-y-3">
              <select
                value={aiDifficulty}
                onChange={(e) => setAiDifficulty(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-white/10 text-white border border-white/20 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-white/30"
                style={{
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                }}
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
                className="w-full px-6 py-4 bg-gradient-to-r from-orange-500/80 to-red-600/80 text-white rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all duration-300 shadow-xl hover:shadow-orange-500/25 backdrop-blur-xl border border-white/20"
                style={{
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                }}
              >
                <i className="fas fa-robot mr-2"></i>
                Battle AI
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Lobby phase
if (gamePhase === "lobby") {
  return (
    <>
      <TopProfileBar
        profileName={profileName}
        userId={userId}
        profileIcon={profileIcon}
        allTimeTotalTaps={allTimeTotalTaps}
        renownTokens={renownTokens}
      />

      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4 pt-20 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
        </div>

        <div
          className="relative backdrop-blur-xl bg-white/10 rounded-3xl p-6 sm:p-8 border border-white/20 w-full max-w-sm shadow-2xl"
          style={{
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          {/* Room Info */}
          <div className="text-center mb-6">
            {countdown !== null ? (
              <h2 className="text-3xl text-white">Starting in {countdown}...</h2>
            ) : (
              <>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  Room: {currentRoom}
                </h2>
                <p className="text-white/70 text-sm">
                  Waiting for players to ready up
                </p>
              </>
            )}
          </div>

          {/* Players Ready Status */}
          <div className="space-y-3 mb-6">
            <div
              className={`p-4 rounded-2xl backdrop-blur-xl border border-white/20 transition-all duration-300 ${
                isPlayerReady ? "bg-green-500/20 border-green-400/30" : "bg-white/5"
              }`}
              style={{
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
              }}
            >
              <div className="flex justify-between items-center">
                <span className="text-white font-bold">{playerName}</span>
                <span
                  className={`text-sm font-bold ${
                    isPlayerReady ? "text-green-300" : "text-white/50"
                  }`}
                >
                  {isPlayerReady ? "✓ Ready" : "Not Ready"}
                </span>
              </div>
            </div>

            <div
              className={`p-4 rounded-2xl backdrop-blur-xl border border-white/20 transition-all duration-300 ${
                isOpponentReady ? "bg-green-500/20 border-green-400/30" : "bg-white/5"
              }`}
              style={{
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
              }}
            >
              <div className="flex justify-between items-center">
                <span className="text-white font-bold">{opponentName}</span>
                <span
                  className={`text-sm font-bold ${
                    isOpponentReady ? "text-green-300" : "text-white/50"
                  }`}
                >
                  {isOpponentReady ? "✓ Ready" : "Not Ready"}
                </span>
              </div>
            </div>
          </div>

          {/* --- RULES SECTION --- */}
          <div
            className="bg-white/10 backdrop-blur-xl rounded-3xl p-4 mb-6 border border-white/20 text-white/80 space-y-2 text-sm leading-relaxed"
            style={{
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}
          >
            <h2 className="text-lg font-bold text-white mb-2 text-center">Game Rules</h2>
            <p>• Tap the main button to earn coins</p>
            <p>• Use coins to buy upgrades during the game</p>
            <p>• 💪 Tap Power: +1 coin per tap per level</p>
            <p>• ⚡ Crit Chance: 5% chance to double coins</p>
            <p>• 🚀 Tap Speed: +25% bonus coins per tap</p>
            <p>• 🤖 Auto Tapper: +10 coins per second</p>
            <p>• Player with most coins when time runs out wins!</p>
            <p>• Winner earns 5 tokens, loser earns 1</p>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={toggleReady}
              disabled={countdown !== null}  // Disable button during countdown
              className={`w-full px-6 py-4 rounded-2xl font-bold transition-all duration-300 shadow-xl backdrop-blur-xl border border-white/20 ${
                isPlayerReady
                  ? "bg-gradient-to-r from-red-500/80 to-red-600/80 text-white hover:scale-105 active:scale-95"
                  : "bg-gradient-to-r from-green-500/80 to-green-600/80 text-white hover:scale-105 active:scale-95"
              } ${countdown !== null ? "opacity-50 cursor-not-allowed" : ""}`}
              style={{
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
              }}
            >
              <i className={`fas ${isPlayerReady ? "fa-times" : "fa-check"} mr-2`}></i>
              {isPlayerReady ? "Cancel Ready" : "Ready Up!"}
            </button>

            <button
              onClick={resetToStart}
              className="w-full px-6 py-4 bg-white/10 text-white rounded-2xl font-bold hover:bg-white/20 active:scale-95 transition-all duration-300 backdrop-blur-xl border border-white/20"
              style={{
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
              }}
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Leave Room
            </button>
          </div>
        </div>
      </div>
    </>
  );
}


// Playing phase
if (gamePhase === "playing") {
  return (
    <>
     <TopProfileBar
  profileName={profileName}
  userId={userId}
  profileIcon={profileIcon}
  allTimeTotalTaps={allTimeTotalTaps}
  renownTokens={renownTokens}
/>

      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex flex-col relative overflow-hidden pt-16">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
        </div>

        {/* Game scoreboard */}
        <div
          className="relative z-20 backdrop-blur-xl bg-white/10 border-b border-white/20 p-4 shadow-xl"
          style={{
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          <div className="flex justify-between items-center max-w-sm mx-auto">
            <div className="text-center flex-1">
              <div className="text-white font-bold text-sm">{playerName}</div>
              <div className="text-yellow-300 text-lg sm:text-xl font-bold">
                {(playerScore|| 0).toLocaleString()}
              </div>
            </div>

            <div className="text-center px-4">
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-50 text-white text-xl sm:text-2xl font-bold">
  {formatTime(timeLeft)}
</div>


              <button
                onClick={resetToStart}
                className="px-3 py-1 bg-red-500/80 text-white text-xs rounded-full hover:bg-red-500 active:scale-95 transition-all duration-200 backdrop-blur-xl border border-white/20"
                style={{
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                }}
              >
                <i className="fas fa-times mr-1"></i>
                Leave
              </button>
            </div>

            <div className="text-center flex-1">
              <div className="text-white font-bold text-sm">{opponentName}</div>
              <div className="text-red-300 text-lg sm:text-xl font-bold">
                {(opponentScore|| 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Game area */}
        <div className="flex-1 relative flex items-center justify-center p-4">
          {/* Upgrade buttons in corners - mobile optimized */}
          <UpgradeButton
            title="Tap Power"
            level={tapPowerLevel}
            cost={getTapPowerCost()}
            description={`+${tapPower} per tap`}
            onClick={upgradeTapPower}
            disabled={playerScore < getTapPowerCost()}
            position="top-2 left-2 sm:top-4 sm:left-4"
            icon="💪"
          />

         <UpgradeButton
  title="Critical Hit"
  level={critLevel}
  cost={getCritCost()}
  description={`${critChance}% crit chance`}
  onClick={upgradeCritChance}
  disabled={playerScore < getCritCost() || critChance >= 100}
  position="top-2 right-2 sm:top-4 sm:right-4"
  icon="⚡"
/>

<UpgradeButton
  title="Tap Speed"
  level={tapSpeedLevel}
  cost={getTapSpeedCost()}
  description={`+${tapSpeedBonus}% bonus`}
  onClick={upgradeTapSpeed}
  disabled={playerScore < getTapSpeedCost() || tapSpeedLevel >= 50}
  position="bottom-2 left-2 sm:bottom-4 sm:left-4"
  icon="🚀"
/>

<UpgradeButton
  title="Auto Tapper"
  level={autoTapperLevel}
  cost={getAutoTapperCost()}
  description={`${autoTapper}/sec`}
  onClick={upgradeAutoTapper}
  disabled={playerScore < getAutoTapperCost() || autoTapper >= 100000}
  position="bottom-2 right-2 sm:bottom-4 sm:right-4"
  icon="🤖"
/>


          {/* Main tap button */}
          <div className="relative">
            <button
              onClick={handleTap}
              className={`
                w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 rounded-full 
                bg-gradient-to-br from-orange-400 via-red-500 to-red-600
                shadow-2xl hover:shadow-red-500/50 transition-all duration-200
                text-white font-bold text-xl
                ${
                  isAnimating
                    ? "scale-90"
                    : "scale-100 hover:scale-105 active:scale-95"
                }
                cursor-pointer border-4 border-white/30 backdrop-blur-xl
                flex items-center justify-center
              `}
              style={{
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                boxShadow:
                  "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
              }}
            >
              <div className="text-center">
                <i className="fas fa-hand-pointer text-4xl sm:text-5xl md:text-6xl mb-2 drop-shadow-lg"></i>
                <div className="text-sm sm:text-base font-bold">
                  +{tapPower + Math.floor(tapPower * (tapSpeedBonus / 100))}
                </div>
                {critChance > 0 && (
                  <div className="text-xs text-yellow-200 font-bold">
                    {critChance}% crit
                  </div>
                )}
              </div>
            </button>

            {/* Floating numbers */}
            {floatingNumbers.map((num) => (
              <div
                key={num.id}
                className={`absolute pointer-events-none font-bold text-xl sm:text-2xl drop-shadow-lg ${
                  num.isCrit ? "text-yellow-300" : "text-green-300"
                }`}
                style={{
                  left: `calc(50% + ${num.x}px)`,
                  top: `calc(50% + ${num.y}px)`,
                  transform: "translate(-50%, -50%)",
                  animation: "floatUp 1s ease-out forwards",
                }}
              >
                +{num.value}
                {num.isCrit && " ⚡"}
              </div>
            ))}
          </div>
        </div>

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
  );
}

// Finished phase
if (gamePhase === "finished") {
  const playerWon = playerScore > opponentScore;
  const tie = playerScore === opponentScore;
  const renownEarned = playerWon ? 10 : tie ? 5 : 3;

  return (
    <>
     <TopProfileBar
  profileName={profileName}
  userId={userId}
  profileIcon={profileIcon}
  allTimeTotalTaps={allTimeTotalTaps}
  renownTokens={renownTokens}
/>

      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4 pt-20 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
        </div>

        <div
          className="relative backdrop-blur-xl bg-white/10 rounded-3xl p-6 sm:p-8 border border-white/20 w-full max-w-sm text-center shadow-2xl"
          style={{
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          <div className="text-4xl sm:text-5xl mb-4">
            {playerWon ? "🎉" : tie ? "🤝" : "😢"}
          </div>

          <div className="text-xl sm:text-2xl font-bold mb-6 text-white">
            {playerWon ? "Victory!" : tie ? "Tie Game!" : "Defeat!"}
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
                  {(playerScore|| 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold">{opponentName}</span>
                <span className="text-red-300 font-bold">
                  {(opponentScore|| 0).toLocaleString()}
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
                <span className="font-bold">{(playerScore|| 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-white/20 pt-2 mt-2">
                <span className="text-yellow-300">Tokens Earned:</span>
                <span className="text-yellow-300 font-bold">+{renownEarned}</span>
              </div>
            </div>
          </div>

          <button
            onClick={resetToStart}
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-500/80 to-cyan-600/80 text-white rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all duration-300 shadow-xl backdrop-blur-xl border border-white/20"
            style={{
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}
          >
            <i className="fas fa-redo mr-2"></i>
            Battle Again
          </button>
        </div>
      </div>
    </>
  );
}

return null;

  }

export default MainComponent;
