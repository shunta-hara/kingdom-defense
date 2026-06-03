import { useState, useEffect, useRef, useCallback } from "react";

// ============================================================
// DATA DEFINITIONS
// ============================================================

const UNIT_DEFS = {
  spearman: {
    id: "spearman",
    name: "槍兵",
    emoji: "🗡️",
    desc: "単体に強力な一撃を放つ",
    baseCost: 50,
    baseAtk: 8,
    atkInterval: 2000,
    target: "single",
    color: "#c0392b",
    unlocked: true,
    skills: [
      { id: "s_pierce", name: "貫通突き", desc: "攻撃力+30%", cost: 200, effect: { atk: 0.3 } },
      { id: "s_guard", name: "鉄壁の構え", desc: "攻撃間隔-15%", cost: 400, effect: { interval: -0.15 } },
      { id: "s_lance", name: "竜騎士の槍", desc: "攻撃力+50%", cost: 1000, effect: { atk: 0.5 } },
    ],
  },
  archer: {
    id: "archer",
    name: "弓兵",
    emoji: "🏹",
    desc: "全敵に矢の雨を降らせる",
    baseCost: 80,
    baseAtk: 3,
    atkInterval: 1500,
    target: "all",
    color: "#27ae60",
    unlocked: true,
    skills: [
      { id: "a_rapid", name: "速射", desc: "攻撃間隔-20%", cost: 300, effect: { interval: -0.2 } },
      { id: "a_poison", name: "毒矢", desc: "攻撃力+40%", cost: 600, effect: { atk: 0.4 } },
      { id: "a_storm", name: "矢嵐", desc: "攻撃力+60%", cost: 1500, effect: { atk: 0.6 } },
    ],
  },
  mage: {
    id: "mage",
    name: "魔術師",
    emoji: "🔮",
    desc: "範囲魔法で敵を薙ぎ払う",
    baseCost: 120,
    baseAtk: 12,
    atkInterval: 3500,
    target: "splash",
    color: "#8e44ad",
    unlocked: true,
    skills: [
      { id: "m_nova", name: "魔力爆発", desc: "攻撃力+50%", cost: 500, effect: { atk: 0.5 } },
      { id: "m_focus", name: "精神集中", desc: "攻撃間隔-20%", cost: 700, effect: { interval: -0.2 } },
      { id: "m_meteor", name: "隕石落下", desc: "攻撃力+80%", cost: 2000, effect: { atk: 0.8 } },
    ],
  },
  paladin: {
    id: "paladin",
    name: "聖騎士",
    emoji: "⚔️",
    desc: "攻撃しながら味方を回復",
    baseCost: 200,
    baseAtk: 6,
    atkInterval: 2500,
    target: "single",
    color: "#f39c12",
    unlocked: true,
    skills: [
      { id: "p_holy", name: "聖なる光", desc: "攻撃力+40%", cost: 600, effect: { atk: 0.4 } },
      { id: "p_aura", name: "加護のオーラ", desc: "攻撃間隔-15%", cost: 800, effect: { interval: -0.15 } },
      { id: "p_divine", name: "神罰の剣", desc: "攻撃力+70%", cost: 2500, effect: { atk: 0.7 } },
    ],
  },
  swordmaster: {
    id: "swordmaster",
    name: "魔剣士",
    emoji: "⚡",
    desc: "槍兵Lv5+魔術師Lv5で解放",
    baseCost: 800,
    baseAtk: 35,
    atkInterval: 1800,
    target: "all",
    color: "#3498db",
    unlocked: false,
    unlockCond: { spearman: 5, mage: 5 },
    skills: [
      { id: "sw_blade", name: "魔力刀", desc: "攻撃力+60%", cost: 2000, effect: { atk: 0.6 } },
      { id: "sw_void", name: "虚空斬り", desc: "攻撃間隔-25%", cost: 3000, effect: { interval: -0.25 } },
      { id: "sw_legend", name: "伝説の剣技", desc: "攻撃力+100%", cost: 8000, effect: { atk: 1.0 } },
    ],
  },
  dragoon: {
    id: "dragoon",
    name: "竜騎士",
    emoji: "🐉",
    desc: "弓兵Lv5+聖騎士Lv5で解放",
    baseCost: 1000,
    baseAtk: 50,
    atkInterval: 4000,
    target: "splash",
    color: "#e74c3c",
    unlocked: false,
    unlockCond: { archer: 5, paladin: 5 },
    skills: [
      { id: "d_fire", name: "竜炎", desc: "攻撃力+80%", cost: 3000, effect: { atk: 0.8 } },
      { id: "d_ride", name: "天翔ける竜", desc: "攻撃間隔-30%", cost: 4000, effect: { interval: -0.3 } },
      { id: "d_roar", name: "竜王の咆哮", desc: "攻撃力+120%", cost: 10000, effect: { atk: 1.2 } },
    ],
  },
};

