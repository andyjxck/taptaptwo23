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
  RotateCw,
  Wand2,
  Merge,
} from "lucide-react";

/**
 * Tap Tap: Arcane Siege — v3.1 (Global Targeting)
 * - CHANGE: All defenders can attack ANY enemy on the board (no range checks).
 *   Target selection = enemy closest to the Arcane Core (highest threat).
 * - Everything else remains from v3 (auto-place, merge-2, surge/overdrive, ultimates, hazards, save/load).
 */

const TICK_MS = 50;
const GLOBAL_SURGE_CD = 4000;
const GLOBAL_SURGE_DURATION = 2000;
const LOCAL_OVERDRIVE_CD = 2000;
const LOCAL_OVERDRIVE_DURATION = 1500;
const ARCANE_PER_TAP = 12;
const ARCANE_MAX = 100;

const START_GOLD = 100;
const START_LIVES = 20;

const NODES = 12;

const ELEMENTS = ["fire", "ice", "storm", "nature"];
const COLORS = {
  fire: "#FF6A3D",
  ice: "#71D1F4",
  storm: "#A78BFA",
  nature: "#34D399",
};

const ENEMIES = {
  swarmer: { hp: 14, speed: 1.2, radius: 10, gold: 3 },
  bruiser: { hp: 40, speed: 0.8, radius: 12, gold: 6 },
  assassin: { hp: 22, speed: 1.6, radius: 10, gold: 5, leap: true },
  shield: { hp: 30, speed: 0.9, radius: 12, gold: 6, shield: 20 },
  boss: { hp: 260, speed: 0.9, radius: 18, gold: 40, aura: true },
};

const UNIT_BASE = {
  fire: {
    name: "Fire Mage",
    icon: Flame,
    base: { dmg: 8, range: 140, rate: 650, aoe: 32 }, // range kept for future but ignored in targeting
  },
  ice: {
    name: "Frost Adept",
    icon: Snowflake,
    base: { dmg: 6, range: 145, rate: 650, slow: 0.45, slowMs: 1200 },
  },
  storm: {
    name: "Spark Shaman",
    icon: Zap,
    base: { dmg: 7, range: 165, rate: 600, chains: 3, falloff: 0.65 },
  },
  nature: {
    name: "Druid",
    icon: Leaf,
    base: { dmg: 6, range: 145, rate: 650, rootMs: 700, rootChance: 0.12, allyBuff: 0.06 },
  },
};

// ---------- helpers ----------
const now = () => Date.now();
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
const rid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
function pickWeighted(pairs) {
  const total = pairs.reduce((a, b) => a + b.w, 0);
  let r = Math.random() * total;
  for (const p of pairs) {
    if (r < p.w) return p.key;
    r -= p.w;
  }
  return pairs[pairs.length - 1].key;
}

// Combine/Double stat rules for merge-2
function mergedStats(a, b) {
  const out = {};
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    const av = a[k] ?? 0;
    const bv = b[k] ?? 0;
    if (k === "rate") {
      out.rate = Math.max(120, Math.round(Math.min(av || 9999, bv || 9999) / 2)); // faster
    } else if (k === "falloff") {
      out.falloff = clamp(((av || 0.65) + (bv || 0.65)) / 2, 0.4, 0.9);
    } else if (k === "slow" || k === "allyBuff") {
      out[k] = clamp((av + bv) * 2, 0, 0.9);
    } else if (k === "rootChance") {
      const pAny = 1 - (1 - av) * (1 - bv);
      out.rootChance = clamp(pAny * 2, 0, 0.85);
    } else if (k === "range") {
      out.range = clamp((av + bv) * 2, 60, 280);
    } else if (k === "chains") {
      out.chains = Math.min(8, (av + bv) * 2 || 0);
    } else if (k === "aoe" || k === "slowMs" || k === "rootMs" || k === "dmg") {
      out[k] = (av + bv) * 2;
    } else {
      if (typeof av === "number" || typeof bv === "number") {
        out[k] = (av + bv) * 2;
      }
    }
  }
  if (!out.dmg) out.dmg = 2;
  if (!out.range) out.range = 120;
  if (!out.rate) out.rate = 600;
  return out;
}

