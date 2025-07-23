"use client";
import React from "react";

function MainComponent() {
  // Game phases: 'start', 'lobby', 'ready', 'playing', 'finished'
  const [gamePhase, setGamePhase] = React.useState("start");
  const [timeLeft, setTimeLeft] = React.useState(30);
  const [gameDuration, setGameDuration] = React.useState(30);
  const [playerScore, setPlayerScore] = React.useState(0);
  const [opponentScore, setOpponentScore] = React.useState(0);
  const [totalTaps, setTotalTaps] = React.useState(0);
  const [showRules, setShowRules] = React.useState(false);
  const [gameMode, setGameMode] = React.useState(""); // 'ai' or 'multiplayer'
  const [aiDifficulty, setAiDifficulty] = React.useState("medium");
const [playerName, setPlayerName] = React.useState("");
const [userId, setUserId] = React.useState(null);
const [profileName, setProfileName] = React.useState("");
const [profileIcon, setProfileIcon] = React.useState("");
const [allTimeTotalTaps, setAllTimeTotalTaps] = React.useState(0);
const [renownTokens, setRenownTokens] = React.useState(0);
const [totalTapsInGame, setTotalTapsInGame] = React.useState(0);


  // Room and player management
  const [roomCode, setRoomCode] = React.useState("");
  const [currentRoom, setCurrentRoom] = React.useState("");
  const [opponentName, setOpponentName] = React.useState("Opponent");
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

  // Calculate upgrade costs (1.3x multiplier)
  const getTapPowerCost = () =>
    Math.floor(10 * Math.pow(1.3, tapPowerLevel - 1));
  const getCritCost = () => Math.floor(25 * Math.pow(1.3, critLevel));
  const getTapSpeedCost = () => Math.floor(50 * Math.pow(1.3, tapSpeedLevel));
  const getAutoTapperCost = () =>
    Math.floor(100 * Math.pow(1.3, autoTapperLevel));

  // Generate random room code
  const generateRoomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

 const handleTap = () => {
  if (gamePhase !== "playing") return;

  setIsAnimating(true);
  setTimeout(() => setIsAnimating(false), 150);

  let coinsEarned = tapPower;

  // Apply tap speed bonus
  coinsEarned += Math.floor(coinsEarned * (tapSpeedBonus / 100));

  // Check for critical hit
  const isCrit = Math.random() * 100 < critChance;
  if (isCrit) {
    coinsEarned *= 2;
  }

  setPlayerScore((prev) => prev + coinsEarned);
  setTotalTapsInGame((prev) => prev + 1); // Fix here: increment totalTapsInGame

  // Add floating number animation
  const floatingId = Date.now() + Math.random();
  setFloatingNumbers((prev) => [
    ...prev,
    {
      id: floatingId,
      value: coinsEarned,
      isCrit: isCrit,
      x: Math.random() * 100 - 50,
      y: Math.random() * 100 - 50,
    },
  ]);

  // Remove floating number after animation
  setTimeout(() => {
    setFloatingNumbers((prev) => prev.filter((num) => num.id !== floatingId));
  }, 1000);
};

  

const loadProfile = async (userId) => {
  console.log("loadProfile called with userId:", userId); // <-- Add this to confirm call

  try {
    const response = await fetch("/api/battle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "fetchProfile",
        userId: parseInt(userId, 10),
      }),
    });

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



const testUserId = 1; // Replace 123 with a real ID from your DB

React.useEffect(() => {
  console.log("Test useEffect firing with hardcoded userId");
  loadProfile(testUserId);
}, []);


  // Upgrade functions
  const upgradeTapPower = () => {
    const cost = getTapPowerCost();
    if (playerScore >= cost) {
      setPlayerScore((prev) => prev - cost);
      setTapPower((prev) => prev + 1);
      setTapPowerLevel((prev) => prev + 1);
      setUpgradesPurchased((prev) => prev + 1);
    }
  };

  const upgradeCritChance = () => {
    const cost = getCritCost();
    if (playerScore >= cost && critChance < 100) {
      setPlayerScore((prev) => prev - cost);
      setCritChance((prev) => Math.min(prev + 5, 100));
      setCritLevel((prev) => prev + 1);
      setUpgradesPurchased((prev) => prev + 1);
    }
  };

  const upgradeTapSpeed = () => {
    const cost = getTapSpeedCost();
    if (playerScore >= cost) {
      setPlayerScore((prev) => prev - cost);
      setTapSpeedBonus((prev) => prev + 25);
      setTapSpeedLevel((prev) => prev + 1);
      setUpgradesPurchased((prev) => prev + 1);
    }
  };

  const upgradeAutoTapper = () => {
    const cost = getAutoTapperCost();
    if (playerScore >= cost && autoTapper < 50000) {
      setPlayerScore((prev) => prev - cost);
      setAutoTapper((prev) => Math.min(prev + 10, 50000));
      setAutoTapperLevel((prev) => prev + 1);
      setUpgradesPurchased((prev) => prev + 1);
    }
  };

  // Game flow functions
  const createRoom = () => {
    const newRoomCode = generateRoomCode();
    setCurrentRoom(newRoomCode);
    setGameMode("multiplayer");
    setOpponentName("Waiting for player...");
    setGamePhase("lobby");
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
        userId: testUserId, // Replace with actual logged-in user ID
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(`Failed to join room: ${data.error || 'Unknown error'}`);
      return;
    }

    // Room joined successfully
    setCurrentRoom(roomCode.toUpperCase());
    setGameMode('multiplayer');
    setOpponentName('Player 2'); // Ideally fetch actual opponent name from backend
    setGamePhase('lobby');

  } catch (err) {
    console.error('joinRoom error:', err);
    alert('Error joining room. See console.');
  }
};


  const playAI = () => {
    setGameMode("ai");
    setOpponentName(`AI (${aiDifficulty})`);
    setCurrentRoom("AI_GAME");
    setIsOpponentReady(true);
    setGamePhase("lobby");
  };

  const toggleReady = () => {
    setIsPlayerReady(!isPlayerReady);
  };

 