const PROPHECY_UPGRADES = [
  { id: "p_gold", name: "予知：黄金の時代", desc: "クリック金貨+50%", cost: 3, effect: { clickBonus: 0.5 } },
  { id: "p_start", name: "予知：早熟の才", desc: "全兵種の初期攻撃力+20%", cost: 5, effect: { globalAtk: 0.2 } },
  { id: "p_speed", name: "予知：疾風の記憶", desc: "全兵種の攻撃間隔-10%", cost: 8, effect: { globalInterval: -0.1 } },
  { id: "p_cost", name: "予知：節約の智恵", desc: "全兵種のコスト-20%", cost: 10, effect: { costReduction: 0.2 } },
  { id: "p_power", name: "予知：英雄の血脈", desc: "全兵種の攻撃力+50%", cost: 15, effect: { globalAtk: 0.5 } },
];

const WAVE_ENEMIES = (wave, rebirthBonus) => {
  const base = Math.floor(3 + wave * 1.5);
  const count = Math.min(base, 12);
  const hp = Math.floor(30 * Math.pow(1.4, wave - 1) * (1 + rebirthBonus * 0.1));
  const reward = Math.floor(10 * Math.pow(1.2, wave - 1));
  return Array.from({ length: count }, (_, i) => ({
    id: Date.now() + i,
    maxHp: hp,
    hp,
    emoji: wave < 5 ? "👹" : wave < 10 ? "💀" : wave < 20 ? "👿" : "🔥",
  }));
};

// ============================================================
// INITIAL STATE
// ============================================================

