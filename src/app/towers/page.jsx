"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

export default function TapTapTowers() {
  // ===== GAME STATE =====
  const [gold, setGold] = useState(200);
  const [lives, setLives] = useState(20);
  const [wave, setWave] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [towers, setTowers] = useState([]);
  const [enemies, setEnemies] = useState([]);
  const [selectedTowerType, setSelectedTowerType] = useState(null);
  const [tapBuffActive, setTapBuffActive] = useState(false);
  const [tapBuffMultiplier, setTapBuffMultiplier] = useState(1);
  const [floatingTexts, setFloatingTexts] = useState([]);

  const gameLoopRef = useRef(null);
  const pathRef = useRef([
    { x: 50, y: 100 },
    { x: 300, y: 100 },
    { x: 300, y: 400 },
    { x: 50, y: 400 },
    { x: 50, y: 650 }
  ]);

  // ===== TOWER DEFINITIONS =====
  const towerTypes = {
    rapid: {
      name: "Rapid Shooter",
      cost: 50,
      damage: 5,
      fireRate: 300,
      range: 120,
      icon: <FaCrosshairs />,
      tapEffect: (tower) => spawnFloatingText("BANG!", tower.x, tower.y)
    },
    splash: {
      name: "Splash Cannon",
      cost: 80,
      damage: 15,
      fireRate: 800,
      range: 100,
      icon: <FaBomb />,
      tapEffect: (tower) => spawnFloatingText("BOOM!", tower.x, tower.y)
    },
    frost: {
      name: "Frost Tower",
      cost: 70,
      damage: 3,
      fireRate: 600,
      range: 100,
      icon: <FaSnowflake />,
      tapEffect: (tower) => spawnFloatingText("FREEZE!", tower.x, tower.y)
    },
    tesla: {
      name: "Tesla Tower",
      cost: 100,
      damage: 10,
      fireRate: 1000,
      range: 150,
      icon: <FaBolt />,
      tapEffect: (tower) => spawnFloatingText("ZAP!", tower.x, tower.y)
    }
  };

  // ===== ENEMY DEFINITIONS =====
  const enemyTypes = {
    grunt: { hp: 20, speed: 1 },
    runner: { hp: 10, speed: 2 },
    tank: { hp: 60, speed: 0.5 },
    splitter: { hp: 15, speed: 1.2 },
    boss: { hp: 300, speed: 0.8 }
  };

  // ===== SPAWN ENEMIES PER WAVE =====
  const spawnWave = () => {
    let enemiesToSpawn = [];
    for (let i = 0; i < wave * 3; i++) {
      enemiesToSpawn.push({
        ...enemyTypes.grunt,
        type: "grunt",
        x: pathRef.current[0].x,
        y: pathRef.current[0].y,
        hp: enemyTypes.grunt.hp * wave,
        progress: 0
      });
    }
    if (wave % 10 === 0) {
      enemiesToSpawn.push({
        ...enemyTypes.boss,
        type: "boss",
        x: pathRef.current[0].x,
        y: pathRef.current[0].y,
        hp: enemyTypes.boss.hp * wave,
        progress: 0
      });
    }
    setEnemies((prev) => [...prev, ...enemiesToSpawn]);
  };

  // ===== TAP BUFF =====
  const handleTap = (e) => {
    const x = e.clientX;
    const y = e.clientY;
    spawnFloatingText(`+DMG`, x, y);
    setTapBuffActive(true);
    setTapBuffMultiplier(2);
    setTimeout(() => {
      setTapBuffActive(false);
      setTapBuffMultiplier(1);
    }, 500);
  };

  const spawnFloatingText = (text, x, y) => {
    const id = Date.now();
    setFloatingTexts((prev) => [...prev, { id, text, x, y }]);
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((t) => t.id !== id));
    }, 800);
  };

  // ===== TOWER PLACEMENT =====
  const handlePlaceTower = (e) => {
    if (!selectedTowerType) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const towerData = towerTypes[selectedTowerType];
    if (gold >= towerData.cost) {
      setTowers((prev) => [...prev, { ...towerData, x, y, id: Date.now(), level: 1 }]);
      setGold((g) => g - towerData.cost);
    }
    setSelectedTowerType(null);
  };

  // ===== GAME LOOP =====
  useEffect(() => {
    if (!isPaused) {
      gameLoopRef.current = setInterval(() => {
        // Move enemies
        setEnemies((prev) =>
          prev.map((enemy) => {
            const path = pathRef.current;
            let targetIndex = Math.floor(enemy.progress);
            if (targetIndex >= path.length - 1) {
              setLives((l) => l - 1);
              return null;
            }
            const target = path[targetIndex + 1];
            const dx = target.x - enemy.x;
            const dy = target.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < enemy.speed) {
              enemy.progress += 1;
            } else {
              enemy.x += (dx / dist) * enemy.speed;
              enemy.y += (dy / dist) * enemy.speed;
            }
            return enemy;
          }).filter(Boolean)
        );

        // Tower attacks
        setEnemies((prevEnemies) => {
          let updatedEnemies = [...prevEnemies];
          towers.forEach((tower) => {
            let target = updatedEnemies.find((en) => {
              const dx = en.x - tower.x;
              const dy = en.y - tower.y;
              return Math.sqrt(dx * dx + dy * dy) <= tower.range;
            });
            if (target) {
              target.hp -= tower.damage * tapBuffMultiplier * 0.1;
            }
          });
          return updatedEnemies.filter((en) => {
            if (en.hp <= 0) {
              setGold((g) => g + 5);
              return false;
            }
            return true;
          });
        });
      }, 50);
    }
    return () => clearInterval(gameLoopRef.current);
  }, [isPaused, towers, tapBuffMultiplier]);

  // ===== START WAVE =====
  useEffect(() => {
    spawnWave();
  }, [wave]);

  // ===== RENDER =====
  return (
    <div
      className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-green-300 to-blue-400"
      onClick={handleTap}
    >
      {/* HUD */}
      <div className="absolute top-2 left-2 flex gap-4 glass-panel p-2 rounded-lg text-white">
        <span><FaCoins /> {gold}</span>
        <span><FaHeart /> {lives}</span>
        <span>Wave {wave}</span>
        <button onClick={() => setIsPaused(!isPaused)}><FaPause /></button>
      </div>

      {/* Game area */}
      <div
        className="absolute top-0 left-0 w-full h-full"
        onClick={handlePlaceTower}
      >
        {towers.map((tower) => (
          <motion.div
            key={tower.id}
            className="absolute bg-white bg-opacity-30 rounded-full border border-white backdrop-blur-md flex items-center justify-center text-lg"
            style={{
              width: 40,
              height: 40,
              left: tower.x - 20,
              top: tower.y - 20
            }}
          >
            {tower.icon}
          </motion.div>
        ))}
        {enemies.map((enemy, i) => (
          <motion.div
            key={i}
            className="absolute bg-red-500 rounded-full"
            style={{
              width: 20,
              height: 20,
              left: enemy.x - 10,
              top: enemy.y - 10
            }}
          />
        ))}
      </div>

      {/* Floating tap texts */}
      {floatingTexts.map((t) => (
        <motion.div
          key={t.id}
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.8 }}
          className="absolute text-yellow-300 font-bold"
          style={{ left: t.x, top: t.y }}
        >
          {t.text}
        </motion.div>
      ))}

      {/* Bottom tower selection */}
      <div className="absolute bottom-0 w-full flex justify-around glass-panel p-2">
        {Object.entries(towerTypes).map(([key, tower]) => (
          <button
            key={key}
            className="flex flex-col items-center"
            onClick={() => setSelectedTowerType(key)}
          >
            {tower.icon}
            <span className="text-xs">{tower.cost}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ===== Glassmorphism helper styles =====
const styles = `
.glass-panel {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}
`;
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

