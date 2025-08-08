"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame, Snowflake, Zap, Leaf,
  Coins, Heart, Pause, Play, Dice6, Merge, RotateCw, Timer, Wand2,
} from "lucide-react";

/**
 * Tap Tap: Towers — integrated & mobile-first (v1.2)
 * Layout: header (HUD) → meta row (timer/combo) → playfield → footer (actions)
 * Notes:
 * - 5x3 auto-place board
 * - Merge two identical element+level → stats add, level+1
 * - Global tap combo: tap anywhere, no button; boosts dmg+rof
 * - L1 units can hit anywhere. L2+ must be in range
 * - 20s waves; boss every 10
 * - Rewards:
 *   • normal kills → Tower Coins (+gold for summons)
 *   • boss kill → renown + house levels + tap coins (scaled)
 * - Save/Load with /api/towers
 */

const BOARD_W = 5;
const BOARD_H = 3;
const TICK_MS = 50;

const START_GOLD = 50;
const START_LIVES = 20;

const SUMMON_BASE = 20;
const SUMMON_SCALE = 1.18;

const WAVE_MS = 20000;

// combo
const COMBO_ADD = 14;
const COMBO_DECAY_PER_SEC = 22;
const COMBO_MAX = 100;
const comboMult = (c) => 1 + 0.8 * (c / COMBO_MAX); // 1.0→1.8 dmg; rof uses half of bonus

// elements
const ELEMENTS = ["pyro", "frost", "volt", "nature"];
const COLORS = {
  pyro: "#FF6A3D",
  frost: "#71D1F4",
  volt: "#A78BFA",
  nature: "#34D399",
};
const ICONS = { pyro: Flame, frost: Snowflake, volt: Zap, nature: Leaf };

// base stats
const UNIT_BASE = {
  pyro:   { dmg: 10, rof: 1.6, range: 140, aoe: 30 },
  frost:  { dmg:  8, rof: 1.5, range: 150, slow: 0.4, slowMs: 900 },
  volt:   { dmg:  7, rof: 2.0, range: 160, chains: 2, falloff: 0.65 },
  nature: { dmg:  7, rof: 1.5, range: 150, rootChance: 0.12, rootMs: 700, allyBuff: 0.06 },
};

function levelStats(base, lvl) {
  if (lvl <= 1) return { ...base };
  const mult = 1 + (lvl - 1) * 0.5;
  return {
    ...base,
    dmg: Math.round(base.dmg * mult),
    rof: base.rof + (lvl - 1) * 0.2,
    range: Math.round(base.range * (1 + (lvl - 1) * 0.05)),
    aoe: base.aoe ? Math.round(base.aoe * (1 + (lvl - 1) * 0.1)) : undefined,
    chains: base.chains ? Math.min(6, base.chains + Math.floor((lvl - 1) / 2)) : undefined,
    falloff: base.falloff,
    slow: base.slow,
    slowMs: base.slowMs ? base.slowMs + (lvl - 1) * 60 : undefined,
    rootChance: base.rootChance ? Math.min(0.8, base.rootChance + (lvl - 1) * 0.02) : undefined,
    rootMs: base.rootMs ? base.rootMs + (lvl - 1) * 60 : undefined,
    allyBuff: base.allyBuff ? base.allyBuff + (lvl - 1) * 0.02 : undefined,
  };
}

function addStats(a, b) {
  const out = { ...a };
  for (const k of Object.keys(b)) if (typeof b[k] === "number") out[k] = (out[k] || 0) + b[k];
  return out;
}

// enemies
const ENEMY_T = {
  grunt: (w) => ({ hp: 26 + w * 9, speed: 1.0 + w * 0.02, drop: 3, r: 10 }),
  swift: (w) => ({ hp: 20 + w * 7, speed: 1.45 + w * 0.025, drop: 3, r: 9 }),
  tank:  (w) => ({ hp: 75 + w * 18, speed: 0.7 + w * 0.015, drop: 6, r: 13 }),
  shield:(w) => ({ hp: 40 + w * 10, shield: 28 + w * 9, speed: 0.9 + w * 0.02, drop: 6, r: 12 }),
  boss:  (w) => ({ hp: 550 + w * 120, speed: 0.9 + w * 0.02, drop: 50, r: 18 }),
};

