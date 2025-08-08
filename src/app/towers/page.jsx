"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  Snowflake,
  Zap,
  Leaf,
  Coins,
  Heart,
  Pause,
  Play,
  Dice6,
  Merge,
  RotateCw,
  Timer,
  Wand2,
} from "lucide-react";

/**
 * Tap Tap: Towers — Lucky-Defense-style, Tap-first (v1.1)
 * CHANGES:
 * - FIX: defined hitFx() + floater system (no more ReferenceError)
 * - VISUALS: centered mobile "device" viewport, nicer glass, soft gradient bg, cleaner spacing
 * - REQUIREMENTS from you:
 *   • 5x3 board
 *   • Summon auto-place (scaling cost)
 *   • Merge two same element & level => level+1; stats literally add together
 *   • Global tap combo (no button): tap anywhere to raise; boosts dmg + rof globally
 *   • No local boosts
 *   • L1 units = global targeting; L2+ = fixed range
 *   • Waves: 20s timer, spawns paced; boss every 10 waves
 *   • Mobile-first, glass UI, placeholders for images (bg/coins/tokens)
 */

const BOARD_W = 5;
const BOARD_H = 3;
const TICK_MS = 50;

const START_GOLD = 50;
const START_LIVES = 20;

const SUMMON_BASE = 20;
const SUMMON_SCALE = 1.18;

const WAVE_DURATION_MS = 20000; // 20s visible timer

// --- Combo (global tap) ---
const COMBO_ADD = 14;            // per tap
const COMBO_DECAY_PER_SEC = 22;  // bigger drains faster
const COMBO_MAX = 100;
const comboMultiplier = (combo) => 1 + 0.8 * (combo / COMBO_MAX); // 1.0 → 1.8

// Elements
const ELEMENTS = ["pyro", "frost", "volt", "nature"];
const COLORS = {
  pyro: "#FF6A3D",
  frost: "#71D1F4",
  volt: "#A78BFA",
  nature: "#34D399",
};
const ICONS = { pyro: Flame, frost: Snowflake, volt: Zap, nature: Leaf };

// Base stats (additive-friendly)
const UNIT_BASE = {
  pyro:   { dmg: 10, rof: 1.6, range: 140, aoe: 30 },
  frost:  { dmg:  8, rof: 1.5, range: 150, slow: 0.4, slowMs: 900 },
  volt:   { dmg:  7, rof: 2.0, range: 160, chains: 2, falloff: 0.65 },
  nature: { dmg:  7, rof: 1.5, range: 150, rootChance: 0.12, rootMs: 700, allyBuff: 0.06 },
};

function levelInitStats(base, level) {
  if (level <= 1) return { ...base };
  const mult = 1 + (level - 1) * 0.5;
  return {
    ...base,
    dmg: Math.round(base.dmg * mult),
    rof: base.rof + (level - 1) * 0.2,
    range: Math.round(base.range * (1 + (level - 1) * 0.05)),
    aoe: base.aoe ? Math.round(base.aoe * (1 + (level - 1) * 0.1)) : undefined,
    chains: base.chains ? Math.min(6, base.chains + Math.floor((level - 1) / 2)) : undefined,
    falloff: base.falloff,
    slow: base.slow,
    slowMs: base.slowMs ? base.slowMs + (level - 1) * 60 : undefined,
    rootChance: base.rootChance ? Math.min(0.8, base.rootChance + (level - 1) * 0.02) : undefined,
    rootMs: base.rootMs ? base.rootMs + (level - 1) * 60 : undefined,
    allyBuff: base.allyBuff ? base.allyBuff + (level - 1) * 0.02 : undefined,
  };
}

// Additive merge
function addStats(a, b) {
  const out = { ...a };
  for (const k of Object.keys(b)) {
    if (typeof b[k] === "number") out[k] = (out[k] || 0) + b[k];
  }
  return out;
}

