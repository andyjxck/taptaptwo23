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
 * Tap Tap: Towers — Lucky-Defense-style, Tap-first
 * ------------------------------------------------
 * - 5x3 board (slots). Summon auto-places on first empty slot; costs scale.
 * - Merge: toggle Merge Mode → tap Unit A → tap Unit B (same element & level).
 *   Result = level+1, stats = A + B (we use additive stats so “literally adds” makes sense).
 * - No local boosts. Only global tap boost driven by tap-speed combo meter.
 *   Tap anywhere (including empty space) to keep the combo alive.
 *   Multiplier = 1.0 → 1.8 based on combo; also speeds up RoF slightly.
 * - Targeting:
 *   • Level 1 units (the “weakest ones”) can shoot ANY enemy on the board.
 *   • Level 2+ units must have the enemy inside their fixed range zone.
 * - Waves: 20s timer per wave, spawns paced across that time. Boss on wave 10, 20, …
 * - Mobile-first glass UI + placeholders for images (background, coins, tokens).
 * - Save/Load via /api/towers (anonymous saveId in localStorage).
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
const COMBO_ADD = 14;        // per tap
const COMBO_DECAY_PER_SEC = 22; // natural decay
const COMBO_MAX = 100;       // cap
// Dmg/Speed multiplier curve (1.0 → 1.8 as combo goes 0→100)
const comboMultiplier = (combo) => 1 + 0.8 * (combo / COMBO_MAX);

// --- Elements / visuals ---
const ELEMENTS = ["pyro", "frost", "volt", "nature"];
const COLORS = {
  pyro: "#FF6A3D",
  frost: "#71D1F4",
  volt: "#A78BFA",
  nature: "#34D399",
};
const ICONS = { pyro: Flame, frost: Snowflake, volt: Zap, nature: Leaf };

// --- Unit base stats (additive-friendly) ---
// rof = shots per second (additive-friendly too). range in px.
const UNIT_BASE = {
  pyro:   { dmg: 10, rof: 1.6, range: 140, aoe: 30 },
  frost:  { dmg: 8,  rof: 1.5, range: 150, slow: 0.4, slowMs: 900 },
  volt:   { dmg: 7,  rof: 2.0, range: 160, chains: 2, falloff: 0.65 },
  nature: { dmg: 7,  rof: 1.5, range: 150, rootChance: 0.12, rootMs: 700, allyBuff: 0.06 },
};

// Level scaling used for *initial* creation at that level (merges add on top anyway)
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

// Additive merge: literally sum numeric properties
function addStats(a, b) {
  const out = { ...a };
  for (const k of Object.keys(b)) {
    if (typeof b[k] === "number") out[k] = (out[k] || 0) + b[k];
  }
  return out;
}

// Enemy templates (per wave)
const ENEMY_TYPES = {
  grunt: (w) => ({ hp: 26 + w * 9, speed: 1.0 + w * 0.02, gold: 3, r: 10 }),
  swift: (w) => ({ hp: 20 + w * 7, speed: 1.45 + w * 0.025, gold: 3, r: 9 }),
  tank:  (w) => ({ hp: 75 + w * 18, speed: 0.7 + w * 0.015, gold: 6, r: 13 }),
  shield:(w) => ({ hp: 40 + w * 10, shield: 28 + w * 9, speed: 0.9 + w * 0.02, gold: 6, r: 12 }),
  boss:  (w) => ({ hp: 550 + w * 120, speed: 0.9 + w * 0.02, gold: 50, r: 18 }),
};

// Helpers
const now = () => Date.now();
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const rid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
const lerp = (a, b, t) => a + (b - a) * t;