const startGame = () => {
  setShowRules(false);
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

  // Auto tapper effect
  React.useEffect(() => {
    let interval;
    if (gamePhase === "playing" && autoTapper > 0) {
      interval = setInterval(() => {
        setPlayerScore((prev) => prev + autoTapper);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gamePhase, autoTapper]);

  // AI player simulation
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
        setOpponentScore((prev) => prev + aiTaps * aiPower);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gamePhase, gameMode, aiDifficulty]);

  // Simulate opponent ready for AI after short delay
  React.useEffect(() => {
    if (gameMode === "ai" && gamePhase === "lobby") {
      setIsOpponentReady(true);
    }
  }, [gameMode, gamePhase]);

  // Auto-start game when both players ready
  React.useEffect(() => {
    if (gamePhase === "lobby" && isPlayerReady && isOpponentReady) {
      setShowRules(true);
    }
  }, [gamePhase, isPlayerReady, isOpponentReady]);

  // Update all-time total taps when game finishes
React.useEffect(() => {
  if (gamePhase === "finished") {
    setAllTimeTotalTaps((prev) => prev + totalTapsInGame);  // Use totalTapsInGame here
    const playerWon = playerScore > opponentScore;
    const tie = playerScore === opponentScore;
    const renownEarned = playerWon ? 5 : tie ? 3 : 1;
    setRenownTokens((prev) => prev + renownEarned);
  }
}, [gamePhase, playerScore, opponentScore, totalTapsInGame]);

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
      <TopProfileBar />
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
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
              Room: {currentRoom}
            </h2>
            <p className="text-white/70 text-sm">
              Waiting for players to ready up
            </p>
          </div>

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

          <div className="space-y-3">
            <button
              onClick={toggleReady}
              className={`w-full px-6 py-4 rounded-2xl font-bold transition-all duration-300 shadow-xl backdrop-blur-xl border border-white/20 ${
                isPlayerReady
                  ? "bg-gradient-to-r from-red-500/80 to-red-600/80 text-white hover:scale-105 active:scale-95"
                  : "bg-gradient-to-r from-green-500/80 to-green-600/80 text-white hover:scale-105 active:scale-95"
              }`}
              style={{
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
              }}
            >
              <i
                className={`fas ${isPlayerReady ? "fa-times" : "fa-check"} mr-2`}
              ></i>
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

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 max-w-sm w-full border border-white/20 shadow-2xl"
            style={{
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}
          >
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 text-center">
              Game Rules
            </h2>
            <div className="text-white/80 space-y-2 text-sm leading-relaxed">
              <p>• Tap the main button to earn coins</p>
              <p>• Use coins to buy upgrades during the game</p>
              <p>• 💪 Tap Power: +1 coin per tap per level</p>
              <p>• ⚡ Crit Chance: 5% chance to double coins</p>
              <p>• 🚀 Tap Speed: +25% bonus coins per tap</p>
              <p>• 🤖 Auto Tapper: +10 coins per second</p>
              <p>• Player with most coins when time runs out wins!</p>
              <p>• Winner earns 5 tokens, loser earns 1</p>
            </div>
            <button
              onClick={startGame}
              className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-green-500/80 to-green-600/80 text-white rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all duration-300 shadow-xl backdrop-blur-xl border border-white/20"
              style={{
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
              }}
            >
              <i className="fas fa-play mr-2"></i>
              Start Battle!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
// Playing phase
if (gamePhase === "playing") {
  return (
    <>
      <TopProfileBar />
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
              <div className="text-white text-xl sm:text-2xl font-bold mb-1">
                {timeLeft}s
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
            disabled={playerScore < getCritCost()}
            maxLevel={20}
            position="top-2 right-2 sm:top-4 sm:right-4"
            icon="⚡"
          />

          <UpgradeButton
            title="Tap Speed"
            level={tapSpeedLevel}
            cost={getTapSpeedCost()}
            description={`+${tapSpeedBonus}% bonus`}
            onClick={upgradeTapSpeed}
            disabled={playerScore < getTapSpeedCost()}
            position="bottom-2 left-2 sm:bottom-4 sm:left-4"
            icon="🚀"
          />

          <UpgradeButton
            title="Auto Tapper"
            level={autoTapperLevel}
            cost={getAutoTapperCost()}
            description={`${autoTapper}/sec`}
            onClick={upgradeAutoTapper}
            disabled={playerScore < getAutoTapperCost()}
            maxLevel={20}
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
  const renownEarned = playerWon ? 5 : tie ? 3 : 1;

  return (
    <>
      <TopProfileBar />
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
                <span className="font-bold">{totalTaps}</span>
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