// Enemies
const ENEMY_TYPES = {
  grunt: (w) => ({ hp: 26 + w * 9, speed: 1.0 + w * 0.02, gold: 3, r: 10 }),
  swift: (w) => ({ hp: 20 + w * 7, speed: 1.45 + w * 0.025, gold: 3, r: 9 }),
  tank:  (w) => ({ hp: 75 + w * 18, speed: 0.7 + w * 0.015, gold: 6, r: 13 }),
  shield:(w) => ({ hp: 40 + w * 10, shield: 28 + w * 9, speed: 0.9 + w * 0.02, gold: 6, r: 12 }),
  boss:  (w) => ({ hp: 550 + w * 120, speed: 0.9 + w * 0.02, gold: 50, r: 18 }),
};

const now = () => Date.now();
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const rid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
const lerp = (a, b, t) => a + (b - a) * t;

export default function TowersPage() {
  // Layout
  const rootRef = useRef(null);
  const [rect, setRect] = useState({ w: 390, h: 844 }); // phone-ish

  // Game state
  const [gold, setGold] = useState(START_GOLD);
  const [lives, setLives] = useState(START_LIVES);
  const [renownTokens, setRenownTokens] = useState(0);
  const [towerCoins, setTowerCoins] = useState(0);
  const [houseLevel, setHouseLevel] = useState(1);
  const [tapCoins, setTapCoins] = useState(0);

  const [wave, setWave] = useState(1);
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  // Summon
  const [summonCost, setSummonCost] = useState(SUMMON_BASE);

  // Board and merge
  const [board, setBoard] = useState([]); // { id, element, level, stats, cellIndex, _cd }
  const [mergeMode, setMergeMode] = useState(false);
  const [mergeSrcId, setMergeSrcId] = useState(null);

  // Taps (global combo)
  const [combo, setCombo] = useState(0);

  // Enemies & spawns
  const [enemies, setEnemies] = useState([]);
  const spawnQueueRef = useRef([]);
  const spawnEveryRef = useRef(600);
  const spawnTimerRef = useRef(0);
  const waveEndAtRef = useRef(now() + WAVE_DURATION_MS);
  const [waveTimeLeft, setWaveTimeLeft] = useState(WAVE_DURATION_MS / 1000);

  // Floaters / hit effects
  const [floaters, setFloaters] = useState([]);
  function hitFx(x, y, color = "#fff", text = "•") {
    const id = rid();
    setFloaters((f) => [...f, { id, x, y, color, text }]);
    setTimeout(() => {
      setFloaters((f) => f.filter((t) => t.id !== id));
    }, 600);
  }

  // Save ID (for towers_progress table)
  const saveIdRef = useRef(null);

  // Initial values for global stats (for calculating gains)
  const initialRenownRef = useRef(0);
  const initialTowerCoinsRef = useRef(0);
  const initialHouseRef = useRef(1);
  const initialCoinsRef = useRef(0);

  // Cell center coordinates for board grid
  const cells = useMemo(() => {
    const areaW = rect.w * 0.88;
    const areaH = rect.h * 0.50;
    const cx = rect.w / 2;
    const cy = rect.h * 0.53;
    const left = cx - areaW / 2;
    const top = cy - areaH / 2;
    const cellW = areaW / BOARD_W;
    const cellH = areaH / BOARD_H;
    const arr = [];
    for (let y = 0; y < BOARD_H; y++) {
      for (let x = 0; x < BOARD_W; x++) {
        arr.push({ x: Math.round(left + x * cellW + cellW / 2), y: Math.round(top + y * cellH + cellH / 2) });
      }
    }
    return arr;
  }, [rect]);

  // Precomputed path points for enemies
  const pathPoints = useMemo(() => {
    const inset = 40;
    const left = inset;
    const right = rect.w - inset;
    const y1 = rect.h * 0.25;
    const y2 = rect.h * 0.62;
    const entryX = left - 40;
    const exitX = right + 40;
    return [
      { x: entryX, y: y1 },
      { x: right,  y: y1 },
      { x: right,  y: y2 },
      { x: left,   y: y2 },
      { x: left,   y: y1 },
      { x: exitX,  y: y1 },
    ];
  }, [rect]);

  // Resize observer to maintain centered device frame
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setRect({ w: r.width, h: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Initial load: fetch saved game and global profile data
  useEffect(() => {
    const sid =
      localStorage.getItem("towersSaveId") ||
      (() => {
        const id = rid();
        localStorage.setItem("towersSaveId", id);
        return id;
      })();
    saveIdRef.current = sid;

    (async () => {
      try {
        const storedUserId = localStorage.getItem("userId");
        const storedPin = localStorage.getItem("pin");
        const res = await fetch("/api/towers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            action: "load", 
            saveId: sid, 
            userId: storedUserId ? parseInt(storedUserId, 10) : undefined, 
            pin: storedPin || undefined 
          }),
        });
        const json = await res.json();
        if (json?.gameData) {
          restore(json.gameData);
        } else {
          startWave(1);
        }
      } catch {
        startWave(1);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start a wave
  function startWave(w) {
    setWave(w);
    enqueueWave(w);
    waveEndAtRef.current = now() + WAVE_DURATION_MS;
    setWaveTimeLeft(Math.ceil(WAVE_DURATION_MS / 1000));
  }

  // Construct an enemy spawn list for wave w
  function makeWave(w) {
    const list = [];
    const count = 12 + Math.floor(w * 1.8);
    for (let i = 0; i < count; i++) {
      const t = i % 10 === 9 ? "swift" : i % 8 === 7 ? "shield" : i % 6 === 5 ? "tank" : "grunt";
      const base = t === "swift" ? ENEMY_TYPES.swift(w) 
                  : t === "shield" ? ENEMY_TYPES.shield(w) 
                  : t === "tank" ? ENEMY_TYPES.tank(w) 
                  : ENEMY_TYPES.grunt(w);
      list.push({ type: t, base });
    }
    if (w % 10 === 0) list.push({ type: "boss", base: ENEMY_TYPES.boss(w) });
    return list;
  }

  // Enqueue a wave's enemies to spawn
  function enqueueWave(w) {
    const blueprint = makeWave(w);
    spawnQueueRef.current = blueprint;
    spawnEveryRef.current = Math.max(250, Math.floor(WAVE_DURATION_MS / (blueprint.length + 2)));
    spawnTimerRef.current = 0;
  }

  // Spawn a single enemy from a descriptor
  function spawnEnemy(desc) {
    const a = pathPoints[0];
    const e = {
      id: rid(),
      kind: desc.type,
      hp: desc.base.hp,
      shieldHp: desc.base.shield ? Math.round(desc.base.shield) : 0,
      speed: desc.base.speed,
      gold: desc.base.gold,
      r: desc.base.r,
      seg: 0,
      t: 0,
      x: a.x,
      y: a.y,
      slowUntil: 0,
      rootedUntil: 0,
      reached: false,
    };
    setEnemies((prev) => [...prev, e]);
  }

  // Main game loop (runs at TICK_MS interval)
  useEffect(() => {
    if (paused || gameOver) return;
    const iv = setInterval(() => {
      // Wave timer countdown
      const leftMs = Math.max(0, waveEndAtRef.current - now());
      setWaveTimeLeft(Math.ceil(leftMs / 1000));

      // Spawn enemies on schedule
      spawnTimerRef.current += TICK_MS;
      if (spawnQueueRef.current.length > 0 && spawnTimerRef.current >= spawnEveryRef.current && leftMs > 0) {
        spawnTimerRef.current = 0;
        const next = spawnQueueRef.current.shift();
        spawnEnemy(next);
      }

      // Move enemies along the path
      setEnemies((prev) => {
        let arr = prev.map((e) => {
          if (e.rootedUntil > now()) return { ...e }; // if rooted, no movement this tick
          const pA = pathPoints[e.seg];
          const pB = pathPoints[e.seg + 1];
          if (!pB) return { ...e, reached: true };
          const len = Math.max(1, dist(pA.x, pA.y, pB.x, pB.y));
          const speed = e.speed * (e.slowUntil > now() ? 0.45 : 1);
          let t = e.t + speed / len;
          let seg = e.seg;
          while (t >= 1 && pathPoints[seg + 1]) {
            t -= 1;
            seg++;
          }
          const A = pathPoints[seg];
          const B = pathPoints[seg + 1] || A;
          return { ...e, seg, t, x: lerp(A.x, B.x, t), y: lerp(A.y, B.y, t) };
        });

        // Check for enemies reaching the end
        const survivors = [];
        let leaks = 0;
        for (const e of arr) {
          if (e.reached) leaks++;
          else survivors.push(e);
        }
        if (leaks) setLives((L) => L - leaks);
        return survivors;
      });

      // Defenders attack
      setEnemies((prevEnemies) => {
        if (!prevEnemies.length || !board.length) return prevEnemies;
        const m = comboMultiplier(combo);
        let arr = prevEnemies.map((e) => ({ ...e }));

        for (const unit of board) {
          unit._cd = unit._cd ?? 0;
          unit._cd -= TICK_MS;
          const rof = (unit.stats.rof || 1) * (1 + (m - 1) * 0.5);
          const fireEvery = Math.max(100, 1000 / rof);
          if (unit._cd > 0) continue;
          unit._cd = fireEvery;

          // Target selection
          let candidates = arr.map((e, idx) => ({ e, idx }));
          if (unit.level > 1) {
            const p = cells[unit.cellIndex];
            const R = unit.stats.range || 140;
            candidates = candidates
              .map((o) => ({ ...o, d: dist(o.e.x, o.e.y, p.x, p.y) }))
              .filter((o) => o.d <= R);
          }
          if (!candidates.length) continue;

          // Target the enemy furthest along the path
          candidates.sort((a, b) => (b.e.seg - a.e.seg) || (b.e.t - a.e.t));
          const dmgBase = unit.stats.dmg * m * (1 + (unit.stats.allyBuff || 0));

          if (unit.element === "pyro") {
            // Pyro: AOE explosion around target
            const center = candidates[0].e;
            const radius = unit.stats.aoe || 28;
            arr = arr.map((e) => (dist(e.x, e.y, center.x, center.y) <= radius ? applyDamage(e, dmgBase) : e));
            hitFx(center.x, center.y, COLORS.pyro);

          } else if (unit.element === "frost") {
            // Frost: slow target
            const t = candidates[0];
            const target = { ...arr[t.idx] };
            target.slowUntil = Math.max(target.slowUntil || 0, now() + (unit.stats.slowMs || 900));
            arr[t.idx] = applyDamage(target, dmgBase);
            hitFx(target.x, target.y, COLORS.frost);

          } else if (unit.element === "volt") {
            // Volt: chain lightning
            let dmg = dmgBase;
            let last = candidates[0];
            arr[last.idx] = applyDamage(arr[last.idx], dmg);
            hitFx(last.e.x, last.e.y, COLORS.volt);
            let hops = 0;
            while (hops < (unit.stats.chains || 2)) {
              const next = arr
                .map((e, idx) => ({ e, idx, d: dist(e.x, e.y, last.e.x, last.e.y) }))
                .filter((o) => o.idx !== last.idx)
                .sort((a, b) => a.d - b.d)[0];
              if (!next) break;
              hops++;
              dmg *= unit.stats.falloff || 0.65;
              last = next;
              arr[last.idx] = applyDamage(arr[last.idx], dmg);
              hitFx(last.e.x, last.e.y, COLORS.volt);
            }

          } else if (unit.element === "nature") {
            // Nature: chance to root target
            const t = candidates[0];
            const target = { ...arr[t.idx] };
            if (Math.random() < (unit.stats.rootChance || 0.1)) {
              target.rootedUntil = Math.max(target.rootedUntil || 0, now() + (unit.stats.rootMs || 600));
            }
            arr[t.idx] = applyDamage(target, dmgBase);
            hitFx(target.x, target.y, COLORS.nature);
          }
        }

        // Cleanup defeated enemies and accumulate rewards
        let goldEarned = 0;
        let towerCoinsEarned = 0;
        let renownEarned = 0;
        let houseEarned = 0;
        let tapCoinsEarned = 0;
        const alive = [];
        for (const e of arr) {
          if (e.hp <= 0) {
            goldEarned += e.gold;
            towerCoinsEarned += e.gold;
            if (e.kind === "boss") {
              // Boss rewards
              const renownBase = Math.floor(Math.random() * 26) + 25;    // 25–50 Renown Tokens
              const renownBonus = Math.floor(Math.random() * 51) + 100; // 100–150 Renown Tokens (Mystery Gift)
              renownEarned += renownBase + renownBonus;
              const houseBase = Math.floor(Math.random() * 3) + 1;      // 1–3 House Levels
              const houseBonus = Math.floor(Math.random() * 3) + 1;     // 1–3 House Levels (Mystery Gift)
              houseEarned += houseBase + houseBonus;
              const bossIndex = Math.floor(wave / 10);                 // boss wave index (1 for wave10, 2 for wave20, etc.)
              const tapReward = 50_000_000 * bossIndex;                // Tap Coins reward (50M * boss number)
              tapCoinsEarned += tapReward;
            }
          } else {
            alive.push(e);
          }
        }
        if (goldEarned) setGold((g) => g + goldEarned);
        if (towerCoinsEarned) setTowerCoins((c) => c + towerCoinsEarned);
        if (renownEarned) setRenownTokens((r) => r + renownEarned);
        if (houseEarned) setHouseLevel((h) => h + houseEarned);
        if (tapCoinsEarned) setTapCoins((tc) => tc + tapCoinsEarned);

        // If wave is over and all enemies are defeated, start next wave after a short pause
        if (alive.length === 0 && spawnQueueRef.current.length === 0 && now() >= waveEndAtRef.current) {
          setTimeout(() => !paused && !gameOver && startWave(wave + 1), 500);
        }
        return alive;
      });

      // Decay combo meter
      setCombo((c) => clamp(c - (COMBO_DECAY_PER_SEC * (TICK_MS / 1000)), 0, COMBO_MAX));

      // Check for game over
      setLives((L) => {
        if (L <= 0) {
          setGameOver(true);
          return 0;
        }
        return L;
      });
    }, TICK_MS);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, gameOver, board, cells, wave]);

  function applyDamage(e, dmg) {
    let left = dmg;
    if (e.shieldHp > 0) {
      const s = Math.min(left, e.shieldHp);
      e.shieldHp -= s;
      left -= s;
    }
    if (left > 0) e.hp -= left;
    return e;
  }

  // Tap anywhere to increase combo meter
  function onTap() {
    setCombo((c) => clamp(c + COMBO_ADD, 0, COMBO_MAX));
  }

  // Handle cell tap for merging units
  function onCellTap(cellIdx) {
    const u = board.find((b) => b.cellIndex === cellIdx);
    if (!mergeMode || !u) return;
    if (!mergeSrcId) {
      setMergeSrcId(u.id);
      return;
    }
    if (mergeSrcId === u.id) {
      setMergeSrcId(null);
      return;
    }
    const src = board.find((b) => b.id === mergeSrcId);
    if (!src) return;
    if (src.element !== u.element || src.level !== u.level) {
      setMergeSrcId(null);
      return;
    }
    // Merge two units of same element & level into one higher-level unit
    const mergedStats = addStats(src.stats, u.stats);
    const newUnit = {
      id: rid(),
      element: u.element,
      level: u.level + 1,
      stats: mergedStats,
      cellIndex: u.cellIndex,
      _cd: 0,
    };
    setBoard((prev) => {
      const remaining = prev.filter((x) => x.id !== src.id && x.id !== u.id);
      return [...remaining, newUnit];
    });
    setMergeSrcId(null);
  }

  // Summon a new unit at first empty cell
  function firstEmptyCell() {
    const occ = new Set(board.map((b) => b.cellIndex));
    for (let i = 0; i < BOARD_W * BOARD_H; i++) {
      if (!occ.has(i)) return i;
    }
    return -1;
  }
  function summon() {
    if (gold < summonCost) return;
    const idx = firstEmptyCell();
    if (idx < 0) return;
    const element = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];
    const level = 1;
    const base = levelInitStats(UNIT_BASE[element], level);
    setBoard((prev) => [...prev, { id: rid(), element, level, stats: { ...base }, cellIndex: idx, _cd: 0 }]);
    setGold((g) => g - summonCost);
    setSummonCost((c) => Math.ceil(c * SUMMON_SCALE));
  }

  // Save game state and update profile progression
  async function save() {
    try {
      const userId = localStorage.getItem("userId");
      const pin = localStorage.getItem("pin");
      // Calculate gains since load
      const renownGain = renownTokens - (initialRenownRef.current || 0);
      const towerCoinGain = towerCoins - (initialTowerCoinsRef.current || 0);
      const houseGain = houseLevel - (initialHouseRef.current || 1);
      const coinGain = tapCoins - (initialCoinsRef.current || 0);
      // Prepare game data to save (exclude global stats if logged in, since those go to profile)
      const gameData = { gold, lives, wave, board, enemies, summonCost, timestamp: now() };
      if (!userId) {
        gameData.renownTokens = renownTokens;
        gameData.towerCoins = towerCoins;
      } else {
        gameData.renownTokens = 0;
        gameData.towerCoins = 0;
      }
      const res = await fetch("/api/towers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          saveId: saveIdRef.current,
          userId: userId ? parseInt(userId, 10) : undefined,
          pin: pin || undefined,
          gameData,
          renownGain: userId ? renownGain : undefined,
          towerCoinGain: userId ? towerCoinGain : undefined,
          houseGain: userId ? houseGain : undefined,
          coinGain: userId ? coinGain : undefined,
        }),
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          // Update initial reference values to current, so further saves only add new gains
          initialRenownRef.current = renownTokens;
          initialTowerCoinsRef.current = towerCoins;
          initialHouseRef.current = houseLevel;
          initialCoinsRef.current = tapCoins;
        }
      }
    } catch {
      // Ignore save errors for now
    }
  }

  // Restore game (and profile) state from loaded data
  function restore(g) {
    setGold(g.gold ?? START_GOLD);
    setLives(g.lives ?? START_LIVES);
    setWave(g.wave ?? 1);
    setBoard(g.board ?? []);
    setEnemies(g.enemies ?? []);
    setSummonCost(g.summonCost ?? SUMMON_BASE);
    setCombo(0);
    setMergeMode(false);
    setMergeSrcId(null);
    setGameOver(false);
    // Set global stats from profile (or offline save)
    setRenownTokens(g.renownTokens ?? 0);
    setTowerCoins(g.towerCoins ?? 0);
    setHouseLevel(g.houseLevel ?? 1);
    setTapCoins(g.tapCoins ?? 0);
    // Initialize baseline references for tracking gains
    initialRenownRef.current = g.renownTokens ?? 0;
    initialTowerCoinsRef.current = g.towerCoins ?? 0;
    initialHouseRef.current = g.houseLevel ?? 1;
    initialCoinsRef.current = g.tapCoins ?? 0;
    // Start the loaded wave
    waveEndAtRef.current = now() + WAVE_DURATION_MS;
    enqueueWave(g.wave ?? 1);
    setWaveTimeLeft(Math.ceil(WAVE_DURATION_MS / 1000));
  }

  // Reset game to initial state (does not affect persistent profile data)
  function resetGame() {
    setGold(START_GOLD);
    setLives(START_LIVES);
    setRenownTokens(0);
    setTowerCoins(0);
    setHouseLevel(1);
    setTapCoins(0);
    setWave(1);
    setBoard([]);
    setEnemies([]);
    setSummonCost(SUMMON_BASE);
    setCombo(0);
    setMergeMode(false);
    setMergeSrcId(null);
    setGameOver(false);
    startWave(1);
  }

  // Image placeholders (to be replaced with actual assets)
  const coinImg  = "https://ucarecdn.com/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/-/format/auto/";
  const tokenImg = "https://ucarecdn.com/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/-/format/auto/";
  const bgImg    = "https://ucarecdn.com/cccccccc-cccc-cccc-cccc-cccccccccccc/-/format/auto/";

  return (
    <div className="relative w-full min-h-[100svh] flex items-center justify-center bg-[radial-gradient(ellipse_at_top_left,rgba(54,88,214,0.35),transparent_40%),radial-gradient(ellipse_at_bottom_right,rgba(255,98,146,0.35),transparent_45%),linear-gradient(180deg,#101319,#0B0D12)]">
      {/* Optional background image overlay */}
      <div
        className="absolute inset-0 opacity-25 pointer-events-none"
        style={{
          backgroundImage: `url("${bgImg}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          mixBlendMode: "screen",
        }}
      />
      {/* Device frame (mobile view) */}
      <div
        ref={rootRef}
        className="relative w-[min(100vw,420px)] h-[min(100svh,860px)] rounded-[28px] border border-white/15 bg-white/6 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.45)] overflow-hidden"
        onPointerDown={onTap}
      >
        {/* Top HUD */}
        <div className="absolute top-3 left-3 right-3 z-20">
          <div className="glass flex items-center justify-between px-3 py-2 rounded-xl text-white">
            <div className="flex items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-1">
                <img src={coinImg} alt="Tower Coins" className="w-4 h-4 object-contain" />
                {towerCoins}
              </span>
              <span className="inline-flex items-center gap-1">
                <Coins size={14} />{gold}
              </span>
              <span className="inline-flex items-center gap-1">
                <Heart size={14} />{lives}
              </span>
              <span>Wave {wave}</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn" onClick={() => setPaused((p) => !p)} aria-label={paused ? "Resume" : "Pause"}>
                {paused ? <Play size={16} /> : <Pause size={16} />}
              </button>
              <button className="btn" onClick={save} aria-label="Save">
                <RotateCw size={16} />
              </button>
            </div>
          </div>
          {/* Wave timer & Combo meter */}
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="glass px-3 py-2 rounded-xl text-white flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <Timer size={14} />
                <span>Wave Time</span>
              </div>
              <div className="font-mono text-sm">{String(waveTimeLeft).padStart(2, "0")}s</div>
            </div>
            <div className="glass px-3 py-2 rounded-xl text-white">
              <div className="flex items-center justify-between mb-1 text-[11px]">
                <span className="inline-flex items-center gap-1"><Wand2 size={12} /> Combo</span>
                <span className="font-mono">{Math.round(combo)}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden">
                <div className="h-full bg-white" style={{ width: `${(combo / COMBO_MAX) * 100}%` }} />
              </div>
              <div className="text-[10px] opacity-80 mt-1">
                Mult: {comboMultiplier(combo).toFixed(2)}× dmg / {(1 + (comboMultiplier(combo)-1)*0.5).toFixed(2)}× rof
              </div>
            </div>
          </div>
        </div>

        {/* Board area */}
        <div className="absolute inset-x-3 top-[16%] bottom-[18%] z-10">
          <div className="absolute inset-0 rounded-3xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-inner" />
          {cells.map((c, idx) => {
            const unit = board.find((b) => b.cellIndex === idx);
            const isSrc = unit && unit.id === mergeSrcId;
            return (
              <div
                key={idx}
                className="absolute"
                style={{ left: c.x - 26, top: c.y - 26, width: 52, height: 52 }}
                onPointerDown={(e) => { e.stopPropagation(); onCellTap(idx); }}
              >
                <div
                  className="w-full h-full rounded-xl border"
                  style={{
                    borderColor: isSrc ? "#fff" : "rgba(255,255,255,0.28)",
                    background: "rgba(255,255,255,0.10)",
                    backdropFilter: "blur(8px)",
                    boxShadow: isSrc ? "0 0 14px rgba(255,255,255,0.85)" : "0 2px 8px rgba(0,0,0,0.25)",
                  }}
                />
                {unit && <UnitBadge unit={unit} color={COLORS[unit.element]} />}
              </div>
            );
          })}
        </div>

        {/* Enemies */}
        {enemies.map((e) => (
          <motion.div
            key={e.id}
            className="absolute rounded-full z-20"
            style={{
              left: e.x - e.r,
              top: e.y - e.r,
              width: e.r * 2,
              height: e.r * 2,
              background:
                e.kind === "boss"
                  ? "linear-gradient(135deg,#FFD54F,#FF7043)"
                  : e.kind === "shield"
                  ? "linear-gradient(135deg,#90CAF9,#42A5F5)"
                  : "linear-gradient(135deg,#F87171,#EF4444)",
              border: "1px solid rgba(255,255,255,0.6)",
              boxShadow: "0 3px 10px rgba(0,0,0,0.35)",
            }}
          />
        ))}

        {/* Floating damage/bonus text */}
        <AnimatePresence>
          {floaters.map((f) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 0, y: -18 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute text-xs font-semibold pointer-events-none"
              style={{ left: f.x, top: f.y, color: f.color }}
            >
              {f.text}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Bottom controls & stats */}
        <div className="absolute bottom-3 left-3 right-3 z-20">
          <div className="glass rounded-2xl px-3 py-2 text-white">
            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                className={`btn flex-1 ${gold < summonCost ? "opacity-60" : ""}`}
                onPointerDown={(e) => { e.stopPropagation(); summon(); }}
                disabled={gold < summonCost}
              >
                <Dice6 size={16} />
                <span className="ml-1 text-xs">Summon ({summonCost})</span>
              </button>
              <button
                className={`btn flex-1 ${mergeMode ? "ring-2 ring-white" : ""}`}
                onPointerDown={(e) => { e.stopPropagation(); setMergeMode((m) => !m); setMergeSrcId(null); }}
              >
                <Merge size={16} />
                <span className="ml-1 text-xs">{mergeMode ? "Merge: ON" : "Merge: OFF"}</span>
              </button>
              <button
                className="btn flex-1"
                onPointerDown={(e) => { e.stopPropagation(); resetGame(); }}
              >
                <RotateCw size={16} />
                <span className="ml-1 text-xs">Restart</span>
              </button>
            </div>
            {/* Persistent currency stats (Tower Coins & Renown Tokens) */}
            <div className="mt-2 flex items-center justify-center gap-4 text-xs">
              <div className="inline-flex items-center gap-1 opacity-90">
                <img src={coinImg} alt="Tower Coins" className="w-4 h-4 object-contain" />
                <span>{towerCoins}</span>
              </div>
              <div className="inline-flex items-center gap-1 opacity-90">
                <img src={tokenImg} alt="Renown" className="w-4 h-4 object-contain" />
                <span>{renownTokens}</span>
              </div>
            </div>
          </div>
        </div>

        <style>{styles}</style>
      </div>
    </div>
  );
}

function UnitBadge({ unit, color }) {
  const Icon = ICONS[unit.element];
  const ring = unit.level > 1 ? `${color}66` : "rgba(255,255,255,0.18)";
  return (
    <div className="absolute inset-0 rounded-xl flex items-center justify-center">
      {/* subtle range hint for L2+ */}
      {unit.level > 1 && (
        <div
          className="absolute -inset-6 rounded-[18px] pointer-events-none"
          style={{ boxShadow: `0 0 0 2px ${ring}` }}
        />
      )}
      <div
        className="text-white text-[10px] font-bold absolute top-1 left-1 px-1.5 py-0.5 rounded-md"
        style={{ background: `${color}55`, border: `1px solid ${color}88` }}
      >
        L{unit.level}
      </div>
      <Icon size={20} style={{ color, filter: "drop-shadow(0 2px 6px rgba(0,0,0,.35))" }} />
    </div>
  );
}

const styles = `
.glass {
  background: rgba(255,255,255,0.10);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(255,255,255,0.22);
  box-shadow: 0 10px 36px rgba(0,0,0,0.35);
}
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.18);
  border: 1px solid rgba(255,255,255,0.28);
  border-radius: 12px;
  padding: 8px 10px;
  font-size: 12px;
  line-height: 1;
  box-shadow: 0 6px 16px rgba(0,0,0,0.25);
}
`;