const initUnits = () =>
  Object.fromEntries(
    Object.keys(UNIT_DEFS).map((id) => [id, { level: 0, count: 0, unlockedSkills: [] }])
  );

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function KingdomDefense() {
  const [gold, setGold] = useState(0);
  const [fragments, setFragments] = useState(0); // 予知夢の欠片
  const [rebirthCount, setRebirthCount] = useState(0);
  const [units, setUnits] = useState(initUnits());
  const [enemies, setEnemies] = useState([]);
  const [wave, setWave] = useState(1);
  const [waveActive, setWaveActive] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState("spearman");
  const [activeTab, setActiveTab] = useState("units"); // units | skills | prophecy
  const [prophecyUpgrades, setProphecyUpgrades] = useState([]);
  const [floats, setFloats] = useState([]);
  const [battleLog, setBattleLog] = useState([]);
  const [showRebirth, setShowRebirth] = useState(false);
  const [clickPos, setClickPos] = useState(null);

  const gameRef = useRef({
    gold, units, enemies, wave, waveActive, prophecyUpgrades, rebirthCount, fragments,
  });

  useEffect(() => {
    gameRef.current = { gold, units, enemies, wave, waveActive, prophecyUpgrades, rebirthCount, fragments };
  });

  // ---- helpers ----

  const getProphecyEffect = useCallback(() => {
    const pu = gameRef.current.prophecyUpgrades;
    let clickBonus = 0, globalAtk = 0, globalInterval = 0, costReduction = 0;
    pu.forEach((id) => {
      const u = PROPHECY_UPGRADES.find((p) => p.id === id);
      if (!u) return;
      if (u.effect.clickBonus) clickBonus += u.effect.clickBonus;
      if (u.effect.globalAtk) globalAtk += u.effect.globalAtk;
      if (u.effect.globalInterval) globalInterval += u.effect.globalInterval;
      if (u.effect.costReduction) costReduction += u.effect.costReduction;
    });
    return { clickBonus, globalAtk, globalInterval, costReduction };
  }, []);

  const getUnitAtk = useCallback((unitId) => {
    const def = UNIT_DEFS[unitId];
    const u = gameRef.current.units[unitId];
    const pe = getProphecyEffect();
    let atkMult = 1 + pe.globalAtk;
    u.unlockedSkills.forEach((sid) => {
      const sk = def.skills.find((s) => s.id === sid);
      if (sk?.effect.atk) atkMult += sk.effect.atk;
    });
    const levelBonus = 1 + (u.level * 0.1);
    return Math.floor(def.baseAtk * atkMult * levelBonus * u.count);
  }, [getProphecyEffect]);

  const getUnitInterval = useCallback((unitId) => {
    const def = UNIT_DEFS[unitId];
    const u = gameRef.current.units[unitId];
    const pe = getProphecyEffect();
    let intervalMult = 1 + pe.globalInterval;
    u.unlockedSkills.forEach((sid) => {
      const sk = def.skills.find((s) => s.id === sid);
      if (sk?.effect.interval) intervalMult += sk.effect.interval;
    });
    return Math.max(500, def.atkInterval * Math.max(0.3, intervalMult));
  }, [getProphecyEffect]);

  const getUnitCost = useCallback((unitId) => {
    const def = UNIT_DEFS[unitId];
    const u = gameRef.current.units[unitId];
    const pe = getProphecyEffect();
    const reduction = pe.costReduction;
    return Math.floor(def.baseCost * Math.pow(1.15, u.count) * (1 - reduction));
  }, [getProphecyEffect]);

  const getLevelUpCost = (unitId) => {
    const u = gameRef.current.units[unitId];
    return Math.floor(UNIT_DEFS[unitId].baseCost * 3 * Math.pow(2, u.level));
  };

  const addFloat = (text, color = "#f1c40f", x = 50, y = 50) => {
    const id = Date.now() + Math.random();
    setFloats((f) => [...f, { id, text, color, x, y }]);
    setTimeout(() => setFloats((f) => f.filter((fl) => fl.id !== id)), 1200);
  };

  const addLog = (msg) => {
    setBattleLog((l) => [msg, ...l].slice(0, 20));
  };

  // ---- click ----

  const handleClick = (e) => {
    const pe = getProphecyEffect();
    const amount = Math.floor(1 * (1 + pe.clickBonus));
    setGold((g) => g + amount);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    addFloat(`+${amount}G`, "#f1c40f", x, y);
    setClickPos({ x: e.clientX, y: e.clientY, id: Date.now() });
  };

  // ---- wave ----

  const startWave = () => {
    if (gameRef.current.waveActive) return;
    const newEnemies = WAVE_ENEMIES(gameRef.current.wave, gameRef.current.rebirthCount);
    setEnemies(newEnemies);
    setWaveActive(true);
    addLog(`⚔️ Wave ${gameRef.current.wave} 開始！敵${newEnemies.length}体が攻め込んでくる！`);
  };

  // ---- combat loop ----

  useEffect(() => {
    const timers = [];
    Object.keys(UNIT_DEFS).forEach((unitId) => {
      const tick = () => {
        const { waveActive, enemies, units } = gameRef.current;
        if (!waveActive || enemies.length === 0 || units[unitId].count === 0) return;

        const def = UNIT_DEFS[unitId];
        const atk = getUnitAtk(unitId);
        if (atk === 0) return;

        setEnemies((prev) => {
          if (prev.length === 0) return prev;
          let updated = [...prev];

          if (def.target === "single") {
            const idx = 0;
            updated[idx] = { ...updated[idx], hp: updated[idx].hp - atk };
          } else if (def.target === "all" || def.target === "splash") {
            updated = updated.map((e) => ({ ...e, hp: e.hp - atk }));
          }

          // filter dead
          const dead = updated.filter((e) => e.hp <= 0);
          dead.forEach(() => {
            const reward = Math.floor(10 * Math.pow(1.2, gameRef.current.wave - 1));
            setGold((g) => g + reward);
            addFloat(`+${reward}G`, "#2ecc71", 70, 30);
          });
          const alive = updated.filter((e) => e.hp > 0);

          if (alive.length === 0 && prev.length > 0) {
            // wave clear
            setTimeout(() => {
              const bonus = Math.floor(50 * gameRef.current.wave);
              setGold((g) => g + bonus);
              addLog(`🎉 Wave ${gameRef.current.wave} クリア！ボーナス +${bonus}G`);
              setWave((w) => w + 1);
              setWaveActive(false);
              setEnemies([]);
            }, 100);
          }
          return alive;
        });
      };

      const interval = getUnitInterval(unitId);
      const t = setInterval(tick, interval);
      timers.push(t);
    });
    return () => timers.forEach(clearInterval);
  }, [getUnitAtk, getUnitInterval]);

  // ---- check unlocks ----

  useEffect(() => {
    setUnits((prev) => {
      const next = { ...prev };
      Object.entries(UNIT_DEFS).forEach(([id, def]) => {
        if (!def.unlockCond) return;
        const shouldUnlock = Object.entries(def.unlockCond).every(
          ([reqId, reqLv]) => prev[reqId]?.level >= reqLv
        );
        if (shouldUnlock && !next[id].unlocked) {
          // mark as newly unlocked — we store in UNIT_DEFS mutably for simplicity
          addLog(`✨ 上級兵種【${def.name}】が解放された！`);
        }
      });
      return next;
    });
  }, [units]);

  const isUnitUnlocked = (unitId) => {
    const def = UNIT_DEFS[unitId];
    if (!def.unlockCond) return true;
    return Object.entries(def.unlockCond).every(
      ([reqId, reqLv]) => units[reqId]?.level >= reqLv
    );
  };

  // ---- buy unit ----

  const buyUnit = (unitId) => {
    const cost = getUnitCost(unitId);
    if (gold < cost) return;
    setGold((g) => g - cost);
    setUnits((prev) => ({
      ...prev,
      [unitId]: { ...prev[unitId], count: prev[unitId].count + 1 },
    }));
    addFloat(`${UNIT_DEFS[unitId].name} 雇用！`, UNIT_DEFS[unitId].color, 30, 50);
  };

  // ---- level up unit ----

  const levelUpUnit = (unitId) => {
    const cost = getLevelUpCost(unitId);
    if (gold < cost) return;
    setGold((g) => g - cost);
    setUnits((prev) => ({
      ...prev,
      [unitId]: { ...prev[unitId], level: prev[unitId].level + 1 },
    }));
    addLog(`📈 ${UNIT_DEFS[unitId].name} がLv${units[unitId].level + 1}になった！`);
  };

  // ---- buy skill ----

  const buySkill = (unitId, skillId) => {
    const def = UNIT_DEFS[unitId];
    const sk = def.skills.find((s) => s.id === skillId);
    if (!sk || gold < sk.cost) return;
    if (units[unitId].unlockedSkills.includes(skillId)) return;
    setGold((g) => g - sk.cost);
    setUnits((prev) => ({
      ...prev,
      [unitId]: {
        ...prev[unitId],
        unlockedSkills: [...prev[unitId].unlockedSkills, skillId],
      },
    }));
    addLog(`✨ スキル【${sk.name}】習得！`);
  };

  // ---- buy prophecy ----

  const buyProphecy = (upgradeId) => {
    const pu = PROPHECY_UPGRADES.find((p) => p.id === upgradeId);
    if (!pu || fragments < pu.cost) return;
    if (prophecyUpgrades.includes(upgradeId)) return;
    setFragments((f) => f - pu.cost);
    setProphecyUpgrades((prev) => [...prev, upgradeId]);
    addLog(`🔮 予知【${pu.name}】が解放された！`);
  };

  // ---- rebirth ----

  const doRebirth = () => {
    const earned = Math.floor(wave / 3) + 1;
    setFragments((f) => f + earned);
    setRebirthCount((r) => r + 1);
    setGold(0);
    setUnits(initUnits());
    setEnemies([]);
    setWave(1);
    setWaveActive(false);
    setShowRebirth(false);
    addLog(`💫 予知夢の中で目覚めた…欠片を${earned}個手に入れた`);
  };

  // ---- total DPS ----

  const totalDps = Object.keys(UNIT_DEFS)
    .filter((id) => isUnitUnlocked(id) && units[id].count > 0)
    .reduce((sum, id) => {
      return sum + (getUnitAtk(id) / (getUnitInterval(id) / 1000));
    }, 0);

  // ---- render ----

  return (
    <div style={styles.root}>
      {/* floating particles bg */}
      <div style={styles.bgParticles}>
        {[...Array(20)].map((_, i) => (
          <div key={i} style={{ ...styles.particle, left: `${(i * 17 + 3) % 100}%`, animationDelay: `${i * 0.3}s`, animationDuration: `${4 + (i % 3)}s` }} />
        ))}
      </div>

      {/* HEADER */}
      <header style={styles.header}>
        <div style={styles.headerTitle}>
          <span style={styles.crownIcon}>👑</span>
          <span>王都防衛戦記</span>
          <span style={styles.headerSub}>〜予知夢の戦記〜</span>
        </div>
        <div style={styles.resources}>
          <ResourceBadge icon="🪙" value={Math.floor(gold)} label="金貨" color="#f1c40f" />
          <ResourceBadge icon="🔮" value={fragments} label="予知夢の欠片" color="#9b59b6" />
          <ResourceBadge icon="⚔️" value={`Wave ${wave}`} label="" color="#e74c3c" />
          <ResourceBadge icon="⚡" value={`${totalDps.toFixed(1)}`} label="DPS" color="#3498db" />
        </div>
      </header>

      <div style={styles.main}>
        {/* LEFT: BATTLE FIELD */}
        <div style={styles.battlefield}>
          <div style={styles.battleHeader}>
            <div style={styles.waveInfo}>
              {waveActive
                ? <span style={{ color: "#e74c3c" }}>⚔️ WAVE {wave} 進行中 — 残り敵 {enemies.length}体</span>
                : <span style={{ color: "#2ecc71" }}>✅ WAVE {wave} 待機中</span>}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ ...styles.btn, ...(!waveActive ? styles.btnPrimary : styles.btnDisabled) }}
                onClick={startWave} disabled={waveActive}>
                {waveActive ? "戦闘中..." : `Wave ${wave} 開始`}
              </button>
              <button style={{ ...styles.btn, ...styles.btnRebirth }} onClick={() => setShowRebirth(true)}>
                💫 転生
              </button>
            </div>
          </div>

          {/* Click area */}
          <div style={styles.clickZone} onClick={handleClick}>
            <div style={styles.castleIcon}>🏰</div>
            <div style={styles.clickHint}>クリックで金貨獲得</div>
            {/* floats */}
            {floats.map((f) => (
              <div key={f.id} style={{ ...styles.floatText, color: f.color, left: `${f.x}%`, top: `${f.y}%` }}>
                {f.text}
              </div>
            ))}
          </div>

          {/* Enemies */}
          <div style={styles.enemyArea}>
            <div style={styles.enemyGrid}>
              {enemies.map((e) => (
                <EnemyCard key={e.id} enemy={e} />
              ))}
            </div>
          </div>

          {/* Battle log */}
          <div style={styles.logBox}>
            {battleLog.slice(0, 6).map((msg, i) => (
              <div key={i} style={{ ...styles.logLine, opacity: 1 - i * 0.15 }}>{msg}</div>
            ))}
          </div>
        </div>

        {/* RIGHT: PANEL */}
        <div style={styles.panel}>
          {/* Tabs */}
          <div style={styles.tabs}>
            {[
              { id: "units", label: "兵種" },
              { id: "skills", label: "スキル" },
              { id: "prophecy", label: "予知夢" },
            ].map((tab) => (
              <button key={tab.id}
                style={{ ...styles.tab, ...(activeTab === tab.id ? styles.tabActive : {}) }}
                onClick={() => setActiveTab(tab.id)}>
                {tab.label}
              </button>
            ))}
          </div>

          <div style={styles.panelContent}>
            {activeTab === "units" && (
              <UnitsPanel
                units={units} isUnitUnlocked={isUnitUnlocked}
                getUnitCost={getUnitCost} getLevelUpCost={getLevelUpCost}
                getUnitAtk={getUnitAtk} getUnitInterval={getUnitInterval}
                gold={gold} buyUnit={buyUnit} levelUpUnit={levelUpUnit}
                selectedUnit={selectedUnit} setSelectedUnit={setSelectedUnit}
              />
            )}
            {activeTab === "skills" && (
              <SkillsPanel
                units={units} selectedUnit={selectedUnit}
                setSelectedUnit={setSelectedUnit}
                gold={gold} buySkill={buySkill}
                isUnitUnlocked={isUnitUnlocked}
              />
            )}
            {activeTab === "prophecy" && (
              <ProphecyPanel
                prophecyUpgrades={prophecyUpgrades}
                fragments={fragments}
                rebirthCount={rebirthCount}
                buyProphecy={buyProphecy}
              />
            )}
          </div>
        </div>
      </div>

      {/* Rebirth Modal */}
      {showRebirth && (
        <RebirthModal
          wave={wave} rebirthCount={rebirthCount}
          onConfirm={doRebirth} onCancel={() => setShowRebirth(false)}
        />
      )}
    </div>
  );
}