const now = () => Date.now();
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const rid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
const lerp = (a, b, t) => a + (b - a) * t;

export default function TowersPage() {
  // container (device) sizes
  const deviceRef = useRef(null);

  // ====== GAME STATE ======
  const [gold, setGold]                 = useState(START_GOLD);
  const [lives, setLives]               = useState(START_LIVES);
  const [renown, setRenown]             = useState(0);
  const [towerCoins, setTowerCoins]     = useState(0);
  const [houseLevel, setHouseLevel]     = useState(1);
  const [tapCoins, setTapCoins]         = useState(0);

  const [wave, setWave]                 = useState(1);
  const [paused, setPaused]             = useState(false);
  const [gameOver, setGameOver]         = useState(false);

  const [summonCost, setSummonCost]     = useState(SUMMON_BASE);

  const [board, setBoard]               = useState([]); // {id, element, level, stats, cell, _cd}
  const [mergeMode, setMergeMode]       = useState(false);
  const [mergeSrc, setMergeSrc]         = useState(null);

  const [combo, setCombo]               = useState(0);

  const [enemies, setEnemies]           = useState([]);

  const saveIdRef                       = useRef(null);

  // refs to calculate deltas for save()
  const initRenownRef = useRef(0);
  const initTowerRef  = useRef(0);
  const initHouseRef  = useRef(1);
  const initTapRef    = useRef(0);

  // wave scheduling
  const spawnQRef     = useRef([]);
  const spawnGapRef   = useRef(600);
  const spawnTimerRef = useRef(0);
  const waveEndRef    = useRef(now() + WAVE_MS);
  const [waveLeft, setWaveLeft] = useState(WAVE_MS / 1000);

  // floaters
  const [floaters, setFloaters] = useState([]);
  function fx(x, y, color = "#fff", text = "•") {
    const id = rid();
    setFloaters((f) => [...f, { id, x, y, color, text }]);
    setTimeout(() => setFloaters((f) => f.filter((t) => t.id !== id)), 650);
  }

  // ====== LAYOUT (real vertical layout) ======
  // playfield measured area for enemies + tiles
  const fieldRef = useRef(null);
  const [fieldRect, setFieldRect] = useState({ w: 320, h: 420, x: 0, y: 0 });

  useEffect(() => {
    // set up observer to keep field measurements correct
    const el = fieldRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setFieldRect({ w: r.width, h: r.height, x: r.left, y: r.top });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 5 x 3 grid cell centers inside the field
  const cells = useMemo(() => {
    const padding = 14;
    const w = Math.max(260, fieldRect.w - padding * 2);
    const h = Math.max(300, fieldRect.h - padding * 2);
    const left = padding;
    const top  = padding;
    const cw = w / BOARD_W;
    const ch = h / BOARD_H;
    const arr = [];
    for (let y = 0; y < BOARD_H; y++) {
      for (let x = 0; x < BOARD_W; x++) {
        arr.push({
          cx: Math.round(left + x * cw + cw / 2),
          cy: Math.round(top  + y * ch + ch / 2),
          w: cw, h: ch,
        });
      }
    }
    return arr;
  }, [fieldRect]);

  // path uses the field area (no absolute % magic)
  const pathPoints = useMemo(() => {
    const inset = 24;
    const left  = inset;
    const right = fieldRect.w - inset;
    const y1    = Math.round(fieldRect.h * 0.22);
    const y2    = Math.round(fieldRect.h * 0.68);
    return [
      { x: left - 36,  y: y1 },
      { x: right,      y: y1 },
      { x: right,      y: y2 },
      { x: left,       y: y2 },
      { x: left,       y: y1 },
      { x: right + 36, y: y1 },
    ];
  }, [fieldRect]);

  // ===== INITIAL LOAD =====
  useEffect(() => {
    const sid = localStorage.getItem("towersSaveId") || (() => {
      const id = rid(); localStorage.setItem("towersSaveId", id); return id;
    })();
    saveIdRef.current = sid;

    (async () => {
      try {
        const userId = localStorage.getItem("userId");
        const pin    = localStorage.getItem("pin");
        const res = await fetch("/api/towers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "load", saveId: sid, userId: userId ? +userId : undefined, pin }),
        });
        const json = await res.json();
        if (json?.gameData) restore(json.gameData);
        else startWave(1);
      } catch {
        startWave(1);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== WAVES =====
  function startWave(w) {
    setWave(w);
    queueWave(w);
    waveEndRef.current = now() + WAVE_MS;
    setWaveLeft(Math.ceil(WAVE_MS / 1000));
  }
  function waveBlueprint(w) {
    const list = [];
    const count = 12 + Math.floor(w * 1.8);
    for (let i = 0; i < count; i++) {
      const t = i % 10 === 9 ? "swift" : i % 8 === 7 ? "shield" : i % 6 === 5 ? "tank" : "grunt";
      const base = ENEMY_T[t](w);
      list.push({ type: t, base });
    }
    if (w % 10 === 0) list.push({ type: "boss", base: ENEMY_T.boss(w) });
    return list;
  }
  function queueWave(w) {
    const bp = waveBlueprint(w);
    spawnQRef.current = bp;
    spawnGapRef.current = Math.max(250, Math.floor(WAVE_MS / (bp.length + 2)));
    spawnTimerRef.current = 0;
  }

  function spawnEnemy(desc) {
    const a = pathPoints[0] || { x: 0, y: 0 };
    const e = {
      id: rid(),
      kind: desc.type,
      hp: desc.base.hp,
      shieldHp: desc.base.shield ? Math.round(desc.base.shield) : 0,
      speed: desc.base.speed,
      drop: desc.base.drop,
      r: desc.base.r,
      seg: 0, t: 0,
      x: a.x, y: a.y,
      slowUntil: 0, rootedUntil: 0,
      reached: false,
    };
    setEnemies((p) => [...p, e]);
  }

  // ===== MAIN LOOP =====
  useEffect(() => {
    if (paused || gameOver) return;
    const iv = setInterval(() => {
      const leftMs = Math.max(0, waveEndRef.current - now());
      setWaveLeft(Math.ceil(leftMs / 1000));

      spawnTimerRef.current += TICK_MS;
      if (spawnQRef.current.length > 0 && spawnTimerRef.current >= spawnGapRef.current && leftMs > 0) {
        spawnTimerRef.current = 0;
        const next = spawnQRef.current.shift();
        spawnEnemy(next);
      }

      // move
      setEnemies((prev) => {
        const arr = prev.map((e) => {
          if (e.rootedUntil > now()) return { ...e };
          const A = pathPoints[e.seg];
          const B = pathPoints[e.seg + 1];
          if (!B) return { ...e, reached: true };
          const len = Math.max(1, dist(A.x, A.y, B.x, B.y));
          const speed = e.speed * (e.slowUntil > now() ? 0.45 : 1);
          let t = e.t + speed / len;
          let seg = e.seg;
          while (t >= 1 && pathPoints[seg + 1]) { t -= 1; seg++; }
          const P = pathPoints[seg];
          const Q = pathPoints[seg + 1] || P;
          return { ...e, seg, t, x: lerp(P.x, Q.x, t), y: lerp(P.y, Q.y, t) };
        });

        // leaks
        let leaks = 0;
        const survivors = [];
        for (const e of arr) e.reached ? leaks++ : survivors.push(e);
        if (leaks) setLives((L) => L - leaks);
        return survivors;
      });

      // attacks
      setEnemies((prevE) => {
        if (!prevE.length || !board.length) return prevE;
        const m = comboMult(combo);
        let arr = prevE.map((e) => ({ ...e }));

        for (const u of board) {
          u._cd = u._cd ?? 0;
          u._cd -= TICK_MS;
          const rof = (u.stats.rof || 1) * (1 + (m - 1) * 0.5);
          const fireEvery = Math.max(100, 1000 / rof);
          if (u._cd > 0) continue;
          u._cd = fireEvery;

          let cands = arr.map((e, idx) => ({ e, idx }));
          if (u.level > 1) {
            // respect range
            const p = cells[u.cell] || { cx: 0, cy: 0 };
            const R = u.stats.range || 140;
            cands = cands
              .map((o) => ({ ...o, d: dist(o.e.x, o.e.y, p.cx, p.cy) }))
              .filter((o) => o.d <= R);
          }
          if (!cands.length) continue;

          // choose furthest along path
          cands.sort((a, b) => (b.e.seg - a.e.seg) || (b.e.t - a.e.t));
          const dmg0 = u.stats.dmg * m * (1 + (u.stats.allyBuff || 0));

          if (u.element === "pyro") {
            const tgt = cands[0].e;
            const rad = u.stats.aoe || 30;
            arr = arr.map((e) => dist(e.x, e.y, tgt.x, tgt.y) <= rad ? damage(e, dmg0) : e);
            fx(tgt.x, tgt.y, COLORS.pyro);

          } else if (u.element === "frost") {
            const t = cands[0];
            const T = { ...arr[t.idx] };
            T.slowUntil = Math.max(T.slowUntil || 0, now() + (u.stats.slowMs || 900));
            arr[t.idx] = damage(T, dmg0);
            fx(T.x, T.y, COLORS.frost);

          } else if (u.element === "volt") {
            let dmg = dmg0;
            let last = cands[0];
            arr[last.idx] = damage(arr[last.idx], dmg);
            fx(last.e.x, last.e.y, COLORS.volt);
            let hops = 0;
            while (hops < (u.stats.chains || 2)) {
              const n = arr
                .map((e, idx) => ({ e, idx, d: dist(e.x, e.y, last.e.x, last.e.y) }))
                .filter((o) => o.idx !== last.idx)
                .sort((a, b) => a.d - b.d)[0];
              if (!n) break;
              hops++; dmg *= u.stats.falloff || 0.65; last = n;
              arr[last.idx] = damage(arr[last.idx], dmg);
              fx(last.e.x, last.e.y, COLORS.volt);
            }

          } else if (u.element === "nature") {
            const t = cands[0];
            const T = { ...arr[t.idx] };
            if (Math.random() < (u.stats.rootChance || 0.12)) {
              T.rootedUntil = Math.max(T.rootedUntil || 0, now() + (u.stats.rootMs || 700));
            }
            arr[t.idx] = damage(T, dmg0);
            fx(T.x, T.y, COLORS.nature);
          }
        }

        // rewards + cleanup
        let goldGain = 0, towerGain = 0, renGain = 0, houseGain = 0, tapGain = 0;
        const alive = [];
        for (const e of arr) {
          if (e.hp <= 0) {
            goldGain += e.drop;
            towerGain += e.drop;
            if (e.kind === "boss") {
              const renA = Math.floor(Math.random() * 26) + 25;   // 25-50
              const renB = Math.floor(Math.random() * 51) + 100; // 100-150 gift
              renGain += renA + renB;
              const hA = Math.floor(Math.random() * 3) + 1;
              const hB = Math.floor(Math.random() * 3) + 1;
              houseGain += hA + hB;
              const bossIndex = Math.max(1, Math.floor(wave / 10));
              tapGain += 50_000_000 * bossIndex;
            }
          } else alive.push(e);
        }
        if (goldGain)   setGold((g) => g + goldGain);
        if (towerGain)  setTowerCoins((v) => v + towerGain);
        if (renGain)    setRenown((v) => v + renGain);
        if (houseGain)  setHouseLevel((v) => v + houseGain);
        if (tapGain)    setTapCoins((v) => v + tapGain);

        // next wave
        if (alive.length === 0 && spawnQRef.current.length === 0 && now() >= waveEndRef.current) {
          setTimeout(() => !paused && !gameOver && startWave(wave + 1), 500);
        }
        return alive;
      });

      // combo decay
      setCombo((c) => clamp(c - (COMBO_DECAY_PER_SEC * (TICK_MS / 1000)), 0, COMBO_MAX));

      // death
      setLives((L) => (L <= 0 ? (setGameOver(true), 0) : L));
    }, TICK_MS);

    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, gameOver, board, cells, wave, pathPoints]);

  function damage(e, dmg) {
    let left = dmg;
    if (e.shieldHp > 0) { const s = Math.min(left, e.shieldHp); e.shieldHp -= s; left -= s; }
    if (left > 0) e.hp -= left;
    return e;
  }

  function onTap() { setCombo((c) => clamp(c + COMBO_ADD, 0, COMBO_MAX)); }

  // ===== MERGE & SUMMON =====
  function onCellTap(i) {
    const u = board.find((b) => b.cell === i);
    if (!mergeMode || !u) return;

    if (!mergeSrc) { setMergeSrc(u.id); return; }
    if (mergeSrc === u.id) { setMergeSrc(null); return; }

    const src = board.find((b) => b.id === mergeSrc);
    if (!src) return;

    if (src.element !== u.element || src.level !== u.level) { setMergeSrc(null); return; }

    const stats = addStats(src.stats, u.stats);
    const merged = { id: rid(), element: u.element, level: u.level + 1, stats, cell: u.cell, _cd: 0 };
    setBoard((prev) => [...prev.filter((x) => x.id !== src.id && x.id !== u.id), merged]);
    setMergeSrc(null);
  }

  function firstEmpty() {
    const occ = new Set(board.map((b) => b.cell));
    for (let i = 0; i < BOARD_W * BOARD_H; i++) if (!occ.has(i)) return i;
    return -1;
  }
  function summon() {
    if (gold < summonCost) return;
    const i = firstEmpty();
    if (i < 0) return;
    const el = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];
    const lvl = 1;
    const base = levelStats(UNIT_BASE[el], lvl);
    setBoard((p) => [...p, { id: rid(), element: el, level: lvl, stats: { ...base }, cell: i, _cd: 0 }]);
    setGold((g) => g - summonCost);
    setSummonCost((c) => Math.ceil(c * SUMMON_SCALE));
  }

  // ===== SAVE / LOAD HELPERS =====
  async function save() {
    try {
      const userId = localStorage.getItem("userId");
      const pin    = localStorage.getItem("pin");

      const renGain   = renown   - (initRenownRef.current ?? 0);
      const towGain   = towerCoins - (initTowerRef.current ?? 0);
      const houseGain = houseLevel - (initHouseRef.current ?? 1);
      const coinGain  = tapCoins - (initTapRef.current ?? 0);

      const gameData = {
        gold, lives, wave, board, enemies, summonCost, timestamp: now(),
        // if logged out, persist currencies locally; logged-in handled server-side
        renownTokens: userId ? 0 : renown,
        towerCoins:   userId ? 0 : towerCoins,
      };

      const res = await fetch("/api/towers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          saveId: saveIdRef.current,
          userId: userId ? +userId : undefined,
          pin,
          gameData,
          renownGain: userId ? renGain   : undefined,
          towerCoinGain: userId ? towGain : undefined,
          houseGain: userId ? houseGain   : undefined,
          coinGain: userId ? coinGain     : undefined,
        }),
      });

      if (res.ok) {
        initRenownRef.current = renown;
        initTowerRef.current  = towerCoins;
        initHouseRef.current  = houseLevel;
        initTapRef.current    = tapCoins;
      }
    } catch {}
  }

  function restore(g) {
    setGold(g.gold ?? START_GOLD);
    setLives(g.lives ?? START_LIVES);
    setWave(g.wave ?? 1);
    setBoard(g.board ?? []);
    setEnemies(g.enemies ?? []);
    setSummonCost(g.summonCost ?? SUMMON_BASE);

    setRenown(g.renownTokens ?? 0);
    setTowerCoins(g.towerCoins ?? 0);
    setHouseLevel(g.houseLevel ?? 1);
    setTapCoins(g.tapCoins ?? 0);

    initRenownRef.current = g.renownTokens ?? 0;
    initTowerRef.current  = g.towerCoins ?? 0;
    initHouseRef.current  = g.houseLevel ?? 1;
    initTapRef.current    = g.tapCoins ?? 0;

    setCombo(0); setMergeMode(false); setMergeSrc(null); setGameOver(false);
    waveEndRef.current = now() + WAVE_MS;
    queueWave(g.wave ?? 1);
    setWaveLeft(Math.ceil(WAVE_MS / 1000));
  }

  function resetGame() {
    setGold(START_GOLD); setLives(START_LIVES);
    setRenown(0); setTowerCoins(0); setHouseLevel(1); setTapCoins(0);
    setWave(1); setBoard([]); setEnemies([]); setSummonCost(SUMMON_BASE);
    setCombo(0); setMergeMode(false); setMergeSrc(null); setGameOver(false);
    startWave(1);
  }

  // images (swap later)
  const towerCoinImg = "https://ucarecdn.com/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/-/format/auto/";
  const renownImg    = "https://ucarecdn.com/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/-/format/auto/";
  const bgImg        = "https://ucarecdn.com/cccccccc-cccc-cccc-cccc-cccccccccccc/-/format/auto/";

  // ===== RENDER =====
  return (
    <div className="min-h-[100svh] w-full flex items-center justify-center bg-[radial-gradient(ellipse_at_top_left,rgba(54,88,214,0.35),transparent_40%),radial-gradient(ellipse_at_bottom_right,rgba(255,98,146,0.35),transparent_45%),linear-gradient(180deg,#101319,#0B0D12)]">
      {/* bg image slot */}
      <div className="absolute inset-0 opacity-25 pointer-events-none"
        style={{ backgroundImage:`url("${bgImg}")`, backgroundSize:"cover", backgroundPosition:"center", mixBlendMode:"screen" }} />

      {/* device container */}
      <div
        ref={deviceRef}
        className="relative w-[min(100vw,420px)] h-[min(100svh,860px)] rounded-[28px] border border-white/15 bg-white/5 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.45)] overflow-hidden flex flex-col"
        onPointerDown={onTap}
      >
        {/* ===== HEADER HUD ===== */}
        <div className="px-3 pt-3">
          <div className="glass rounded-xl text-white px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm whitespace-nowrap">
              <div className="inline-flex items-center gap-1">
                <img src={towerCoinImg} className="w-4 h-4 object-contain" alt="Tower Coins"/>
                <span className="font-semibold">Tower Coins</span>
                <span className="tabular-nums">{towerCoins}</span>
              </div>
              <div className="inline-flex items-center gap-1">
                <Coins size={14}/><span className="tabular-nums">{gold}</span>
              </div>
              <div className="inline-flex items-center gap-1">
                <Heart size={14}/><span className="tabular-nums">{lives}</span>
              </div>
              <div className="inline-flex items-center gap-1"><span>Wave</span><span className="tabular-nums">{wave}</span></div>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn" onClick={(e)=>{e.stopPropagation(); setPaused(p=>!p);}} aria-label={paused?"Resume":"Pause"}>
                {paused ? <Play size={16}/> : <Pause size={16}/>}
              </button>
              <button className="btn" onClick={(e)=>{e.stopPropagation(); save();}} aria-label="Save"><RotateCw size={16}/></button>
            </div>
          </div>
        </div>

        {/* ===== META ROW ===== */}
        <div className="px-3 mt-2">
          <div className="grid grid-cols-2 gap-2 text-white">
            <div className="glass rounded-xl px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs"><Timer size={14}/><span>Wave Time</span></div>
              <div className="font-mono text-sm whitespace-nowrap">{String(waveLeft).padStart(2,"0")}s</div>
            </div>
            <div className="glass rounded-xl px-3 py-2">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="inline-flex items-center gap-1"><Wand2 size={12}/> Combo</span>
                <span className="font-mono">{Math.round(combo)}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden">
                <div className="h-full bg-white" style={{ width:`${(combo/COMBO_MAX)*100}%` }} />
              </div>
              <div className="text-[10px] opacity-80 mt-1">
                Mult: {comboMult(combo).toFixed(2)}× dmg / {(1+(comboMult(combo)-1)*0.5).toFixed(2)}× rof
              </div>
            </div>
          </div>
        </div>

        {/* ===== PLAYFIELD ===== */}
        <div ref={fieldRef} className="mt-3 flex-1 mx-3 relative">
          {/* field glass */}
          <div className="absolute inset-0 rounded-3xl border border-white/20 bg-white/10 backdrop-blur-xl" />
          {/* enemies */}
          {enemies.map((e)=>(
            <motion.div key={e.id} className="absolute rounded-full z-10"
              style={{
                left: e.x - e.r, top: e.y - e.r, width: e.r*2, height: e.r*2,
                background: e.kind==="boss" ? "linear-gradient(135deg,#FFD54F,#FF7043)"
                           : e.kind==="shield" ? "linear-gradient(135deg,#90CAF9,#42A5F5)"
                           : "linear-gradient(135deg,#F87171,#EF4444)",
                border:"1px solid rgba(255,255,255,0.65)", boxShadow:"0 6px 16px rgba(0,0,0,.35)"
              }} />
          ))}
          {/* cells */}
          {cells.map((c, idx)=>{
            const unit = board.find((b)=>b.cell===idx);
            const isSrc = unit && unit.id===mergeSrc;
            return (
              <div key={idx} className="absolute"
                style={{ left:c.cx-26, top:c.cy-26, width:52, height:52 }}
                onPointerDown={(e)=>{e.stopPropagation(); onCellTap(idx);}}>
                <div className="w-full h-full rounded-xl border"
                  style={{
                    borderColor: isSrc? "#fff" : "rgba(255,255,255,0.28)",
                    background:"rgba(255,255,255,0.10)", backdropFilter:"blur(8px)",
                    boxShadow: isSrc? "0 0 14px rgba(255,255,255,0.85)":"0 2px 8px rgba(0,0,0,0.25)",
                  }}
                />
                {unit && <UnitBadge unit={unit} color={COLORS[unit.element]}/>}
              </div>
            );
          })}
          {/* floaters */}
          <AnimatePresence>
            {floaters.map((f)=>(
              <motion.div key={f.id} initial={{opacity:1,y:0}} animate={{opacity:0,y:-18}} exit={{opacity:0}} transition={{duration:.6}}
                className="absolute text-xs font-semibold pointer-events-none"
                style={{ left:f.x, top:f.y, color:f.color }}>{f.text}</motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* ===== FOOTER ===== */}
        <div className="px-3 pb-3 mt-3">
          <div className="glass rounded-2xl px-3 py-2 text-white">
            <div className="flex items-center gap-2">
              <button className={`btn flex-1 ${gold < summonCost ? "opacity-60" : ""}`}
                onPointerDown={(e)=>{e.stopPropagation(); summon();}} disabled={gold < summonCost}>
                <Dice6 size={16}/><span className="ml-1 text-xs">Summon ({summonCost})</span>
              </button>
              <button className={`btn flex-1 ${mergeMode ? "ring-2 ring-white" : ""}`}
                onPointerDown={(e)=>{e.stopPropagation(); setMergeMode(m=>!m); setMergeSrc(null);}}>
                <Merge size={16}/><span className="ml-1 text-xs whitespace-nowrap">{mergeMode ? "Merge: ON":"Merge: OFF"}</span>
              </button>
              <button className="btn flex-1" onPointerDown={(e)=>{e.stopPropagation(); resetGame();}}>
                <RotateCw size={16}/><span className="ml-1 text-xs">Restart</span>
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <div className="inline-flex items-center gap-1">
                <img src={towerCoinImg} className="w-4 h-4 object-contain" alt="Tower Coins"/><span className="tabular-nums">{towerCoins}</span>
              </div>
              <div className="inline-flex items-center gap-1">
                <img src={renownImg} className="w-4 h-4 object-contain" alt="Renown"/><span className="tabular-nums">{renown}</span>
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
      {unit.level > 1 && <div className="absolute -inset-6 rounded-[18px] pointer-events-none" style={{ boxShadow:`0 0 0 2px ${ring}` }}/>}
      <div className="text-white text-[10px] font-bold absolute top-1 left-1 px-1.5 py-0.5 rounded-md"
           style={{ background:`${color}55`, border:`1px solid ${color}88` }}>L{unit.level}</div>
      <Icon size={20} style={{ color, filter:"drop-shadow(0 2px 6px rgba(0,0,0,.35))" }}/>
    </div>
  );
}

const styles = `
.glass { background: rgba(255,255,255,0.10); backdrop-filter: blur(14px);
  border: 1px solid rgba(255,255,255,0.22); box-shadow: 0 10px 36px rgba(0,0,0,0.35); }
.btn { display:inline-flex; align-items:center; justify-content:center;
  background: rgba(255,255,255,0.18); border:1px solid rgba(255,255,255,0.28);
  border-radius: 12px; padding: 8px 10px; font-size:12px; line-height:1; box-shadow:0 6px 16px rgba(0,0,0,0.25);}
`;