export default function TowersPage() {
  // Layout
  const containerRef = useRef(null);
  const [rect, setRect] = useState({ w: 360, h: 640 });

  // Game
  const [gold, setGold] = useState(START_GOLD);
  const [lives, setLives] = useState(START_LIVES);
  const [renownTokens, setRenownTokens] = useState(0);

  const [wave, setWave] = useState(1);
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  // Summon
  const [summonCost, setSummonCost] = useState(SUMMON_BASE);

  // Board
  const [board, setBoard] = useState([]); // { id, element, level, stats, cellIndex, cd }
  const [mergeMode, setMergeMode] = useState(false);
  const [mergeSrcId, setMergeSrcId] = useState(null);

  // Taps (global)
  const [combo, setCombo] = useState(0);
  const lastTapRef = useRef(0);

  // Enemies & spawns
  const [enemies, setEnemies] = useState([]);
  const spawnQueueRef = useRef([]);
  const spawnEveryRef = useRef(600); // ms between spawns inside a wave
  const spawnTimerRef = useRef(0);
  const waveEndAtRef = useRef(now() + WAVE_DURATION_MS);
  const [waveTimeLeft, setWaveTimeLeft] = useState(WAVE_DURATION_MS / 1000);

  // Save
  const saveIdRef = useRef(null);

  // Board cell centers (for rendering units)
  const cells = useMemo(() => {
    const areaW = rect.w * 0.84;
    const areaH = rect.h * 0.5;
    const cx = rect.w / 2;
    const cy = rect.h * 0.52;

    const left = cx - areaW / 2;
    const top = cy - areaH / 2;

    const cellW = areaW / BOARD_W;
    const cellH = areaH / BOARD_H;

    const arr = [];
    for (let y = 0; y < BOARD_H; y++) {
      for (let x = 0; x < BOARD_W; x++) {
        arr.push({
          x: Math.round(left + x * cellW + cellW / 2),
          y: Math.round(top + y * cellH + cellH / 2),
        });
      }
    }
    return arr;
  }, [rect]);

  // Path points (serpentine two-lane look)
  const pathPoints = useMemo(() => {
    const inset = 54;
    const left = inset;
    const right = rect.w - inset;
    const y1 = rect.h * 0.25;
    const y2 = rect.h * 0.62;
    const entryX = left - 40;
    const exitX = right + 40;
    return [
      { x: entryX, y: y1 },
      { x: right, y: y1 },
      { x: right, y: y2 },
      { x: left, y: y2 },
      { x: left, y: y1 },
      { x: exitX, y: y1 },
    ];
  }, [rect]);

  // Resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setRect({ w: r.width, h: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Init / load
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
        const res = await fetch("/api/towers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "load", saveId: sid }),
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

  // Create a wave blueprint
  function makeWave(w) {
    const list = [];
    const count = 12 + Math.floor(w * 1.8);
    for (let i = 0; i < count; i++) {
      const t =
        i % 10 === 9
          ? "swift"
          : i % 8 === 7
          ? "shield"
          : i % 6 === 5
          ? "tank"
          : "grunt";
      const base =
        t === "swift"
          ? ENEMY_TYPES.swift(w)
          : t === "shield"
          ? ENEMY_TYPES.shield(w)
          : t === "tank"
          ? ENEMY_TYPES.tank(w)
          : ENEMY_TYPES.grunt(w);
      list.push({ type: t, base });
    }
    if (w % 10 === 0) list.push({ type: "boss", base: ENEMY_TYPES.boss(w) });
    return list;
  }

  function enqueueWave(w) {
    spawnQueueRef.current = makeWave(w);
    spawnEveryRef.current = Math.max(250, Math.floor(WAVE_DURATION_MS / (spawnQueueRef.current.length + 2)));
    spawnTimerRef.current = 0;
  }

  // Spawn a specific enemy descriptor into the field
  function spawnEnemy(desc) {
    const a = pathPoints[0];
    const b = pathPoints[1];
    const e = {
      id: rid(),
      kind: desc.type,
      hp: desc.base.hp,
      shieldHp: desc.base.shield ? Math.round(desc.base.shield) : 0,
      speed: desc.base.speed,
      gold: desc.base.gold,
      r: desc.base.r,
      seg: 0,     // current segment index along path
      t: 0,       // segment interpolation 0..1
      x: a.x,
      y: a.y,
      slowUntil: 0,
      rootedUntil: 0,
    };
    setEnemies((prev) => [...prev, e]);
  }

  // Game loop
  useEffect(() => {
    if (paused || gameOver) return;
    const iv = setInterval(() => {
      // Wave timer
      const leftMs = Math.max(0, waveEndAtRef.current - now());
      setWaveTimeLeft(Math.ceil(leftMs / 1000));

      // Spawn pacing within wave window
      spawnTimerRef.current += TICK_MS;
      if (spawnQueueRef.current.length > 0 && spawnTimerRef.current >= spawnEveryRef.current && leftMs > 0) {
        spawnTimerRef.current = 0;
        const next = spawnQueueRef.current.shift();
        spawnEnemy(next);
      }

      // Move enemies
      setEnemies((prev) => {
        let arr = prev.map((e) => {
          if (e.rootedUntil > now()) return { ...e }; // rooted, no move

          const pA = pathPoints[e.seg];
          const pB = pathPoints[e.seg + 1];
          if (!pB) return { ...e, reached: true };

          const len = Math.max(1, dist(pA.x, pA.y, pB.x, pB.y));
          const spd = e.speed * (e.slowUntil > now() ? 0.45 : 1);
          const dt = (spd / len);
          let t = e.t + dt;
          let seg = e.seg;
          while (t >= 1 && pathPoints[seg + 1]) {
            t -= 1;
            seg++;
          }
          const A = pathPoints[seg];
          const B = pathPoints[seg + 1] || A;
          const x = lerp(A.x, B.x, t);
          const y = lerp(A.y, B.y, t);

          return { ...e, seg, t, x, y };
        });

        // Reached core -> lose life
        const survivors = [];
        let lost = 0;
        for (const e of arr) {
          if (e.reached) lost++;
          else survivors.push(e);
        }
        if (lost) setLives((l) => l - lost);
        return survivors;
      });

      // Defenders attack
      setEnemies((prevEnemies) => {
        if (!prevEnemies.length || !board.length) return prevEnemies;
        const m = comboMultiplier(combo); // dmg / rof global multiplier

        // clone enemies
        let arr = prevEnemies.map((e) => ({ ...e }));

        for (const unit of board) {
          unit._cd = unit._cd ?? 0;
          unit._cd -= TICK_MS / (1000 / 1000); // normalized
          const rof = (unit.stats.rof || 1) * (1 + (m - 1) * 0.5); // rof also benefits but less than dmg
          const fireEveryMs = Math.max(100, 1000 / rof);

          if (unit._cd > 0) continue;
          unit._cd = fireEveryMs;

          // Choose target set
          let targets = arr;
          if (unit.level > 1) {
            // level 2+ must be in range
            const p = cells[unit.cellIndex];
            targets = arr
              .map((e, idx) => ({ e, idx, d: dist(e.x, e.y, p.x, p.y) }))
              .filter((o) => o.d <= (unit.stats.range || 140));
          } else {
            // level 1 can hit anywhere (no filtering)
            targets = arr.map((e, idx) => ({ e, idx, d: 0 }));
          }

          if (!targets.length) continue;

          // Prioritize closest to end (highest segment then highest t)
          targets.sort((a, b) => (b.e.seg - a.e.seg) || (b.e.t - a.e.t));

          const dmgBase = unit.stats.dmg * m * (1 + (unit.stats.allyBuff || 0));

          if (unit.element === "pyro") {
            const primary = targets[0].e;
            // AoE splash
            arr = arr.map((e, idx) => {
              const within = dist(e.x, e.y, primary.x, primary.y) <= (unit.stats.aoe || 28);
              return within ? applyDamage(e, dmgBase) : e;
            });
            hitFx(primary.x, primary.y, COLORS.pyro);

          } else if (unit.element === "frost") {
            const tgt = targets[0];
            const t = { ...arr[tgt.idx] };
            t.slowUntil = Math.max(t.slowUntil || 0, now() + (unit.stats.slowMs || 900));
            arr[tgt.idx] = applyDamage(t, dmgBase);
            hitFx(t.x, t.y, COLORS.frost);

          } else if (unit.element === "volt") {
            let hops = 0;
            let dmg = dmgBase;
            let last = targets[0];
            arr[last.idx] = applyDamage(arr[last.idx], dmg);
            hitFx(last.e.x, last.e.y, COLORS.volt);
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
            const tgt = targets[0];
            const t = { ...arr[tgt.idx] };
            if (Math.random() < (unit.stats.rootChance || 0.1)) {
              t.rootedUntil = Math.max(t.rootedUntil || 0, now() + (unit.stats.rootMs || 600));
            }
            arr[tgt.idx] = applyDamage(t, dmgBase);
            hitFx(t.x, t.y, COLORS.nature);
          }
        }

        // Cleanup + gold
        let earned = 0;
        const alive = [];
        for (const e of arr) {
          if (e.hp <= 0) earned += e.gold;
          else alive.push(e);
        }
        if (earned) setGold((g) => g + earned);

        // If wave time ended AND no enemies left AND queue empty → next wave
        if (alive.length === 0 && spawnQueueRef.current.length === 0 && now() >= waveEndAtRef.current) {
          setTimeout(() => {
            if (!paused && !gameOver) startWave(wave + 1);
          }, 600);
        }

        return alive;
      });

      // Combo decay
      setCombo((c) => clamp(c - (COMBO_DECAY_PER_SEC * (TICK_MS / 1000)), 0, COMBO_MAX));

      // Death check
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

  // --- Input ---
  function onTap(e) {
    // Global tap: increase combo regardless of merge mode (so tapping always helps)
    setCombo((c) => clamp(c + COMBO_ADD, 0, COMBO_MAX));
    lastTapRef.current = now();
  }

  // Merge interactions
  function onCellTap(cellIdx) {
    const u = board.find((b) => b.cellIndex === cellIdx);
    if (!mergeMode) {
      // no local boosts anymore; tapping board is just for merge when enabled
      return;
    }
    if (!u) return;

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

    // Must match element & level
    if (src.element !== u.element || src.level !== u.level) {
      setMergeSrcId(null);
      return;
    }

    // Merge: stats = statsA + statsB; level+1 at u's spot, free src's cell.
    const merged = addStats(src.stats, u.stats);
    const newUnit = {
      id: rid(),
      element: u.element,
      level: u.level + 1,
      stats: merged,
      cellIndex: u.cellIndex,
      _cd: 0,
    };

    setBoard((prev) => {
      const keep = prev.filter((x) => x.id !== src.id && x.id !== u.id);
      // place merged at u cell; src cell becomes empty (auto-place uses first empty anyway)
      return [...keep, newUnit];
    });
    setMergeSrcId(null);
  }

  // Summon
  function firstEmptyCell() {
    const occupied = new Set(board.map((b) => b.cellIndex));
    for (let i = 0; i < BOARD_W * BOARD_H; i++) {
      if (!occupied.has(i)) return i;
    }
    return -1;
  }

  function summon() {
    if (gold < summonCost) return;
    const idx = firstEmptyCell();
    if (idx < 0) return; // full
    const element = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];
    const level = 1;
    const base = levelInitStats(UNIT_BASE[element], level);
    setBoard((prev) => [
      ...prev,
      { id: rid(), element, level, stats: { ...base }, cellIndex: idx, _cd: 0 },
    ]);
    setGold((g) => g - summonCost);
    setSummonCost((c) => Math.ceil(c * SUMMON_SCALE));
  }

  // Save/Load
  async function save() {
    try {
      await fetch("/api/towers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          saveId: saveIdRef.current,
          gameData: {
            gold,
            lives,
            renownTokens,
            wave,
            board,
            enemies,
            summonCost,
            timestamp: now(),
          },
        }),
      });
    } catch {}
  }

  function restore(g) {
    setGold(g.gold ?? START_GOLD);
    setLives(g.lives ?? START_LIVES);
    setRenownTokens(g.renownTokens ?? 0);
    setWave(g.wave ?? 1);
    setBoard(g.board ?? []);
    setEnemies(g.enemies ?? []);
    setSummonCost(g.summonCost ?? SUMMON_BASE);
    waveEndAtRef.current = now() + WAVE_DURATION_MS;
    enqueueWave(g.wave ?? 1);
    setWaveTimeLeft(Math.ceil(WAVE_DURATION_MS / 1000));
  }

  function resetGame() {
    setGold(START_GOLD);
    setLives(START_LIVES);
    setRenownTokens(0);
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

  // UI helpers
  const coinImg =
    "https://ucarecdn.com/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/-/format/auto/"; // 🔁 replace with your coin image
  const tokenImg =
    "https://ucarecdn.com/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/-/format/auto/"; // 🔁 replace with renown token image
  const bgImg =
    "https://ucarecdn.com/cccccccc-cccc-cccc-cccc-cccccccccccc/-/format/auto/"; // 🔁 replace with your background image

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[100svh] overflow-hidden"
      onPointerDown={onTap}
      style={{
        backgroundImage: `url("${bgImg}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Backdrop gradient overlay (glassy layer) */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/40" />

      {/* Top HUD */}
      <div className="absolute top-2 left-2 right-2 z-20">
        <div className="glass flex items-center justify-between px-3 py-2 rounded-xl text-white">
          <div className="flex items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1">
              <img src={coinImg} alt="Coins" className="w-4 h-4 object-contain" />
              {gold}
            </span>
            <span className="inline-flex items-center gap-1">
              <Heart size={14} /> {lives}
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

        {/* Wave timer + Combo meter */}
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
              <span className="inline-flex items-center gap-1">
                <Wand2 size={12} /> Combo
              </span>
              <span className="font-mono">{Math.round(combo)}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden">
              <div className="h-full bg-white" style={{ width: `${(combo / COMBO_MAX) * 100}%` }} />
            </div>
            <div className="text-[10px] opacity-80 mt-1">
              Mult: {comboMultiplier(combo).toFixed(2)}× dmg / { (1 + (comboMultiplier(combo)-1)*0.5).toFixed(2)}× rof
            </div>
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="absolute inset-x-0 top-[22%] bottom-[18%] z-10">
        {/* board frame */}
        <div className="absolute inset-4 rounded-3xl border border-white/25 bg-white/10 backdrop-blur-xl shadow-2xl" />
        {/* cells */}
        {cells.map((c, idx) => {
          const unit = board.find((b) => b.cellIndex === idx);
          const isSrc = unit && unit.id === mergeSrcId;
          return (
            <div
              key={idx}
              className="absolute"
              style={{ left: c.x - 28, top: c.y - 28, width: 56, height: 56 }}
              onPointerDown={(e) => {
                e.stopPropagation();
                onCellTap(idx);
              }}
            >
              <div
                className="w-full h-full rounded-xl border"
                style={{
                  borderColor: isSrc ? "#fff" : "rgba(255,255,255,0.35)",
                  background: "rgba(255,255,255,0.12)",
                  backdropFilter: "blur(8px)",
                  boxShadow: isSrc ? "0 0 16px rgba(255,255,255,0.8)" : "0 2px 10px rgba(0,0,0,0.25)",
                }}
              />
              {unit && <UnitBadge unit={unit} color={COLORS[unit.element]} />}
            </div>
          );
        })}
      </div>

      {/* Enemies on path */}
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
                ? "linear-gradient(135deg, #FFD54F, #FF7043)"
                : e.kind === "shield"
                ? "linear-gradient(135deg, #90CAF9, #42A5F5)"
                : "linear-gradient(135deg, #F87171, #EF4444)",
            border: "1px solid rgba(255,255,255,0.6)",
            boxShadow: "0 3px 10px rgba(0,0,0,0.35)",
          }}
        />
      ))}

      {/* Controls Dock */}
      <div className="absolute bottom-2 left-2 right-2 z-20">
        <div className="glass rounded-2xl px-3 py-2 text-white">
          <div className="flex items-center gap-2">
            <button
              className={`btn flex-1 ${gold < summonCost ? "opacity-60" : ""}`}
              onPointerDown={(e) => {
                e.stopPropagation();
                summon();
              }}
              disabled={gold < summonCost}
            >
              <Dice6 size={16} />
              <span className="ml-1 text-xs">Summon ({summonCost})</span>
            </button>

            <button
              className={`btn flex-1 ${mergeMode ? "ring-2 ring-white" : ""}`}
              onPointerDown={(e) => {
                e.stopPropagation();
                setMergeMode((m) => !m);
                setMergeSrcId(null);
              }}
            >
              <Merge size={16} />
              <span className="ml-1 text-xs">{mergeMode ? "Merge: ON" : "Merge: OFF"}</span>
            </button>

            <button
              className="btn flex-1"
              onPointerDown={(e) => {
                e.stopPropagation();
                resetGame();
              }}
            >
              <RotateCw size={16} />
              <span className="ml-1 text-xs">Restart</span>
            </button>
          </div>

          {/* token / images area (customizable) */}
          <div className="mt-2 flex items-center justify-center gap-4 text-xs">
            <div className="inline-flex items-center gap-1 opacity-90">
              <img src={tokenImg} alt="Renown" className="w-4 h-4 object-contain" />
              <span>{renownTokens}</span>
            </div>
            <div className="opacity-70">Tap faster = stronger global boost</div>
          </div>
        </div>
      </div>

      {/* Pause / GameOver curtains */}
      <AnimatePresence>
        {(paused || gameOver) && (
          <motion.div
            className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-sm text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {gameOver ? (
              <div className="glass px-5 py-4 rounded-xl text-center">
                <div className="text-lg font-bold mb-2">Defenses Fallen</div>
                <div className="mb-3">Wave {wave}</div>
                <div className="flex gap-2 justify-center">
                  <button className="btn" onClick={resetGame}>
                    <RotateCw size={16} /> <span className="ml-1 text-xs">Retry</span>
                  </button>
                  <button className="btn" onClick={() => setGameOver(false)}>
                    <Play size={16} /> <span className="ml-1 text-xs">Watch Field</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="glass px-5 py-4 rounded-xl text-center">
                <div className="mb-2">Paused</div>
                <button className="btn" onClick={() => setPaused(false)}>
                  <Play size={16} /> <span className="ml-1 text-xs">Resume</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{styles}</style>
    </div>
  );
}

function UnitBadge({ unit, color }) {
  const Icon = ICONS[unit.element];
  return (
    <div className="absolute inset-0 rounded-xl flex items-center justify-center">
      <div
        className="absolute inset-0 rounded-xl"
        style={{
          boxShadow: `inset 0 0 0 2px ${color}66, 0 8px 16px rgba(0,0,0,0.25)`,
        }}
      />
      <div className="text-white text-xs font-bold absolute top-1 left-1 px-1.5 py-0.5 rounded-md"
        style={{ background: `${color}55`, border: `1px solid ${color}88` }}>
        L{unit.level}
      </div>
      <Icon size={20} style={{ color }} />
    </div>
  );
}

const styles = `
.glass {
  background: rgba(255,255,255,0.12);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.35);
  box-shadow: 0 10px 30px rgba(0,0,0,0.25);
}
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.18);
  border: 1px solid rgba(255,255,255,0.35);
  border-radius: 12px;
  padding: 8px 10px;
  font-size: 12px;
  line-height: 1;
  box-shadow: 0 6px 16px rgba(0,0,0,0.25);
}
`;