function unitPowerScore(stats) {
  const dps = (stats.dmg || 0) * (1000 / (stats.rate || 600));
  const extras =
    (stats.aoe ? stats.aoe * 0.2 : 0) +
    (stats.chains ? stats.chains * 2 : 0) +
    (stats.slow ? stats.slow * 10 : 0) +
    (stats.rootChance ? stats.rootChance * 12 : 0) +
    (stats.allyBuff ? stats.allyBuff * 10 : 0);
  return dps + extras;
}

// ---------- component ----------
export default function ArcaneSiege() {
  // Layout
  const containerRef = useRef(null);
  const [size, setSize] = useState({ w: 360, h: 640, cx: 180, cy: 320 });
  const [ringAngle, setRingAngle] = useState(0);

  // Game
  const [gold, setGold] = useState(START_GOLD);
  const [lives, setLives] = useState(START_LIVES);
  const [wave, setWave] = useState(1);
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  // Taps
  const [globalBoostUntil, setGlobalBoostUntil] = useState(0);
  const [globalCdUntil, setGlobalCdUntil] = useState(0);
  const [arcane, setArcane] = useState(0);
  const [chosenPath, setChosenPath] = useState(null);

  // Roll / Merge
  const [rollCost, setRollCost] = useState(40);
  const [mergeMode, setMergeMode] = useState(false);
  const [mergeSourceId, setMergeSourceId] = useState(null);

  // Units & enemies
  const [units, setUnits] = useState([]); // {id, element, stats, nodeIndex, localUntil, localCdUntil, level}
  const [enemies, setEnemies] = useState([]);

  // Portals & hazards
  const portalsRef = useRef(4);

  // Floaters
  const [floaters, setFloaters] = useState([]);
  const addFloater = (text, x, y, color = "#FFD76B") => {
    const id = rid();
    setFloaters((p) => [...p, { id, text, x, y, color }]);
    setTimeout(() => setFloaters((p) => p.filter((f) => f.id !== id)), 900);
  };

  // Save id
  const saveIdRef = useRef(null);

  // Nodes positions
  const nodes = useMemo(() => {
    const R = Math.min(size.w, size.h) * 0.36;
    const arr = [];
    for (let i = 0; i < NODES; i++) {
      const a = (i / NODES) * Math.PI * 2 + (ringAngle * Math.PI) / 180;
      arr.push({ x: size.cx + Math.cos(a) * R, y: size.cy + Math.sin(a) * R });
    }
    return arr;
  }, [size, ringAngle]);

  // Resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setSize({ w: r.width, h: r.height, cx: r.width / 2, cy: r.height / 2 });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Start/load
  useEffect(() => {
    const sid =
      localStorage.getItem("arcaneSaveId") ||
      (() => {
        const id = rid();
        localStorage.setItem("arcaneSaveId", id);
        return id;
      })();
    saveIdRef.current = sid;

    (async () => {
      try {
        const res = await fetch("/api/arcanesiege", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "load", saveId: sid }),
        });
        const json = await res.json();
        if (json?.gameData) {
          restore(json.gameData);
        } else {
          spawnWave(1);
        }
      } catch {
        spawnWave(1);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hazards
  useEffect(() => {
    if (wave > 1 && wave % 5 === 0) {
      setRingAngle((a) => a + 20 + Math.floor(Math.random() * 12));
      portalsRef.current = Math.min(8, portalsRef.current + 1);
      addFloater("Battlefield Shift!", size.cx, size.cy, "#FFE57F");
    }
  }, [wave]); // eslint-disable-line

  // Game loop (GLOBAL TARGETING)
  useEffect(() => {
    if (paused || gameOver) return;
    const iv = setInterval(() => {
      setEnemies((prev) => {
        let arr = [...prev];

        // Move enemies
        arr = arr
          .map((e) => {
            const rooted = now() < e.rootedUntil;
            const slowMul = now() < e.slowUntil ? 0.45 : 1;
            const spd = rooted ? 0 : e.speed * slowMul;
            if (e.leap && Math.random() < 0.02) {
              const a = Math.atan2(size.cy - e.y, size.cx - e.x);
              e.x += Math.cos(a) * 30;
              e.y += Math.sin(a) * 30;
            }
            const ang = Math.atan2(size.cy - e.y, size.cx - e.x);
            e.x += Math.cos(ang) * spd;
            e.y += Math.sin(ang) * spd;
            if (dist(e.x, e.y, size.cx, size.cy) <= 22) {
              setLives((l) => l - 1);
              return null;
            }
            return e;
          })
          .filter(Boolean);

        // Unit attacks — ANY enemy on board
        if (units.length && arr.length) {
          const gBoost = now() < globalBoostUntil ? 1.3 : 1;
          arr = arr.map((e) => ({ ...e }));
          // Pre-sort by threat (closest to core)
          const byThreat = arr
            .map((e, idx) => ({ e, idx, d: dist(e.x, e.y, size.cx, size.cy) }))
            .sort((a, b) => a.d - b.d); // lowest distance = highest threat

          for (const u of units) {
            u._nextAtk = u._nextAtk ?? 0;
            if (now() < u._nextAtk) continue;

            const st = u.stats;
            const localBoost = now() < (u.localUntil || 0) ? 1.5 : 1;
            const dmgBase = st.dmg * gBoost * localBoost * (1 + (st.allyBuff || 0));

            if (byThreat.length === 0) break;
            const primary = byThreat[0]; // most dangerous target

            if (u.element === "fire") {
              // Splash around primary (AoE still uses st.aoe radius)
              for (let j = 0; j < arr.length; j++) {
                const e = arr[j];
                if (dist(e.x, e.y, primary.e.x, primary.e.y) <= (st.aoe || 28)) {
                  arr[j] = applyDamage(arr[j], dmgBase);
                }
              }
              hitFx(primary.e.x, primary.e.y, COLORS.fire);
            } else if (u.element === "ice") {
              const t = { ...arr[primary.idx] };
              t.slowUntil = Math.max(t.slowUntil || 0, now() + (st.slowMs || 900));
              arr[primary.idx] = applyDamage(t, dmgBase);
              hitFx(t.x, t.y, COLORS.ice);
            } else if (u.element === "storm") {
              // Chain from primary across globally nearest hops
              let dmg = dmgBase;
              let last = primary;
              arr[last.idx] = applyDamage(arr[last.idx], dmg);
              hitFx(last.e.x, last.e.y, COLORS.storm);
              let hops = 1;
              const maxHops = st.chains || 2;
              const fall = st.falloff || 0.65;
              while (hops <= maxHops) {
                // find next nearest to last.e (global set)
                const next = arr
                  .map((e, idx) => ({ e, idx, d: dist(e.x, e.y, last.e.x, last.e.y) }))
                  .filter((o) => o.idx !== last.idx)
                  .sort((a, b) => a.d - b.d)[0];
                if (!next) break;
                last = next;
                dmg *= fall;
                arr[last.idx] = applyDamage(arr[last.idx], dmg);
                hitFx(last.e.x, last.e.y, COLORS.storm);
                hops++;
              }
            } else if (u.element === "nature") {
              const t = { ...arr[primary.idx] };
              if (Math.random() < (st.rootChance || 0.1)) {
                t.rootedUntil = Math.max(t.rootedUntil || 0, now() + (st.rootMs || 600));
              }
              arr[primary.idx] = applyDamage(t, dmgBase);
              hitFx(t.x, t.y, COLORS.nature);
            }

            u._nextAtk = now() + (st.rate || 650);
          }
        }

        // Cleanup & gold
        let earned = 0;
        const alive = [];
        for (const e of arr) {
          if (e.hp <= 0) earned += e.gold;
          else alive.push(e);
        }
        if (earned) setGold((g) => g + earned);

        // Next wave
        if (alive.length === 0) {
          setTimeout(() => {
            if (!paused && !gameOver) {
              setWave((w) => w + 1);
              spawnWave(wave + 1);
              saveProgress();
            }
          }, 500);
        }
        return alive;
      });

      // Game over check
      setLives((l) => {
        if (l <= 0) {
          setGameOver(true);
          return 0;
        }
        return l;
      });
    }, TICK_MS);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, gameOver, units, globalBoostUntil, wave, size.cx, size.cy]);

  function applyDamage(e, amount) {
    const out = { ...e };
    if (out.shieldHp > 0) {
      const s = Math.min(out.shieldHp, amount);
      out.shieldHp -= s;
      amount -= s;
    }
    if (amount > 0) out.hp -= amount;
    return out;
  }
  function hitFx(x, y, color) {
    addFloater("•", x, y, color);
  }

  // Spawns
  function spawnWave(w) {
    const batch = [];
    const portals = portalsRef.current;
    const base = 6 + w;
    const count = Math.min(26, base + Math.floor(w / 2));
    for (let i = 0; i < count; i++) {
      const angle =
        (Math.floor(Math.random() * portals) / portals) * Math.PI * 2 +
        Math.random() * ((Math.PI * 2) / portals) * 0.5;
      const R = Math.max(size.w, size.h) * 0.55;
      const x = size.cx + Math.cos(angle) * R;
      const y = size.cy + Math.sin(angle) * R;
      const typeKey = pickWeighted([
        { key: "swarmer", w: 40 + w * 1.1 },
        { key: "bruiser", w: 25 + w * 0.7 },
        { key: "assassin", w: 18 + w * 0.55 },
        { key: "shield", w: 17 + w * 0.45 },
      ]);
      const t = ENEMIES[typeKey];
      batch.push({
        id: rid(),
        kind: typeKey,
        x,
        y,
        hp: Math.round(t.hp * (1 + w * 0.18)),
        speed: t.speed * (1 + w * 0.02),
        radius: t.radius,
        gold: t.gold,
        shieldHp: t.shield ? Math.round(t.shield * (1 + w * 0.1)) : 0,
        leap: !!t.leap,
        aura: !!t.aura,
        slowUntil: 0,
        rootedUntil: 0,
      });
    }
    if (w % 10 === 0) {
      const angle = Math.random() * Math.PI * 2;
      const R = Math.max(size.w, size.h) * 0.6;
      const x = size.cx + Math.cos(angle) * R;
      const y = size.cy + Math.sin(angle) * R;
      const b = ENEMIES.boss;
      batch.push({
        id: rid(),
        kind: "boss",
        x,
        y,
        hp: Math.round(b.hp * (1 + w * 0.3)),
        speed: b.speed * (1 + w * 0.02),
        radius: b.radius,
        gold: b.gold,
        shieldHp: 0,
        leap: false,
        aura: true,
        slowUntil: 0,
        rootedUntil: 0,
      });
    }
    setEnemies((prev) => [...prev, ...batch]);
  }

  // Save/restore
  async function saveProgress() {
    try {
      await fetch("/api/arcanesiege", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          saveId: saveIdRef.current,
          gameData: {
            gold,
            lives,
            wave,
            ringAngle,
            portals: portalsRef.current,
            units,
            enemies,
            arcane,
            chosenPath,
            rollCost,
            timestamp: now(),
          },
        }),
      });
    } catch {}
  }
  function restore(g) {
    setGold(g.gold ?? START_GOLD);
    setLives(g.lives ?? START_LIVES);
    setWave(g.wave ?? 1);
    setRingAngle(g.ringAngle ?? 0);
    portalsRef.current = g.portals ?? 4;
    setUnits(g.units ?? []);
    setEnemies(g.enemies ?? []);
    setArcane(g.arcane ?? 0);
    setChosenPath(g.chosenPath ?? null);
    setRollCost(g.rollCost ?? 40);
    if (!g.enemies?.length) spawnWave(g.wave ?? 1);
  }

  // Input handling
  const isGlobalReady = now() >= globalCdUntil;
  const onFieldPointerDown = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY ?? e.touches?.[0]?.clientY) - rect.top;

    // Click on node?
    const hitR = 28;
    let hitIdx = -1;
    for (let i = 0; i < nodes.length; i++) {
      if (dist(x, y, nodes[i].x, nodes[i].y) <= hitR) {
        hitIdx = i;
        break;
      }
    }

    if (hitIdx >= 0) {
      const unit = units.find((u) => u.nodeIndex === hitIdx);
      if (mergeMode) {
        if (!unit) {
          addFloater("Select two matching units", nodes[hitIdx].x, nodes[hitIdx].y, "#fff");
          return;
        }
        if (!mergeSourceId) {
          setMergeSourceId(unit.id);
          addFloater("Source selected", nodes[hitIdx].x, nodes[hitIdx].y, COLORS[unit.element]);
        } else {
          const src = units.find((u) => u.id === mergeSourceId);
          if (!src || src.id === unit.id) {
            setMergeSourceId(null);
            return;
          }
          if (src.element !== unit.element) {
            addFloater("Must match element", nodes[hitIdx].x, nodes[hitIdx].y, "#ffaaaa");
            setMergeSourceId(null);
            return;
          }
          // merge src into unit here
          const merged = mergedStats(src.stats, unit.stats);
          setUnits((prev) => {
            const keep = prev.filter((u) => u.id !== src.id && u.id !== unit.id);
            return [
              ...keep,
              {
                id: rid(),
                element: unit.element,
                stats: merged,
                nodeIndex: unit.nodeIndex,
                localUntil: 0,
                localCdUntil: 0,
                level: (unit.level || 1) + (src.level || 1),
              },
            ];
          });
          setMergeSourceId(null);
          addFloater("Merged!", nodes[hitIdx].x, nodes[hitIdx].y, COLORS[unit.element]);
        }
        return;
      }

      // Local overdrive
      if (unit) {
        if (now() < unit.localCdUntil) {
          globalTap(x, y);
          return;
        }
        setUnits((prev) =>
          prev.map((u) =>
            u.id === unit.id
              ? {
                  ...u,
                  localUntil: now() + LOCAL_OVERDRIVE_DURATION,
                  localCdUntil: now() + LOCAL_OVERDRIVE_CD,
                }
              : u
          )
        );
        addFloater("OVERDRIVE!", nodes[hitIdx].x, nodes[hitIdx].y, COLORS[unit.element]);
        gainArcane(ARCANE_PER_TAP, x, y);
        return;
      }

      // empty node — treat as global
      globalTap(x, y);
      return;
    }

    // empty field
    globalTap(x, y);
  };

  function globalTap(x, y) {
    if (isGlobalReady) {
      setGlobalBoostUntil(now() + GLOBAL_SURGE_DURATION);
      setGlobalCdUntil(now() + GLOBAL_SURGE_CD);
      addFloater("GLOBAL SURGE!", x, y, "#FFE57F");
    } else {
      addFloater("+", x, y, "#eee");
    }
    gainArcane(ARCANE_PER_TAP, x, y);
  }

  function gainArcane(val, x, y) {
    setArcane((a) => {
      const n = clamp(a + val, 0, ARCANE_MAX);
      if (n >= ARCANE_MAX) {
        if (chosenPath) castUltimate(chosenPath, x ?? size.cx, y ?? size.cy);
        return 0;
      }
      return n;
    });
  }

  function castUltimate(path, x, y) {
    addFloater("ULTIMATE!", x, y, "#FFFFFF");
    if (path === "fire") {
      setEnemies((prev) => {
        let arr = [...prev];
        for (let i = 0; i < 8; i++) {
          if (!arr.length) break;
          const idx = Math.floor(Math.random() * arr.length);
          if (arr[idx]) {
            arr[idx] = applyDamage(arr[idx], 40);
            for (let j = 0; j < arr.length; j++) {
              if (j === idx) continue;
              if (dist(arr[j].x, arr[j].y, arr[idx].x, arr[idx].y) < 48) {
                arr[j] = applyDamage(arr[j], 20);
              }
            }
          }
        }
        return arr;
      });
    } else if (path === "ice") {
      setEnemies((prev) =>
        prev.map((e) => ({
          ...e,
          slowUntil: now() + 3500,
          rootedUntil: Math.random() < 0.25 ? now() + 1200 : e.rootedUntil,
        }))
      );
    } else if (path === "storm") {
      setEnemies((prev) => prev.map((e) => applyDamage(e, 55)));
    } else if (path === "nature") {
      setUnits((prev) =>
        prev.map((u) => ({ ...u, localUntil: Math.max(u.localUntil, now() + 2000) }))
      );
      setEnemies((prev) => prev.map((e) => ({ ...e, rootedUntil: now() + 1000 })));
    }
  }

  // Rolling & auto-placement (unchanged)
  function rollUnit() {
    const element = pick(ELEMENTS);
    autoPlaceOrMerge(element);
  }
  function baseStatsFor(element) {
    return { ...UNIT_BASE[element].base };
  }
  function firstEmptyNode() {
    const occupied = new Set(units.map((u) => u.nodeIndex));
    for (let i = 0; i < nodes.length; i++) if (!occupied.has(i)) return i;
    return -1;
  }
  function weakestUnitIndex() {
    if (!units.length) return -1;
    let worst = 0;
    let worstScore = unitPowerScore(units[0].stats);
    for (let i = 1; i < units.length; i++) {
      const s = unitPowerScore(units[i].stats);
      if (s < worstScore) {
        worst = i;
        worstScore = s;
      }
    }
    return worst;
  }
  function autoPlaceOrMerge(element) {
    let idx = firstEmptyNode();
    if (idx >= 0) {
      setUnits((prev) => [
        ...prev,
        {
          id: rid(),
          element,
          stats: baseStatsFor(element),
          nodeIndex: idx,
          localUntil: 0,
          localCdUntil: 0,
          level: 1,
        },
      ]);
      addFloater("Placed!", nodes[idx].x, nodes[idx].y, COLORS[element]);
      return;
    }
    const same = units
      .map((u, i) => ({ u, i, s: unitPowerScore(u.stats) }))
      .filter((x) => x.u.element === element)
      .sort((a, b) => a.s - b.s);
    if (same.length >= 2) {
      const a = same[0];
      const b = same[1];
      const merged = mergedStats(a.u.stats, b.u.stats);
      const targetNode = b.u.nodeIndex;
      setUnits((prev) => {
        const keep = prev.filter((_, i) => i !== a.i && i !== b.i);
        return [
          ...keep,
          {
            id: rid(),
            element,
            stats: merged,
            nodeIndex: targetNode,
            localUntil: 0,
            localCdUntil: 0,
            level: (a.u.level || 1) + (b.u.level || 1),
          },
          {
            id: rid(),
            element,
            stats: baseStatsFor(element),
            nodeIndex: a.u.nodeIndex,
            localUntil: 0,
            localCdUntil: 0,
            level: 1,
          },
        ];
      });
      addFloater("Auto-merge + Place!", nodes[targetNode].x, nodes[targetNode].y, COLORS[element]);
      return;
    }
    const wIdx = weakestUnitIndex();
    if (wIdx >= 0) {
      const targetNode = units[wIdx].nodeIndex;
      setUnits((prev) => {
        const keep = prev.filter((_, i) => i !== wIdx);
        return [
          ...keep,
          {
            id: rid(),
            element,
            stats: baseStatsFor(element),
            nodeIndex: targetNode,
            localUntil: 0,
            localCdUntil: 0,
            level: 1,
          },
        ];
      });
      addFloater("Replaced weakest", nodes[targetNode].x, nodes[targetNode].y, COLORS[element]);
    }
  }

  // UI State/controls
  const togglePause = () => setPaused((p) => !p);
  const resetGame = () => {
    setGold(START_GOLD);
    setLives(START_LIVES);
    setWave(1);
    setRingAngle(0);
    portalsRef.current = 4;
    setUnits([]);
    setEnemies([]);
    setArcane(0);
    setGlobalBoostUntil(0);
    setGlobalCdUntil(0);
    setChosenPath(null);
    setRollCost(40);
    setMergeMode(false);
    setMergeSourceId(null);
    setGameOver(false);
    setTimeout(() => spawnWave(1), 100);
  };

  const globalCdLeft = Math.max(0, globalCdUntil - now());
  const globalActiveLeft = Math.max(0, globalBoostUntil - now());
  const isGlobalReady = now() >= globalCdUntil;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[100svh] overflow-hidden bg-gradient-to-b from-indigo-700 via-purple-700 to-pink-600"
    >
      {/* Tap layer */}
      <div className="absolute inset-0" onPointerDown={onFieldPointerDown} />

      {/* Core */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 46,
          height: 46,
          left: size.cx - 23,
          top: size.cy - 23,
          background:
            "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), rgba(255,255,255,0.1))",
          border: "1px solid rgba(255,255,255,0.5)",
          boxShadow: "0 0 25px rgba(255,255,255,0.4)",
          backdropFilter: "blur(8px)",
        }}
        animate={{ scale: now() < globalBoostUntil ? 1.08 : 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 12 }}
      />

      {/* Nodes & Units */}
      {nodes.map((p, idx) => {
        const unit = units.find((u) => u.nodeIndex === idx);
        const isSrc = unit && unit.id === mergeSourceId;
        return (
          <div key={idx} className="absolute" style={{ left: p.x - 18, top: p.y - 18, width: 36, height: 36 }}>
            <div
              className="w-full h-full rounded-full border"
              style={{
                borderColor: isSrc ? "#fff" : "rgba(255,255,255,0.5)",
                background: "rgba(255,255,255,0.12)",
                backdropFilter: "blur(6px)",
                boxShadow: isSrc ? "0 0 16px rgba(255,255,255,0.9)" : "0 2px 8px rgba(0,0,0,0.25)",
              }}
            />
            {unit && <UnitBadge u={unit} />}
          </div>
        );
      })}

      {/* Enemies */}
      {enemies.map((e) => (
        <motion.div
          key={e.id}
          className="absolute rounded-full"
          style={{
            left: e.x - e.radius,
            top: e.y - e.radius,
            width: e.radius * 2,
            height: e.radius * 2,
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

      {/* Floaters */}
      <AnimatePresence>
        {floaters.map((f) => (
          <motion.div
            key={f.id}
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -22 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9 }}
            className="absolute text-xs font-semibold pointer-events-none"
            style={{ left: f.x, top: f.y, color: f.color }}
          >
            {f.text}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Top HUD */}
      <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-white glass z-20">
        <div className="flex items-center gap-3 text-sm">
          <span className="inline-flex items-center gap-1">
            <Coins size={14} /> {gold}
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
          <button className="btn" onClick={saveProgress} aria-label="Save">
            <RotateCw size={16} />
          </button>
        </div>
      </div>

      {/* Arcane Bar */}
      <div className="absolute top-12 left-2 right-2 rounded-xl px-3 py-2 text-white glass z-20">
        <div className="text-[11px] mb-1 flex justify-between">
          <span className="inline-flex items-center gap-1">
            <Wand2 size={14} /> Arcane Charge
          </span>
          <span>{arcane}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden">
          <div className="h-full bg-white" style={{ width: `${(arcane / ARCANE_MAX) * 100}%` }} />
        </div>
      </div>

      {/* Bottom Dock */}
      <div className="absolute bottom-2 left-2 right-2 rounded-2xl px-3 py-2 text-white glass z-20">
        {/* Choose Path (colored) */}
        {!chosenPath && (
          <div className="mb-2">
            <div className="text-[11px] opacity-90 mb-1">Choose your Arcane Path:</div>
            <div className="flex gap-2">
              {ELEMENTS.map((el) => {
                const Icon = UNIT_BASE[el].icon;
                return (
                  <button
                    key={el}
                    className="flex-1 py-2 rounded-xl font-bold border"
                    style={{
                      background: `linear-gradient(135deg, ${COLORS[el]}55, ${COLORS[el]}33)`,
                      borderColor: `${COLORS[el]}88`,
                    }}
                    onClick={() => setChosenPath(el)}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Icon size={16} />
                      <span className="text-xs capitalize">{el}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Main controls */}
        <div className="flex items-center justify-between gap-2">
          <button
            className={`btn flex-1 ${gold < rollCost ? "opacity-60" : ""}`}
            onClick={() => {
              if (gold < rollCost) return;
              setGold((g) => g - rollCost);
              setRollCost((c) => Math.round(c * 1.15 + 5));
              rollUnit();
            }}
            disabled={gold < rollCost}
          >
            <Dice6 size={16} />
            <span className="text-xs ml-1">Roll ({rollCost})</span>
          </button>

          <button
            className={`btn flex-1 ${isGlobalReady ? "" : "opacity-60"}`}
            onClick={(e) => {
              e.stopPropagation();
              const rect = containerRef.current.getBoundingClientRect();
              globalTap(rect.left + size.cx, rect.top + size.cy);
            }}
          >
            <Zap size={16} />
            <span className="text-xs ml-1">
              Surge {globalActiveLeft > 0 ? "ON" : isGlobalReady ? "Ready" : `(${Math.ceil(globalCdLeft / 1000)}s)`}
            </span>
          </button>

          <button
            className={`btn flex-1 ${mergeMode ? "ring-2 ring-white" : ""}`}
            onClick={() => {
              setMergeMode((m) => !m);
              setMergeSourceId(null);
            }}
          >
            <Merge size={16} />
            <span className="text-xs ml-1">{mergeMode ? "Merge: ON" : "Merge: OFF"}</span>
          </button>

          <button className="btn flex-1" onClick={resetGame}>
            <RotateCw size={16} />
            <span className="text-xs ml-1">Restart</span>
          </button>
        </div>
      </div>

      {/* Pause/GameOver Curtains */}
      <AnimatePresence>
        {(paused || gameOver || !chosenPath) && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {!chosenPath ? (
              <div className="glass px-4 py-3 rounded-xl text-white">
                <div className="text-sm mb-2 font-semibold">Choose your Arcane Path to begin</div>
                <div className="flex gap-2">
                  {ELEMENTS.map((el) => {
                    const Icon = UNIT_BASE[el].icon;
                    return (
                      <button
                        key={el}
                        className="btn"
                        style={{
                          background: `linear-gradient(135deg, ${COLORS[el]}55, ${COLORS[el]}33)`,
                          borderColor: `${COLORS[el]}88`,
                        }}
                        onClick={() => setChosenPath(el)}
                      >
                        <Icon size={18} />
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : gameOver ? (
              <div className="glass px-5 py-4 rounded-xl text-white text-center">
                <div className="text-lg font-bold mb-1">Defenses Fallen</div>
                <div className="text-sm mb-3">You reached Wave {wave}</div>
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
              <div className="glass px-5 py-4 rounded-xl text-white text-center">
                <div className="text-sm mb-2">Paused</div>
                <button className="btn" onClick={() => setPaused(false)}>
                  <Play size={16} /> <span className="ml-1 text-xs">Resume</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Styles */}
      <style>{glassCss}</style>
    </div>
  );
}

// --- UI bits ---
function UnitBadge({ u }) {
  const Icon = UNIT_BASE[u.element].icon;
  const active = now() < (u.localUntil || 0);
  return (
    <motion.div
      className="absolute inset-0 rounded-full flex items-center justify-center"
      animate={{ scale: active ? 1.12 : 1 }}
      transition={{ type: "spring", stiffness: 140, damping: 12 }}
      style={{ color: COLORS[u.element], textShadow: "0 2px 6px rgba(0,0,0,0.35)" }}
    >
      <Icon size={18} />
    </motion.div>
  );
}

const glassCss = `
.glass {
  background: rgba(255,255,255,0.12);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.35);
  box-shadow: 0 6px 18px rgba(0,0,0,0.2);
}
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.18);
  border: 1px solid rgba(255,255,255,0.35);
  border-radius: 10px;
  padding: 6px 10px;
  font-size: 12px;
  line-height: 1;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}
`;
