import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { useEffects } from '../EffectsOverlay';
import { audioService } from '../../services/audioService';

interface Slice {
  type: 'bomb' | 'points' | 'rare';
  id?: string;
  name?: string;
  icon?: string;
  color: string;
  label: string;
  value?: number;
  start: number;
  end: number;
}

const SPIN_DURATION_MS = 3200;
const BOMB_CHANCE_PER_SPIN = 10;

const POINT_SEGMENTS = [
  { label: '+5', color: '#fb8500', value: 5, baseSlots: 1 },
  { label: '+2', color: '#ffb703', value: 2, baseSlots: 2 },
  { label: '+1', color: '#38b000', value: 1, baseSlots: 3 }
];

const RARE_POWERS = [
  { id: 'shield', name: 'Shield', icon: '🛡️', color: '#3182ce', description: 'Block the next bomb!' },
  { id: 'double', name: 'Double Next', icon: '⚡', color: '#2b6cb0', description: 'Double the next points!' },
  { id: 'plantBomb', name: 'Plant Bomb', icon: '💣', color: '#6b46c1', description: 'Give leader a bomb!' },
  { id: 'superNova', name: 'Supernova', icon: '🌟', color: '#d53f8c', description: 'Give +3 to lowest team!' }
];

export const RouletteBaseGame: React.FC<{ onTurnEnd: () => void }> = ({ onTurnEnd }) => {
  const { state, addToPot, setBombChance, plantBomb, clearBomb, setShield, clearShield, addScore, unlockSpin, lockSpin, startRound } = useGame();
  const { floatText, particles, shakeScreen, explodeAt } = useEffects();

  const playHover = () => {
    audioService.sounds.navHover();
  };

  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [doubleNext, setDoubleNext] = useState(false);
  const [winningSlice, setWinningSlice] = useState<Slice | null>(null);
  const [outcomeMsg, setOutcomeMsg] = useState<string | null>(null);

  const wheelRef = useRef<HTMLDivElement | null>(null);
  const rotationTimerRef = useRef<number | null>(null);

  // Initialize round states
  useEffect(() => {
    startRound();
    setDoubleNext(false);
    setWinningSlice(null);
    // Check for planted bombs
    if (state.pendingBombTargets[state.activeIndex]) {
      clearBomb(state.activeIndex);
      setBombChance(20); // starts with 20% if targeted
      floatText("💣 BOMB DETECTED!", "#ef4444");
      audioService.sounds.bombPlant(); // Corrected sound effect
    } else {
      setBombChance(0);
    }
  }, [state.activeIndex]);

  // Build wheel slices dynamically based on the current bomb chance
  const buildSlices = (): Slice[] => {
    const bombSlots = Math.round(state.bombChance / 5); // 0% is 0, 100% is 20 slots
    const rareSlotsPerPower = 1;
    const rareSlots = RARE_POWERS.length * rareSlotsPerPower;
    const remaining = Math.max(0, 20 - bombSlots - rareSlots);

    const slices: Slice[] = [];
    let cursor = 0;
    const notchSize = 18; // 360 / 20 = 18 degrees per notch

    // 1. Bomb slices first
    for (let i = 0; i < bombSlots; i++) {
      slices.push({
        type: 'bomb',
        color: '#1a1a1a',
        label: '💣 BOMB',
        start: cursor,
        end: cursor + notchSize
      });
      cursor += notchSize;
    }

    // 2. Point slots
    const totalPointWeight = POINT_SEGMENTS.reduce((sum, s) => sum + s.baseSlots, 0);
    let slotsUsed = 0;

    POINT_SEGMENTS.forEach((seg, idx) => {
      const isLast = idx === POINT_SEGMENTS.length - 1;
      const slots = isLast 
        ? remaining - slotsUsed 
        : Math.round(remaining * (seg.baseSlots / totalPointWeight));
      
      slotsUsed += slots;

      for (let i = 0; i < slots; i++) {
        slices.push({
          type: 'points',
          color: seg.color,
          label: seg.label,
          value: seg.value,
          start: cursor,
          end: cursor + notchSize
        });
        cursor += notchSize;
      }
    });

    // 3. Rare Slots
    RARE_POWERS.forEach((rare) => {
      slices.push({
        type: 'rare',
        id: rare.id,
        name: rare.name,
        icon: rare.icon,
        color: rare.color,
        label: `${rare.icon} ${rare.name}`,
        start: cursor,
        end: cursor + notchSize
      });
      cursor += notchSize;
    });

    return slices;
  };

  const slices = buildSlices();

  // Create conic-gradient formula
  const getConicGradient = () => {
    return `conic-gradient(${
      slices.map(s => `${s.color} ${s.start}deg ${s.end}deg`).join(', ')
    })`;
  };

  const handleSpin = () => {
    if (isSpinning || state.spinLocked) return;

    setIsSpinning(true);
    lockSpin();
    setOutcomeMsg(null);
    setWinningSlice(null);

    // Restoration of random degree targeting for increased tension
    const targetAngle = Math.random() * 360;
    const extraTurns = (8 + Math.floor(Math.random() * 4)) * 360;
    
    // Calculate necessary delta to reach absolute targetAngle from current rotation
    const targetRotation = (360 - targetAngle) % 360;
    const currentRotationMod = rotation % 360;
    const delta = (targetRotation - currentRotationMod + 360) % 360;
    const finalRotation = rotation + extraTurns + delta;

    setRotation(finalRotation);

    // Dynamic mechanical tick-sound simulator aligned with degrees crossings
    let lastCrossedAngle = 0;
    const notchSize = 18;
    const startNow = performance.now();

    const monitorTicking = () => {
      const elapsed = performance.now() - startNow;
      const progress = elapsed / SPIN_DURATION_MS;

      if (progress < 1.0) {
        // Standard ease-out cubic curve (approximates CSS transition ease-out)
        const t = progress;
        const easedProgress = 1 - Math.pow(1 - t, 3);
        const currentAngle = (rotation + (finalRotation - rotation) * easedProgress) % 360;

        const currentSlotIndex = Math.floor(currentAngle / notchSize);
        const lastSlotIndex = Math.floor(lastCrossedAngle / notchSize);

        if (currentSlotIndex !== lastSlotIndex) {
          audioService.sounds.tick();
          // Micro visual recoil on pointer
          const ptr = document.getElementById('base-ptr-svg');
          if (ptr) {
            ptr.classList.add('rotate-[-10deg]');
            setTimeout(() => ptr.classList.remove('rotate-[-10deg]'), 80);
          }
        }
        lastCrossedAngle = currentAngle;
        rotationRef.current = requestAnimationFrame(monitorTicking);
      }
    };

    const rotationRef = { current: requestAnimationFrame(monitorTicking) };

    // Resolve landing outcome
    setTimeout(() => {
      cancelAnimationFrame(rotationRef.current);
      setIsSpinning(false);
      unlockSpin();

      // Find which slice the pointer hit
      const settledAngle = targetAngle % 360;
      const hitSlice = slices.find(s => settledAngle >= s.start && settledAngle < s.end) || slices[0];

      setWinningSlice(hitSlice);
      resolveOutcome(hitSlice);
    }, SPIN_DURATION_MS);
  };

  const handleBombEscalation = () => {
    const target = Math.min(90, state.bombChance + BOMB_CHANCE_PER_SPIN);
    // Wait 1 second so players can celebrate their landing before the danger grows
    setTimeout(() => {
      // Reset the notch highlighting and pointer fill as growth begins
      setWinningSlice(null);

      let current = state.bombChance;
      const step = () => {
        if (current < target) {
          current += 1;
          setBombChance(current);
          requestAnimationFrame(step);
        }
      };
      requestAnimationFrame(step);
    }, 1000);
  };

  const resolveOutcome = (slice: Slice) => {
    const activeTeam = state.teams[state.activeIndex];
    const triggerX = window.innerWidth / 2;
    const triggerY = window.innerHeight / 2 - 50;

    if (slice.type === 'bomb') {
      // Check shield defenses!
      if (state.shielded[activeTeam.index]) {
        clearShield(activeTeam.index);
        floatText("🛡️ SHIELD BLOCKED BOMB!", "#3182ce");
        audioService.sounds.rare();
        setOutcomeMsg("Shield Block!");
        return;
      }

      // Oh no, bomb detonates!
      explodeAt(triggerX, triggerY);
      shakeScreen();
      audioService.sounds.bomb();
      setOutcomeMsg(`${activeTeam.name} exploded! Pot of ${state.pot} points destroyed!`);
      
      setTimeout(() => {
        onTurnEnd();
      }, 2500);

    } else if (slice.type === 'points') {
      const basePoints = slice.value || 1;
      const points = doubleNext ? basePoints * 2 : basePoints;
      
      addToPot(points);
      audioService.sounds.point(points);

      const labelColor = doubleNext ? '#2b6cb0' : '#38b000';
      floatText(doubleNext ? `⚡ x2 DOUBLE! +${points}` : `+${points} POT!`, labelColor);
      particles('pot-label-item', labelColor, 10);
      setOutcomeMsg(doubleNext ? `⚡ DOUBLE! Landed on +${basePoints} x2! Bomb potential is now ${state.bombChance + BOMB_CHANCE_PER_SPIN}%!` : `Landed on +${points}! Bomb potential is now ${state.bombChance + BOMB_CHANCE_PER_SPIN}%!`);
      
      handleBombEscalation();
      if (doubleNext) setDoubleNext(false);
    } else if (slice.type === 'rare' && slice.id) {
      audioService.sounds.rare();

      switch (slice.id) {
        case 'shield':
          setShield(activeTeam.index);
          floatText("SHIELD ACTIVE! 🛡️", "#3182ce");
          setOutcomeMsg("Gained Star Shield protection!");
          break;

        case 'double':
          setDoubleNext(true);
          floatText("⚡ DOUBLE NEXT!", "#2b6cb0");
          setOutcomeMsg("The next point segment you land on will be doubled!");
          break;

        case 'superNova':
          const sorted = [...state.teams].sort((a, b) => a.score - b.score);
          const targetTeam = sorted.find(t => t.index !== activeTeam.index) || sorted[0];
          addScore(targetTeam.index, 3);
          floatText(`🌟 ASSIST: ${targetTeam.name} +3`, "#d53f8c");
          setOutcomeMsg(`Supernova triggered! Gave +3 points to ${targetTeam.name}.`);
          break;

        case 'plantBomb':
          // Find opposing team with the highest score
          const opponents = [...state.teams]
            .filter(t => t.index !== activeTeam.index && !state.pendingBombTargets[t.index])
            .sort((a, b) => b.score - a.score);
          
          if (opponents.length > 0) {
            plantBomb(opponents[0].index);
            floatText(`💣 PLANTED: ${opponents[0].name}`, '#ff4757');
            setOutcomeMsg(`Planted ticking bomb on ${opponents[0].name}!`);
          } else {
            addToPot(2);
            setOutcomeMsg("No valid target, +2 points instead.");
          }
          break;
      }

      handleBombEscalation();
    }
  };

  const handleBank = () => {
    if (isSpinning || state.pot <= 0) return;
    const activeTeam = state.teams[state.activeIndex];
    addScore(activeTeam.index, state.pot);
    audioService.sounds.bank();
    floatText(`+${state.pot} ⭐ BANKED!`, '#ffb703');
    particles('tab-score-item', '#ffb703', 15);
    onTurnEnd();
  };

  return (
    <div className="flex flex-col xl:flex-row items-center justify-center gap-12 xl:gap-20 p-4 w-full h-full select-none animate-[fadeIn_0.5s_forwards]">
      
      {/* Visual Wheel Frame */}
      <div className="relative flex flex-col items-center scale-100 xl:scale-110">
        {/* Pointer block */}
        <svg
          id="base-ptr-svg"
          viewBox="0 0 30 30"
          className={`absolute -top-4 w-10 h-10 z-30 transition-all filter drop-shadow-[0_0_8px_rgba(250,204,21,0.4)] origin-top ${winningSlice ? 'scale-125' : ''}`}
        >
          <path
            d="M15 30 L0 0 L30 0 Z"
            fill={winningSlice ? winningSlice.color : '#18181b'}
            stroke="#facc15"
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </svg>

        {/* Outer orbital border */}
        <div className="relative w-[440px] h-[440px] md:w-[520px] md:h-[520px] rounded-full border-8 border-indigo-900/60 p-1 bg-zinc-950 flex items-center justify-center shadow-[0_0_70px_rgba(99,102,241,0.35)] relative">
          
          {/* Inner rotating core */}
          <div
            ref={wheelRef}
            className="w-full h-full rounded-full transition-transform"
            style={{
              backgroundImage: getConicGradient(),
              transform: `rotate(${rotation}deg)`,
              transitionDuration: isSpinning ? `${SPIN_DURATION_MS}ms` : '0ms',
              transitionTimingFunction: 'cubic-bezier(0.1, 0.8, 0.1, 1)'
            }}
          >
            {/* 5% Notches (Visual Ticks) - Now inside so they spin with the wheel */}
            <div className="absolute inset-0 w-full h-full pointer-events-none z-20">
              {Array.from({ length: 20 }).map((_, i) => {
                const angle = i * 18;
                const isWinningNotch = winningSlice && (angle >= winningSlice.start && angle <= winningSlice.end);
                return (
                  <div
                    key={i}
                    className="absolute inset-0"
                    style={{ transform: `rotate(${angle}deg)` }}
                  >
                    <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-1 h-4 transition-all duration-500 ${isWinningNotch ? 'bg-white scale-y-150 shadow-[0_0_10px_white]' : 'bg-white/40'}`} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Center cap cover with bomb pulsing visualization overlay */}
          <div className="absolute w-24 h-24 rounded-full bg-zinc-900 border-4 border-indigo-950 flex flex-col items-center justify-center text-center z-10 shadow-lg">
            <span className="text-[10px] text-zinc-500 font-extrabold tracking-widest font-mono">BOMB</span>
            <span className={`text-xl font-black mt-0.5 ${state.bombChance > 50 ? 'text-red-500 animate-bounce' : 'text-zinc-300'}`}>
              {state.bombChance}%
            </span>
          </div>

        </div>
      </div>

      {/* Control Actions & HUD panel */}
      <div className="flex-1 max-w-md w-full space-y-6 bg-zinc-900/10 p-6 rounded-[2rem] border border-white/5 backdrop-blur-sm">
        
        {/* Pot scoreboard panel */}
        <div className="bg-zinc-950/80 border border-zinc-850 rounded-2xl p-5 text-center shadow-inner relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none" />
          <div id="pot-label-item" className="text-zinc-500 text-xs font-bold uppercase tracking-widest">CURRENT POINT POT</div>
          <div className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 my-2 filter drop-shadow-[0_0_15px_rgba(245,158,11,0.35)] font-mono animate-pulse">
            {state.pot}
          </div>
          <div className="text-xs text-zinc-500 italic">Spin to grow the pot! Bank to lock in points!</div>
        </div>

        {/* Action button rows */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onMouseEnter={playHover}
            disabled={isSpinning}
            onClick={handleSpin}
            className="py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-xl text-lg font-extrabold shadow-lg hover:shadow-indigo-500/10 cursor-pointer active:scale-95 transition-all text-center uppercase tracking-wider"
          >
            🌀 SPIN WHEEL
          </button>

          <button
            onMouseEnter={playHover}
            disabled={isSpinning || state.pot <= 0}
            onClick={handleBank}
            className="py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white rounded-xl text-lg font-extrabold shadow-lg hover:shadow-emerald-500/10 cursor-pointer active:scale-95 transition-all text-center uppercase tracking-wider"
          >
            💰 BANK SCORES
          </button>
        </div>

        {/* Status ticker list */}
        {outcomeMsg && (
          <div className="p-4 bg-zinc-900/60 border border-zinc-850 rounded-xl text-sm font-semibold text-indigo-200 animate-[fadeIn_0.3s_forwards] text-center border-l-4 border-l-indigo-500">
            {outcomeMsg}
          </div>
        )}

        {/* Color Legend */}
        <div className="bg-zinc-950/40 border border-zinc-850/50 rounded-2xl p-6">
          <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4 text-center">Segment Legend</h4>
          <div className="flex flex-col gap-y-3">
            {POINT_SEGMENTS.map(s => (
              <div key={s.label} className="flex items-center gap-3 text-[11px] font-bold">
                <div className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: s.color }} />
                <span className="text-zinc-300">{s.label} Points</span>
              </div>
            ))}
            <div className="flex items-center gap-3 text-[11px] font-bold">
              <div className="w-3.5 h-3.5 rounded-full bg-[#1a1a1a] border border-zinc-700 shadow-sm" />
              <span className="text-red-500">💣 BOMB (Wipe Pot)</span>
            </div>
            {RARE_POWERS.map(p => (
              <div key={p.id} className="flex items-center gap-3 text-[11px] font-bold">
                <div className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: p.color }} />
                <span className="text-indigo-300">{p.icon} {p.name}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
export default RouletteBaseGame;
