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
  Shield,
  Crown,
  Wand2,
} from "lucide-react";

/**
 * Tap Tap: Arcane Siege
 * - Mobile-first, portrait layout
 * - Circular battlefield with energy nodes around the Arcane Core
 * - Roll random units (elements) and place them on nodes
 * - Auto-fusion: 3 duplicates => evolve to next tier
 * - Tap anywhere = Global Surge (CD 4s) | Tap a unit = Focused Overdrive (CD 2s per unit)
 * - Arcane Charge fills with taps; on full => element Ultimate auto-casts
 * - Hazards every 5 waves: rotate node ring & add enemy portal pressure
 * - Supabase save/load via /api/arcanesiege
 *
 * No external assets required. All UI is Tailwind + Lucide + basic shapes.
 */

const TICK_MS = 50; // game loop interval
const GLOBAL_SURGE_CD = 4000;
const GLOBAL_SURGE_DURATION = 2000;
const LOCAL_OVERDRIVE_CD = 2000;
const LOCAL_OVERDRIVE_DURATION = 1500;
const ARCANE_PER_TAP = 12; // ~9 taps = full
const ARCANE_MAX = 100;
const START_GOLD = 100;
const START_LIVES = 20;

const ELEMENTS = ["fire", "ice", "storm", "nature"];

// Base stats by element & tier
const UNIT_BASE = {
  fire: {
    name: "Fire Mage",
    color: "#FF6A3D",
    icon: Flame,
    // tier: [dmg, range, rate(ms between attacks)], plus AoE radius
    tiers: [
      { dmg: 6, range: 130, rate: 700, aoe: 30 },
      { dmg: 11, range: 145, rate: 650, aoe: 38 },
      { dmg: 18, range: 160, rate: 600, aoe: 48 },
    ],
    fusedNames: ["Inferno Sorcerer", "Phoenix Avatar"],
  },
  ice: {
    name: "Frost Adept",
    color: "#71D1F4",
    icon: Snowflake,
    tiers: [
      { dmg: 4, range: 130, rate: 700, slow: 0.35, slowMs: 1200 },
      { dmg: 7, range: 150, rate: 650, slow: 0.45, slowMs: 1400 },
      { dmg: 12, range: 170, rate: 600, slow: 0.55, slowMs: 1700 },
    ],
    fusedNames: ["Glacier Witch", "Eternal Blizzard"],
  },
  storm: {
    name: "Spark Shaman",
    color: "#A78BFA",
    icon: Zap,
    tiers: [
      { dmg: 5, range: 150, rate: 650, chains: 2, falloff: 0.65 },
      { dmg: 9, range: 170, rate: 600, chains: 3, falloff: 0.65 },
      { dmg: 16, range: 190, rate: 550, chains: 4, falloff: 0.65 },
    ],
    fusedNames: ["Storm Caller", "Tempest Lord"],
  },
  nature: {
    name: "Druid",
    color: "#34D399",
    icon: Leaf,
    tiers: [
      { dmg: 4, range: 130, rate: 700, rootMs: 600, rootChance: 0.1, allyBuff: 0.05 },
      { dmg: 7, range: 150, rate: 650, rootMs: 800, rootChance: 0.13, allyBuff: 0.08 },
      { dmg: 12, range: 170, rate: 600, rootMs: 1000, rootChance: 0.16, allyBuff: 0.12 },
    ],
    fusedNames: ["Grove Keeper", "Ancient Ent"],
  },
};

// Enemy types
const ENEMIES = {
  swarmer: { hp: 14, speed: 1.2, radius: 10, gold: 3 },
  bruiser: { hp: 40, speed: 0.8, radius: 12, gold: 6 },
  assassin: { hp: 22, speed: 1.6, radius: 10, gold: 5, leap: true },
  shield: { hp: 30, speed: 0.9, radius: 12, gold: 6, shield: 20 },
  boss: { hp: 260, speed: 0.9, radius: 18, gold: 40, aura: true },
};

function randId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
function distance(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}
function pickWeighted(pairs) {
  // pairs: [{key, w}]
  const total = pairs.reduce((a, b) => a + b.w, 0);
  let r = Math.random() * total;
  for (const p of pairs) {
    if (r < p.w) return p.key;
    r -= p.w;
  }
  return pairs[pairs.length - 1].key;
}
function now() {
  return Date.now();
}