// ============================================================
// SUB COMPONENTS
// ============================================================

function ResourceBadge({ icon, value, label, color }) {
  return (
    <div style={styles.resBadge}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ color, fontWeight: 700, fontFamily: "'Crimson Text', serif", fontSize: 16 }}>{value}</span>
      {label && <span style={{ color: "#888", fontSize: 11 }}>{label}</span>}
    </div>
  );
}

function EnemyCard({ enemy }) {
  const pct = (enemy.hp / enemy.maxHp) * 100;
  return (
    <div style={styles.enemyCard}>
      <div style={{ fontSize: 20, lineHeight: 1 }}>{enemy.emoji}</div>
      <div style={styles.hpBarOuter}>
        <div style={{ ...styles.hpBarInner, width: `${pct}%`, background: pct > 50 ? "#2ecc71" : pct > 25 ? "#f39c12" : "#e74c3c" }} />
      </div>
      <div style={{ fontSize: 9, color: "#aaa" }}>{Math.max(0, enemy.hp)}</div>
    </div>
  );
}

function UnitsPanel({ units, isUnitUnlocked, getUnitCost, getLevelUpCost, getUnitAtk, getUnitInterval, gold, buyUnit, levelUpUnit, selectedUnit, setSelectedUnit }) {
  return (
    <div>
      {Object.entries(UNIT_DEFS).map(([id, def]) => {
        const unlocked = isUnitUnlocked(id);
        const u = units[id];
        const cost = getUnitCost(id);
        const lvCost = getLevelUpCost(id);
        const atk = getUnitAtk(id);
        const interval = getUnitInterval(id);
        return (
          <div key={id} style={{ ...styles.unitCard, ...(selectedUnit === id ? styles.unitCardSelected : {}), ...(unlocked ? {} : styles.unitCardLocked) }}
            onClick={() => unlocked && setSelectedUnit(id)}>
            <div style={styles.unitHeader}>
              <span style={{ fontSize: 22 }}>{def.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: def.color, fontFamily: "'Crimson Text', serif", fontSize: 15 }}>
                  {def.name} <span style={{ color: "#888", fontWeight: 400, fontSize: 12 }}>×{u.count}</span>
                  {u.level > 0 && <span style={{ color: "#f1c40f", fontSize: 11, marginLeft: 4 }}>Lv{u.level}</span>}
                </div>
                <div style={{ fontSize: 11, color: "#999" }}>{unlocked ? def.desc : (def.unlockCond ? `解放条件: ${Object.entries(def.unlockCond).map(([k, v]) => `${UNIT_DEFS[k].name}Lv${v}`).join("+")}` : "")}</div>
              </div>
              {unlocked && u.count > 0 && (
                <div style={{ fontSize: 11, color: "#aaa", textAlign: "right" }}>
                  <div>ATK: {atk}</div>
                  <div>{(interval / 1000).toFixed(1)}s</div>
                </div>
              )}
            </div>
            {unlocked && (
              <div style={styles.unitActions}>
                <button style={{ ...styles.btn, ...styles.btnSmall, ...(gold >= cost ? styles.btnPrimary : styles.btnDisabled) }}
                  onClick={(e) => { e.stopPropagation(); buyUnit(id); }} disabled={gold < cost}>
                  雇用 🪙{cost}
                </button>
                {u.count > 0 && (
                  <button style={{ ...styles.btn, ...styles.btnSmall, ...(gold >= lvCost ? styles.btnLevel : styles.btnDisabled) }}
                    onClick={(e) => { e.stopPropagation(); levelUpUnit(id); }} disabled={gold < lvCost}>
                    Lv↑ 🪙{lvCost}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SkillsPanel({ units, selectedUnit, setSelectedUnit, gold, buySkill, isUnitUnlocked }) {
  const def = UNIT_DEFS[selectedUnit];
  const u = units[selectedUnit];
  return (
    <div>
      {/* unit selector */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}>
        {Object.entries(UNIT_DEFS).filter(([id]) => isUnitUnlocked(id)).map(([id, d]) => (
          <button key={id}
            style={{ ...styles.btn, ...styles.btnSmall, ...(selectedUnit === id ? { background: d.color, color: "#fff", borderColor: d.color } : {}) }}
            onClick={() => setSelectedUnit(id)}>
            {d.emoji} {d.name}
          </button>
        ))}
      </div>
      <div style={{ marginBottom: 8, color: def.color, fontFamily: "'Crimson Text', serif", fontSize: 16, fontWeight: 700 }}>
        {def.emoji} {def.name}のスキル
      </div>
      {def.skills.map((sk) => {
        const owned = u.unlockedSkills.includes(sk.id);
        return (
          <div key={sk.id} style={{ ...styles.skillCard, ...(owned ? styles.skillOwned : {}) }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: owned ? "#2ecc71" : "#ddd", fontSize: 14 }}>
                {owned ? "✅" : "🔒"} {sk.name}
              </div>
              <div style={{ fontSize: 12, color: "#aaa" }}>{sk.desc}</div>
            </div>
            {!owned && (
              <button style={{ ...styles.btn, ...styles.btnSmall, ...(gold >= sk.cost ? styles.btnPrimary : styles.btnDisabled) }}
                onClick={() => buySkill(selectedUnit, sk.id)} disabled={gold < sk.cost}>
                🪙{sk.cost}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ProphecyPanel({ prophecyUpgrades, fragments, rebirthCount, buyProphecy }) {
  return (
    <div>
      <div style={styles.prophecyHeader}>
        <div style={{ color: "#9b59b6", fontFamily: "'Crimson Text', serif", fontSize: 17, fontWeight: 700 }}>
          🔮 予知夢の啓示
        </div>
        <div style={{ fontSize: 12, color: "#888", lineHeight: 1.5, marginTop: 4 }}>
          「また同じ夢を見ている——<br/>
          次の命では、もっとうまくやれる」
        </div>
        <div style={{ marginTop: 8, color: "#9b59b6" }}>
          転生回数: {rebirthCount} / 欠片: {fragments}個
        </div>
      </div>
      {PROPHECY_UPGRADES.map((pu) => {
        const owned = prophecyUpgrades.includes(pu.id);
        return (
          <div key={pu.id} style={{ ...styles.skillCard, ...(owned ? styles.skillOwned : {}) }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: owned ? "#9b59b6" : "#ddd", fontSize: 14 }}>
                {owned ? "✨" : "🔒"} {pu.name}
              </div>
              <div style={{ fontSize: 12, color: "#aaa" }}>{pu.desc}</div>
            </div>
            {!owned && (
              <button style={{ ...styles.btn, ...styles.btnSmall, ...(fragments >= pu.cost ? styles.btnProphecy : styles.btnDisabled) }}
                onClick={() => buyProphecy(pu.id)} disabled={fragments < pu.cost}>
                🔮{pu.cost}
              </button>
            )}
          </div>
        );
      })}
      <div style={{ marginTop: 16, padding: 12, background: "rgba(155,89,182,0.1)", borderRadius: 8, border: "1px solid rgba(155,89,182,0.3)", fontSize: 12, color: "#aaa", lineHeight: 1.8 }}>
        💡 転生すると所持金と兵士はリセットされますが、予知夢の欠片を獲得できます。<br/>
        欠片でWaveの進度に応じた永続強化を解放できます。
      </div>
    </div>
  );
}

function RebirthModal({ wave, rebirthCount, onConfirm, onCancel }) {
  const earned = Math.floor(wave / 3) + 1;
  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <div style={styles.modalTitle}>💫 予知夢の中へ</div>
        <div style={styles.modalFlavorText}>
          「また同じ夢を見ている——勇者よ。<br/>
          あの戦場の記憶は消えない。<br/>
          だが次の命では、もっと多くを知っているはずだ」
        </div>
        <div style={styles.modalInfo}>
          <div>現在のWave: <strong style={{ color: "#e74c3c" }}>{wave}</strong></div>
          <div>獲得できる予知夢の欠片: <strong style={{ color: "#9b59b6" }}>🔮 {earned}個</strong></div>
          <div style={{ color: "#e74c3c", marginTop: 8, fontSize: 13 }}>⚠️ 金貨と兵士はすべてリセットされます</div>
        </div>
        <div style={styles.modalActions}>
          <button style={{ ...styles.btn, ...styles.btnRebirth, padding: "10px 24px" }} onClick={onConfirm}>
            💫 転生する
          </button>
          <button style={{ ...styles.btn, padding: "10px 24px" }} onClick={onCancel}>
            戻る
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = {
  root: {
    minHeight: "100vh",
    background: "linear-gradient(160deg, #0a0a0f 0%, #1a0a2e 50%, #0d1a0a 100%)",
    color: "#e0d5c5",
    fontFamily: "'Georgia', 'Times New Roman', serif",
    position: "relative",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  bgParticles: {
    position: "fixed",
    inset: 0,
    pointerEvents: "none",
    zIndex: 0,
  },
  particle: {
    position: "absolute",
    width: 2,
    height: 2,
    borderRadius: "50%",
    background: "rgba(255,200,100,0.3)",
    animation: "floatUp 5s infinite ease-in-out",
    bottom: 0,
  },
  header: {
    background: "linear-gradient(90deg, rgba(20,10,5,0.95) 0%, rgba(40,20,10,0.95) 100%)",
    borderBottom: "2px solid rgba(193,154,107,0.4)",
    padding: "10px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
    position: "relative",
    zIndex: 10,
  },
  headerTitle: {
    fontFamily: "'Crimson Text', 'Georgia', serif",
    fontSize: 20,
    fontWeight: 700,
    color: "#c19a6b",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  crownIcon: { fontSize: 22 },
  headerSub: { fontSize: 12, color: "#888", fontWeight: 400 },
  resources: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  resBadge: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 6,
    padding: "3px 8px",
  },
  main: {
    display: "flex",
    flex: 1,
    gap: 0,
    position: "relative",
    zIndex: 1,
    minHeight: 0,
  },
  battlefield: {
    flex: "0 0 55%",
    display: "flex",
    flexDirection: "column",
    borderRight: "2px solid rgba(193,154,107,0.2)",
    padding: 12,
    gap: 8,
  },
  battleHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 6,
  },
  waveInfo: {
    fontSize: 13,
    fontFamily: "'Crimson Text', serif",
  },
  clickZone: {
    background: "linear-gradient(135deg, rgba(30,15,5,0.8) 0%, rgba(15,30,15,0.8) 100%)",
    border: "2px solid rgba(193,154,107,0.3)",
    borderRadius: 12,
    padding: "20px",
    cursor: "pointer",
    textAlign: "center",
    position: "relative",
    overflow: "hidden",
    userSelect: "none",
    transition: "transform 0.1s",
    minHeight: 100,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  castleIcon: { fontSize: 48, lineHeight: 1 },
  clickHint: { fontSize: 11, color: "#666", marginTop: 4 },
  floatText: {
    position: "absolute",
    fontFamily: "'Crimson Text', serif",
    fontWeight: 700,
    fontSize: 16,
    pointerEvents: "none",
    animation: "floatUp 1.2s ease-out forwards",
    transform: "translateX(-50%)",
    whiteSpace: "nowrap",
  },
  enemyArea: {
    flex: 1,
    minHeight: 80,
  },
  enemyGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    alignContent: "flex-start",
  },
  enemyCard: {
    background: "rgba(231,76,60,0.1)",
    border: "1px solid rgba(231,76,60,0.3)",
    borderRadius: 6,
    padding: "6px 8px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 3,
    minWidth: 44,
  },
  hpBarOuter: {
    width: 36,
    height: 4,
    background: "rgba(255,255,255,0.1)",
    borderRadius: 2,
    overflow: "hidden",
  },
  hpBarInner: {
    height: "100%",
    borderRadius: 2,
    transition: "width 0.3s",
  },
  logBox: {
    background: "rgba(0,0,0,0.4)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 8,
    padding: 8,
    maxHeight: 120,
    overflow: "hidden",
  },
  logLine: {
    fontSize: 11,
    color: "#bbb",
    lineHeight: 1.6,
    fontFamily: "'Georgia', serif",
  },
  panel: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
  },
  tabs: {
    display: "flex",
    borderBottom: "2px solid rgba(193,154,107,0.2)",
  },
  tab: {
    flex: 1,
    background: "transparent",
    border: "none",
    color: "#888",
    padding: "10px 0",
    cursor: "pointer",
    fontFamily: "'Crimson Text', serif",
    fontSize: 14,
    transition: "all 0.2s",
  },
  tabActive: {
    color: "#c19a6b",
    borderBottom: "2px solid #c19a6b",
    marginBottom: -2,
    fontWeight: 700,
  },
  panelContent: {
    flex: 1,
    overflowY: "auto",
    padding: 10,
  },
  unitCard: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 8,
    padding: "8px 10px",
    marginBottom: 6,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  unitCardSelected: {
    border: "1px solid rgba(193,154,107,0.5)",
    background: "rgba(193,154,107,0.08)",
  },
  unitCardLocked: {
    opacity: 0.5,
    cursor: "default",
    filter: "grayscale(0.5)",
  },
  unitHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  unitActions: {
    display: "flex",
    gap: 6,
    marginTop: 6,
  },
  skillCard: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 8,
    padding: "8px 10px",
    marginBottom: 6,
  },
  skillOwned: {
    border: "1px solid rgba(46,204,113,0.3)",
    background: "rgba(46,204,113,0.05)",
  },
  prophecyHeader: {
    marginBottom: 12,
    padding: 12,
    background: "rgba(155,89,182,0.1)",
    borderRadius: 8,
    border: "1px solid rgba(155,89,182,0.3)",
  },
  btn: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "#ccc",
    borderRadius: 6,
    padding: "6px 12px",
    cursor: "pointer",
    fontFamily: "'Georgia', serif",
    fontSize: 12,
    transition: "all 0.15s",
  },
  btnSmall: {
    padding: "4px 8px",
    fontSize: 11,
  },
  btnPrimary: {
    background: "linear-gradient(135deg, #c19a6b, #a07850)",
    border: "1px solid #c19a6b",
    color: "#fff",
  },
  btnLevel: {
    background: "linear-gradient(135deg, #2980b9, #1a5276)",
    border: "1px solid #3498db",
    color: "#fff",
  },
  btnRebirth: {
    background: "linear-gradient(135deg, #6c3483, #4a235a)",
    border: "1px solid #9b59b6",
    color: "#ddd",
  },
  btnProphecy: {
    background: "linear-gradient(135deg, #6c3483, #4a235a)",
    border: "1px solid #9b59b6",
    color: "#ddd",
  },
  btnDisabled: {
    opacity: 0.4,
    cursor: "not-allowed",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.85)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  modal: {
    background: "linear-gradient(160deg, #1a0a2e 0%, #0d0d1a 100%)",
    border: "2px solid rgba(155,89,182,0.5)",
    borderRadius: 16,
    padding: 28,
    maxWidth: 420,
    width: "90%",
    textAlign: "center",
  },
  modalTitle: {
    fontFamily: "'Crimson Text', serif",
    fontSize: 24,
    fontWeight: 700,
    color: "#9b59b6",
    marginBottom: 16,
  },
  modalFlavorText: {
    fontStyle: "italic",
    color: "#aaa",
    fontSize: 14,
    lineHeight: 1.8,
    marginBottom: 20,
    padding: "12px 16px",
    background: "rgba(155,89,182,0.1)",
    borderRadius: 8,
    borderLeft: "3px solid rgba(155,89,182,0.5)",
  },
  modalInfo: {
    fontSize: 14,
    lineHeight: 2,
    marginBottom: 20,
  },
  modalActions: {
    display: "flex",
    gap: 12,
    justifyContent: "center",
  },
};

// CSS animations injected globally
const styleTag = document.createElement("style");
styleTag.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&display=swap');
  @keyframes floatUp {
    0% { transform: translateX(-50%) translateY(0); opacity: 1; }
    100% { transform: translateX(-50%) translateY(-60px); opacity: 0; }
  }
  @keyframes floatUpBg {
    0% { transform: translateY(0) scale(1); opacity: 0.3; }
    100% { transform: translateY(-100vh) scale(0.5); opacity: 0; }
  }
  * { box-sizing: border-box; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
  ::-webkit-scrollbar-thumb { background: rgba(193,154,107,0.3); border-radius: 2px; }
`;
if (!document.head.querySelector("[data-kingdom-style]")) {
  styleTag.setAttribute("data-kingdom-style", "1");
  document.head.appendChild(styleTag);
}