export default function ArcaneSiege() {
  // --- Layout refs ---
  const containerRef = useRef(null);
  const [size, setSize] = useState({ w: 360, h: 640, cx: 180, cy: 320 }); // default portrait
  const [ringAngle, setRingAngle] = useState(0); // rotates with hazards
  const NODES = 12; // fixed node count around the core

  // --- Core game state ---
  const [gold, setGold] = useState(START_GOLD);
  const [lives, setLives] = useState(START_LIVES);
  const [wave, setWave] = useState(1);
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  // Tap systems
  const [globalBoostUntil, setGlobalBoostUntil] = useState(0);
  const [globalCdUntil, setGlobalCdUntil] = useState(0);
  const [arcane, setArcane] = useState(0);
  const [chosenPath, setChosenPath] = useState(null); // 'fire' | 'ice' | 'storm' | 'nature'

  // Units & hand
  const [hand, setHand] = useState([]); // [{id, element, tier:1}]
  const [units, setUnits] = useState([]); // [{id, element, tier, nodeIndex, localUntil, localCdUntil, level}]
  const [selectedUnitId, setSelectedUnitId] = useState(null);
  const [rollCost, setRollCost] = useState(40);

  // Enemies
  const [enemies, setEnemies] = useState([]); // [{...type, id, x,y, hp, speed, status:{slowUntil, rootedUntil}, shieldHp}]
  const portalsRef = useRef(4); // enemy spawn portals, increase under hazards

  // Floating feedback
  const [floaters, setFloaters] = useState([]);
  const addFloater = (text, x, y, color = "#FFD76B") => {
    const id = randId();
    setFloaters((p) => [...p, { id, text, x, y, color, born: now() }]);
    setTimeout(() => setFloaters((p) => p.filter((f) => f.id !== id)), 900);
  };

  // Save ID for anonymous saves
  const saveIdRef = useRef(null);

  // --- Derived layout: node positions on a ring around center ---
  const nodes = useMemo(() => {
    const R = Math.min(size.w, size.h) * 0.36; // ring radius
    const arr = [];
    for (let i = 0; i < NODES; i++) {
      const angle = ((i / NODES) * Math.PI * 2) + (ringAngle * Math.PI / 180);
      arr.push({
        x: size.cx + Math.cos(angle) * R,
        y: size.cy + Math.sin(angle) * R,
      });
    }
    return arr;
  }, [size, ringAngle]);

  // --- Resize observer to keep it mobile-first responsive ---
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      setSize({ w, h, cx: w / 2, cy: h / 2 });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // --- Utility: get screen position helper ---
  const pageToLocal = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY ?? e.touches?.[0]?.clientY) - rect.top;
    return { x, y };
  };

  // --- Roll system: rarity weights -> element ---
  const rollUnit = () => {
    // We keep it "unique": rarity controls a bonus to tier chances and stat rolls later if you want to expand.
    const rarity = pickWeighted([
      { key: "common", w: 50 },
      { key: "rare", w: 30 },
      { key: "epic", w: 15 },
      { key: "legendary", w: 5 },
    ]);
    const element = pickWeighted([
      { key: "fire", w: 25 },
      { key: "ice", w: 25 },
      { key: "storm", w: 25 },
      { key: "nature", w: 25 },
    ]);
    const id = randId();
    // Start at base tier 1. (Rarity can be used later for special passives.)
    const unit = { id, element, tier: 1, rarity, level: 1 };
    setHand((prev) => (prev.length >= 3 ? [prev[0], prev[1], unit] : [...prev, unit]));
  };

  const handleRoll = () => {
    if (gold < rollCost) return;
    setGold((g) => g - rollCost);
    setRollCost((c) => Math.round(c * 1.15 + 5));
    rollUnit();
  };

  // --- Placement: tap an empty node to place first in hand ---
  const placeOnNode = (nodeIndex, tapX, tapY) => {
    if (hand.length === 0) {
      // No unit to place -> treat as global tap
      triggerTap({ x: tapX, y: tapY, maybeNodeIndex: nodeIndex });
      return;
    }
    // If node already occupied, try local boost
    const existing = units.find((u) => u.nodeIndex === nodeIndex);
    if (existing) {
      triggerUnitTap(existing, tapX, tapY);
      return;
    }
    const [unit, ...rest] = hand;
    const newUnit = {
      id: unit.id,
      element: unit.element,
      tier: unit.tier,
      level: unit.level,
      nodeIndex,
      localUntil: 0,
      localCdUntil: 0,
    };
    const merged = autoFusion([...units, newUnit]);
    setUnits(merged);
    setHand(rest);
    addFloater("Placed!", nodes[nodeIndex].x, nodes[nodeIndex].y, "#B3F7A3");
  };

  // --- Auto-fusion: 3 of the same element & tier -> +1 tier ---
  const autoFusion = (list) => {
    const key = (u) => `${u.element}-t${u.tier}`;
    const groups = list.reduce((acc, u) => {
      const k = key(u);
      acc[k] = acc[k] || [];
      acc[k].push(u);
      return acc;
    }, {});
    let changed = false;
    for (const k of Object.keys(groups)) {
      const group = groups[k];
      while (group.length >= 3) {
        // Upgrade one, remove two oldest
        const toUpgrade = group.shift();
        const remove1 = group.shift();
        const remove2 = group.shift();
        // Apply upgrade if not max tier
        const idxToUpgrade = list.findIndex((x) => x.id === toUpgrade.id);
        if (idxToUpgrade >= 0) {
          const upgraded = { ...list[idxToUpgrade] };
          if (upgraded.tier < 3) {
            upgraded.tier += 1;
            const fam = UNIT_BASE[upgraded.element];
            const tierName =
              upgraded.tier === 2 ? fam.fusedNames[0] : fam.fusedNames[1];
            addFloater(`Fusion! ${tierName}`, nodes[upgraded.nodeIndex]?.x ?? size.cx, nodes[upgraded.nodeIndex]?.y ?? size.cy, fam.color);
            list[idxToUpgrade] = upgraded;
            // Remove two others from list
            list = list.filter(
              (x) => x.id !== remove1.id && x.id !== remove2.id
            );
            changed = true;
          }
        }
      }
    }
    // If more possible chains, re-run once (cheap).
    return changed ? autoFusion(list) : list;
  };

  // --- Enemy spawning / wave control ---
  const spawnWave = (w) => {
    const batch = [];
    const portals = portalsRef.current;
    const base = 6 + w; // base count increases
    const count = Math.min(24, base + Math.floor(w / 2));
    for (let i = 0; i < count; i++) {
      const angle = (Math.floor(Math.random() * portals) / portals) * Math.PI * 2 + Math.random() * (Math.PI * 2 / portals) * 0.5;
      const R = Math.max(size.w, size.h) * 0.55;
      const x = size.cx + Math.cos(angle) * R;
      const y = size.cy + Math.sin(angle) * R;
      const typeKey = pickWeighted([
        { key: "swarmer", w: 40 + w * 1.2 },
        { key: "bruiser", w: 25 + w * 0.7 },
        { key: "assassin", w: 18 + w * 0.5 },
        { key: "shield", w: 17 + w * 0.4 },
      ]);

      const type = ENEMIES[typeKey];
      batch.push({
        id: randId(),
        kind: typeKey,
        x,
        y,
        hp: Math.round(type.hp * (1 + w * 0.18)),
        speed: type.speed * (1 + w * 0.02),
        radius: type.radius,
        gold: type.gold,
        shieldHp: type.shield ? Math.round(type.shield * (1 + w * 0.1)) : 0,
        leap: !!type.leap,
        aura: !!type.aura,
        slowUntil: 0,
        rootedUntil: 0,
      });
    }
    if (w % 10 === 0) {
      // Boss
      const angle = Math.random() * Math.PI * 2;
      const R = Math.max(size.w, size.h) * 0.6;
      const x = size.cx + Math.cos(angle) * R;
      const y = size.cy + Math.sin(angle) * R;
      const b = ENEMIES.boss;
      batch.push({
        id: randId(),
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
  };

  // Hazards every 5 waves
  useEffect(() => {
    if (wave > 1 && wave % 5 === 0) {
      setRingAngle((a) => a + 18 + Math.floor(Math.random() * 10)); // rotate nodes
      portalsRef.current = Math.min(8, portalsRef.current + 1); // more spawn portals
      addFloater("Battlefield Shift!", size.cx, size.cy, "#FFD76B");
    }
  }, [wave]); // eslint-disable-line

  // --- Game loop ---
  useEffect(() => {
    if (paused || gameOver) return;
    const iv = setInterval(() => {
      setEnemies((prev) => {
        let arr = [...prev];

        // Move enemies toward core
        arr = arr
          .map((e) => {
            const isRooted = now() < e.rootedUntil;
            const speedFactor =
              (now() < e.slowUntil ? 0.45 : 1) * (e.kind === "boss" ? 0.9 : 1);
            const spd = isRooted ? 0 : e.speed * speedFactor;

            // Leaping assassins: quick hop closer once per ~2s randomly
            if (e.leap && Math.random() < 0.02) {
              const ang = Math.atan2(size.cy - e.y, size.cx - e.x);
              e.x += Math.cos(ang) * 30;
              e.y += Math.sin(ang) * 30;
            }

            const ang = Math.atan2(size.cy - e.y, size.cx - e.x);
            e.x += Math.cos(ang) * spd;
            e.y += Math.sin(ang) * spd;

            // Reached core?
            if (distance(e.x, e.y, size.cx, size.cy) <= 22) {
              setLives((l) => l - 1);
              return null;
            }
            return e;
          })
          .filter(Boolean);

        // Unit attacks
        if (units.length > 0 && arr.length > 0) {
          const gBoost = now() < globalBoostUntil ? 1.3 : 1;
          arr = arr.map((enemy) => ({ ...enemy })); // shallow copy for mutation
          for (const u of units) {
            // Decide if unit can fire at tick
            u._nextAtk = u._nextAtk ?? 0;
            if (now() < (u._nextAtk || 0)) continue;

            const fam = UNIT_BASE[u.element];
            const tier = fam.tiers[u.tier - 1];
            const node = nodes[u.nodeIndex];
            if (!node) continue;

            // find nearest enemy in range
            const inRange = arr
              .map((e, idx) => ({ e, idx, d: distance(e.x, e.y, node.x, node.y) }))
              .filter((o) => o.d <= tier.range)
              .sort((a, b) => a.d - b.d);

            if (inRange.length === 0) continue;

            // Damage calc
            const localBoost = now() < (u.localUntil || 0) ? 2 : 1;
            const allyBuff =
              u.element === "nature" ? 1 + tier.allyBuff : 1;

            const dmgBase = tier.dmg * gBoost * localBoost * allyBuff;

            // Apply element effects
            if (u.element === "fire") {
              // Splash on nearest target
              const primary = inRange[0].e;
              for (let j = 0; j < arr.length; j++) {
                const e = arr[j];
                if (distance(e.x, e.y, primary.x, primary.y) <= tier.aoe) {
                  arr[j] = applyDamage(arr[j], dmgBase);
                }
              }
              addHitFx(primary.x, primary.y, fam.color);
            } else if (u.element === "ice") {
              const target = inRange[0].e;
              const slowed = { ...target };
              slowed.slowUntil = Math.max(slowed.slowUntil, now() + tier.slowMs);
              arr[inRange[0].idx] = applyDamage(slowed, dmgBase);
              addHitFx(target.x, target.y, fam.color);
            } else if (u.element === "storm") {
              // Chain lightning
              let dmg = dmgBase;
              let last = inRange[0];
              arr[last.idx] = applyDamage(arr[last.idx], dmg);
              addHitFx(last.e.x, last.e.y, fam.color);
              let hops = 1;
              while (hops <= tier.chains) {
                // find next closest from last target within range/1.2
                const candidates = arr
                  .map((e, idx) => ({ e, idx, d: distance(e.x, e.y, last.e.x, last.e.y) }))
                  .filter((o) => o.d <= tier.range * 0.9 && o.idx !== last.idx)
                  .sort((a, b) => a.d - b.d);
                if (candidates.length === 0) break;
                last = candidates[0];
                dmg *= tier.falloff;
                arr[last.idx] = applyDamage(arr[last.idx], dmg);
                addHitFx(last.e.x, last.e.y, fam.color);
                hops++;
              }
            } else if (u.element === "nature") {
              // Root chance + light dmg, and minor ally aura captured by allyBuff
              const target = inRange[0].e;
              if (Math.random() < tier.rootChance) {
                const rooted = { ...target, rootedUntil: Math.max(target.rootedUntil, now() + tier.rootMs) };
                arr[inRange[0].idx] = applyDamage(rooted, dmgBase);
              } else {
                arr[inRange[0].idx] = applyDamage(target, dmgBase);
              }
              addHitFx(target.x, target.y, fam.color);
            }

            u._nextAtk = now() + tier.rate; // schedule next shot
          }
        }

        // Cleanup dead enemies & reward gold
        const alive = [];
        let earned = 0;
        for (const e of arr) {
          if (e.hp <= 0) {
            earned += e.gold;
          } else {
            alive.push(e);
          }
        }
        if (earned > 0) setGold((g) => g + earned);

        // Wave cleared?
        if (alive.length === 0) {
          // Start next wave after a breath
          setTimeout(() => {
            if (!paused && !gameOver) {
              setWave((w) => w + 1);
              spawnWave(wave + 1);
              // Auto-save on wave up
              saveProgress();
            }
          }, 600);
        }
        return alive;
      });

      // Check game over
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
  }, [paused, gameOver, units, nodes, globalBoostUntil, wave]);

  // Apply damage (shield first if any)
  function applyDamage(enemy, amount) {
    const e = { ...enemy };
    if (e.shieldHp > 0) {
      const s = Math.min(e.shieldHp, amount);
      e.shieldHp -= s;
      amount -= s;
    }
    if (amount > 0) e.hp -= amount;
    return e;
  }

  // Simple hit FX using floaters
  function addHitFx(x, y, color) {
    addFloater("•", x, y, color);
  }

  // --- Tap handling: local (unit) vs global area ---
  const triggerTap = ({ x, y, maybeNodeIndex }) => {
    // If global cd ready -> surge
    if (now() >= globalCdUntil) {
      setGlobalBoostUntil(now() + GLOBAL_SURGE_DURATION);
      setGlobalCdUntil(now() + GLOBAL_SURGE_CD);
      addFloater("GLOBAL SURGE!", x, y, "#FFE57F");
    } else {
      // No global available -> try to select or just add arcane charge
      addFloater("+", x, y, "#eee");
    }
    addArcane(ARCANE_PER_TAP, { x, y });
  };

  const triggerUnitTap = (unit, x, y) => {
    if (now() < unit.localCdUntil) {
      // Fallback to global if local on cooldown
      triggerTap({ x, y });
      return;
    }
    const boosted = units.map((u) =>
      u.id === unit.id
        ? {
            ...u,
            localUntil: now() + LOCAL_OVERDRIVE_DURATION,
            localCdUntil: now() + LOCAL_OVERDRIVE_CD,
          }
        : u
    );
    setUnits(boosted);
    addFloater("OVERDRIVE!", x, y, UNIT_BASE[unit.element].color);
    addArcane(ARCANE_PER_TAP, { x, y });
  };

  const addArcane = (val, pos) => {
    setArcane((a) => {
      const next = clamp(a + val, 0, ARCANE_MAX);
      if (next >= ARCANE_MAX) {
        // Trigger Ultimate instantly
        if (chosenPath) {
          castUltimate(chosenPath, pos?.x ?? size.cx, pos?.y ?? size.cy);
        }
        return 0;
      }
      return next;
    });
  };

  const castUltimate = (path, x, y) => {
    addFloater("ULTIMATE!", x, y, "#FFFFFF");
    if (path === "fire") {
      // Meteor Storm: blast random enemies in AoE
      setEnemies((prev) => {
        let arr = [...prev];
        for (let i = 0; i < 8; i++) {
          const idx = Math.floor(Math.random() * arr.length);
          if (arr[idx]) {
            arr[idx] = applyDamage(arr[idx], 40);
            // splash around it
            for (let j = 0; j < arr.length; j++) {
              if (j === idx) continue;
              if (distance(arr[j].x, arr[j].y, arr[idx].x, arr[idx].y) < 48) {
                arr[j] = applyDamage(arr[j], 20);
              }
            }
          }
        }
        return arr;
      });
    } else if (path === "ice") {
      // Blizzard: slow everything hard and freeze some
      setEnemies((prev) =>
        prev.map((e) => ({
          ...e,
          slowUntil: now() + 3500,
          rootedUntil: Math.random() < 0.25 ? now() + 1200 : e.rootedUntil,
        }))
      );
    } else if (path === "storm") {
      // Super chain: zap N enemies hard
      setEnemies((prev) => {
        let arr = [...prev];
        for (let i = 0; i < Math.min(10, arr.length); i++) {
          const idx = Math.floor(Math.random() * arr.length);
          if (arr[idx]) arr[idx] = applyDamage(arr[idx], 55);
        }
        return arr;
      });
    } else if (path === "nature") {
      // Bloom: big ally buff window + root many foes
      setUnits((prev) =>
        prev.map((u) => ({
          ...u,
          localUntil: Math.max(u.localUntil, now() + 2000),
        }))
      );
      setEnemies((prev) =>
        prev.map((e) => ({
          ...e,
          rootedUntil: now() + 1000,
        }))
      );
    }
  };

  // --- Input handler on game field ---
  const onFieldPointerDown = (e) => {
    const pt = pageToLocal(e);
    // Check if tapped near a node
    const hitRadius = 28;
    let hitNode = -1;
    for (let i = 0; i < nodes.length; i++) {
      if (distance(pt.x, pt.y, nodes[i].x, nodes[i].y) <= hitRadius) {
        hitNode = i;
        break;
      }
    }
    if (hitNode >= 0) {
      const unit = units.find((u) => u.nodeIndex === hitNode);
      if (unit) {
        setSelectedUnitId(unit.id);
        triggerUnitTap(unit, pt.x, pt.y);
      } else {
        placeOnNode(hitNode, pt.x, pt.y);
      }
    } else {
      // Empty field: global tap
      triggerTap({ x: pt.x, y: pt.y });
    }
  };

  // --- Start / Load ---
  useEffect(() => {
    // create or read saveId
    const sid =
      localStorage.getItem("arcaneSaveId") ||
      (() => {
        const id = randId();
        localStorage.setItem("arcaneSaveId", id);
        return id;
      })();
    saveIdRef.current = sid;

    // Load progress if any
    (async () => {
      try {
        const res = await fetch("/api/arcanesiege", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "load", saveId: sid }),
        });
        const json = await res.json();
        if (json?.gameData) {
          restoreProgress(json.gameData);
        } else {
          // fresh game
          spawnWave(1);
        }
      } catch (err) {
        console.warn("Load failed", err);
        spawnWave(1);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveProgress = async () => {
    try {
      const payload = {
        gold,
        lives,
        wave,
        ringAngle,
        portals: portalsRef.current,
        hand,
        units,
        enemies,
        chosenPath,
        rollCost,
        timestamp: now(),
      };
      await fetch("/api/arcanesiege", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          saveId: saveIdRef.current,
          gameData: payload,
        }),
      });
    } catch (err) {
      console.warn("Save failed", err);
    }
  };

  const restoreProgress = (g) => {
    setGold(g.gold ?? START_GOLD);
    setLives(g.lives ?? START_LIVES);
    setWave(g.wave ?? 1);
    setRingAngle(g.ringAngle ?? 0);
    portalsRef.current = g.portals ?? 4;
    setHand(g.hand ?? []);
    setUnits(g.units ?? []);
    setEnemies(g.enemies ?? []);
    setChosenPath(g.chosenPath ?? null);
    setRollCost(g.rollCost ?? 40);
    if (!g.enemies || g.enemies.length === 0) spawnWave(g.wave ?? 1);
  };

  // --- Pause/Resume handler ---
  const togglePause = () => {
    setPaused((p) => !p);
  };

  const resetGame = () => {
    setGold(START_GOLD);
    setLives(START_LIVES);
    setWave(1);
    setRingAngle(0);
    portalsRef.current = 4;
    setHand([]);
    setUnits([]);
    setEnemies([]);
    setArcane(0);
    setGlobalBoostUntil(0);
    setGlobalCdUntil(0);
    setChosenPath(null);
    setRollCost(40);
    setGameOver(false);
    setTimeout(() => spawnWave(1), 100);
  };

  // --- UI helpers ---
  const isGlobalReady = now() >= globalCdUntil;
  const globalCdLeft = Math.max(0, globalCdUntil - now());
  const globalActiveLeft = Math.max(0, globalBoostUntil - now());
  const selectedUnit = units.find((u) => u.id === (selectedUnitId || ""));

  const upgradeSelected = () => {
    if (!selectedUnit) return;
    const cost = 30 + selectedUnit.level * 20;
    if (gold < cost) return;
    setGold((g) => g - cost);
    setUnits((prev) =>
      prev.map((u) =>
        u.id === selectedUnit.id ? { ...u, level: u.level + 1 } : u
      )
    );
    addFloater("Level Up!", nodes[selectedUnit.nodeIndex].x, nodes[selectedUnit.nodeIndex].y, "#9AE6B4");
  };

  // --- Render ---
  return (
    <div className="relative w-full h-[100svh] overflow-hidden bg-gradient-to-b from-purple-600 via-indigo-600 to-blue-600" ref={containerRef}>
      {/* Tap Layer */}
      <div
        className="absolute inset-0"
        onPointerDown={onFieldPointerDown}
        role="button"
        aria-label="Game Field"
      />

      {/* Arcane Core */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 46,
          height: 46,
          left: size.cx - 23,
          top: size.cy - 23,
          background:
            "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), rgba(255,255,255,0.1))",
          boxShadow: "0 0 25px rgba(255,255,255,0.5)",
          border: "1px solid rgba(255,255,255,0.5)",
          backdropFilter: "blur(8px)",
        }}
        animate={{ scale: now() < globalBoostUntil ? 1.08 : 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 12 }}
      />

      {/* Nodes */}
      {nodes.map((p, idx) => {
        const occupant = units.find((u) => u.nodeIndex === idx);
        const isSelected = occupant && occupant.id === selectedUnitId;
        return (
          <div
            key={idx}
            className="absolute"
            style={{ left: p.x - 18, top: p.y - 18, width: 36, height: 36 }}
          >
            {/* Node base */}
            <div
              className="w-full h-full rounded-full border"
              style={{
                borderColor: "rgba(255,255,255,0.5)",
                background: "rgba(255,255,255,0.12)",
                backdropFilter: "blur(6px)",
                boxShadow: isSelected
                  ? "0 0 15px rgba(255,255,255,0.8)"
                  : "0 2px 8px rgba(0,0,0,0.25)",
              }}
            />
            {/* Unit if present */}
            {occupant && (
              <UnitBadge u={occupant} fam={UNIT_BASE[occupant.element]} active={now() < (occupant.localUntil || 0)} />
            )}
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
        >
          {e.aura && (
            <div
              className="absolute rounded-full"
              style={{
                inset: "-8px",
                border: "1px dashed rgba(255,255,255,0.6)",
              }}
            />
          )}
          {e.shieldHp > 0 && (
            <Shield
              size={12}
              color="#E3F2FD"
              className="absolute -top-3 -left-3 drop-shadow"
            />
          )}
          {e.kind === "boss" && (
            <Crown
              size={12}
              color="#FFF5B1"
              className="absolute -top-3 -right-3 drop-shadow"
            />
          )}
        </motion.div>
      ))}

      {/* Floaters */}
      <AnimatePresence>
        {floaters.map((f) => (
          <motion.div
            key={f.id}
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -24 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9 }}
            className="absolute text-xs font-semibold pointer-events-none"
            style={{ left: f.x, top: f.y, color: f.color }}
          >
            {f.text}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* HUD Top */}
      <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-white glass">
        <div className="flex items-center gap-3 text-sm">
          <span className="inline-flex items-center gap-1">
            <Coins size={14} /> {gold}
          </span>
          <span className="inline-flex items-center gap-1">
            <Heart size={14} /> {lives}
          </span>
          <span className="inline-flex items-center gap-1">
            Wave {wave}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn"
            onClick={togglePause}
            aria-label={paused ? "Resume" : "Pause"}
          >
            {paused ? <Play size={16} /> : <Pause size={16} />}
          </button>
          <button className="btn" onClick={saveProgress} aria-label="Save">
            <RotateCw size={16} />
          </button>
        </div>
      </div>

      {/* Arcane Bar */}
      <div className="absolute top-12 left-2 right-2 rounded-xl px-3 py-2 text-white glass">
        <div className="text-[11px] mb-1 flex justify-between">
          <span className="inline-flex items-center gap-1">
            <Wand2 size={14} /> Arcane Charge
          </span>
          <span>{arcane}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden">
          <div
            className="h-full bg-white"
            style={{ width: `${(arcane / ARCANE_MAX) * 100}%` }}
          />
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-2 left-2 right-2 rounded-2xl px-3 py-2 text-white glass">
        {/* Path selector (at start) */}
        {!chosenPath && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs opacity-90">Choose your Arcane Path:</span>
            <div className="flex gap-2">
              {ELEMENTS.map((el) => {
                const Icon = UNIT_BASE[el].icon;
                return (
                  <button
                    key={el}
                    className="btn px-2 py-1"
                    onClick={() => setChosenPath(el)}
                  >
                    <Icon size={16} />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Main bar */}
        <div className="mt-2 flex items-center justify-between gap-2">
          <button
            className={`btn flex-1 ${gold < rollCost ? "opacity-60" : ""}`}
            onClick={handleRoll}
            disabled={gold < rollCost}
            aria-label="Roll"
          >
            <Dice6 size={16} />
            <span className="text-xs ml-1">Roll ({rollCost})</span>
          </button>

          <button
            className={`btn flex-1 ${isGlobalReady ? "" : "opacity-60"}`}
            onClick={() =>
              triggerTap({ x: size.cx, y: size.cy })
            }
            aria-label="Global Surge"
          >
            <Zap size={16} />
            <span className="text-xs ml-1">
              Surge {globalActiveLeft > 0 ? "ON" : isGlobalReady ? "Ready" : `(${Math.ceil(globalCdLeft / 1000)}s)`}
            </span>
          </button>

          <button
            className="btn flex-1"
            onClick={resetGame}
            aria-label="Restart"
          >
            <RotateCw size={16} />
            <span className="text-xs ml-1">Restart</span>
          </button>
        </div>

        {/* Hand */}
        <div className="mt-2 flex items-center gap-2">
          {hand.length === 0 && (
            <span className="text-[11px] opacity-80">Roll to get a unit, then tap a node to place it.</span>
          )}
          {hand.map((u) => (
            <HandBadge key={u.id} u={u} />
          ))}
        </div>

        {/* Selected unit quick actions */}
        {selectedUnit && (
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11px] opacity-90">
              {niceUnitName(selectedUnit)} — Lvl {selectedUnit.level}
            </span>
            <button
              className={`btn ${gold < 30 + selectedUnit.level * 20 ? "opacity-60" : ""}`}
              onClick={upgradeSelected}
              disabled={gold < 30 + selectedUnit.level * 20}
            >
              Upgrade ({30 + selectedUnit.level * 20})
            </button>
          </div>
        )}
      </div>

      {/* Pause Curtain */}
      <AnimatePresence>
        {(paused || gameOver || !chosenPath) && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm"
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
                <button className="btn" onClick={togglePause}>
                  <Play size={16} /> <span className="ml-1 text-xs">Resume</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Glassmorphism helper */}
      <style>{glassCss}</style>
    </div>
  );
}

function niceUnitName(u) {
  const fam = UNIT_BASE[u.element];
  if (u.tier === 1) return fam.name;
  if (u.tier === 2) return fam.fusedNames[0];
  return fam.fusedNames[1];
}

function HandBadge({ u }) {
  const fam = UNIT_BASE[u.element];
  const Icon = fam.icon;
  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded-lg glass border border-white/30">
      <Icon size={14} color={fam.color} />
      <span className="text-[11px]">{fam.name}</span>
      <span className="text-[10px] opacity-80">(T{u.tier})</span>
    </div>
  );
}

function UnitBadge({ u, fam, active }) {
  const Icon = fam.icon;
  return (
    <motion.div
      className="absolute inset-0 rounded-full flex items-center justify-center"
      animate={{ scale: active ? 1.1 : 1 }}
      transition={{ type: "spring", stiffness: 140, damping: 12 }}
      style={{
        color: fam.color,
        textShadow: "0 2px 6px rgba(0,0,0,0.35)",
      }}
    >
      <Icon size={18} />
      <span
        className="absolute -bottom-4 text-[10px] font-semibold"
        style={{ color: "white" }}
      >
        T{u.tier}
      </span>
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

