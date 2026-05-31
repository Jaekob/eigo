import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { useEffects } from '../EffectsOverlay';
import { audioService } from '../../services/audioService';

interface RachelSlice {
  type: 'points' | 'rare' | 'bomb';
  color: string;
  label: string;
  value?: number;
  slots: number;
  start: number;
  end: number;
}

const SPIN_DURATION_MS = 3200;

const SEGMENTS = [
  { label: '+1', color: '#ef4444', type: 'points', value: 1, slots: 5 },
  { id: 'give', label: '🎁 GIVE 3', color: '#f97316', type: 'rare', slots: 2 },
  { label: '+2', color: '#eab308', type: 'points', value: 2, slots: 5 },
  { id: 'swap', label: '🔄 SWAP', color: '#22c55e', type: 'rare', slots: 1 },
  { label: '+3', color: '#3b82f6', type: 'points', value: 3, slots: 5 },
  { label: '💣 WIPE', color: '#1a1a1a', type: 'bomb', slots: 2 },
];

export const RouletteRachelGame: React.FC<{ onTurnEnd: () => void }> = ({ onTurnEnd }) => {
  const { state, addScore, setScore, swapScores, setBombChance, lockSpin, unlockSpin, startRound } = useGame();
  const { floatText, particles, shakeScreen, explodeAt } = useEffects();

  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [outcomeMsg, setOutcomeMsg] = useState<string | null>(null);
  const [spinResult, setSpinResult] = useState<string | number>(0);
  const [winningSlice, setWinningSlice] = useState<RachelSlice | null>(null);
  const [spinDone, setSpinDone] = useState(false);

  const wheelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    startRound();
    setBombChance(15); // Fixed bomb probability
    setSpinDone(false);
    setWinningSlice(null);
    setSpinResult(0);
  }, [state.activeIndex]);

  // Build fixed wheel slices
  const buildSlices = (): RachelSlice[] => {
    const totalSlots = SEGMENTS.reduce((sum, s) => sum + s.slots, 0); // 20 slots
    const notchSize = 360 / totalSlots; // 18 degrees

    let cursor = 0;
    return SEGMENTS.map(s => {
      const start = cursor;
      const end = cursor + s.slots * notchSize;
      cursor = end;
      return {
        ...s,
        start,
        end
      } as RachelSlice;
    });
  };

  const slices = buildSlices();

  const getConicGradient = () => {
    return `conic-gradient(${
      slices.map(s => `${s.color} ${s.start}deg ${s.end}deg`).join(', ')
    })`;
  };

  const handleSpin = () => {
    if (isSpinning || state.spinLocked || spinDone) return;

    setIsSpinning(true);
    lockSpin();
    setOutcomeMsg(null);
    setWinningSlice(null);
    setSpinResult('...');

    // Restoration of random degree targeting
    const targetAngle = Math.random() * 360;
    const extraTurns = (8 + Math.floor(Math.random() * 4)) * 360;
    
    // Calculate necessary delta to reach absolute targetAngle from current rotation
    const targetRotation = (360 - targetAngle) % 360;
    const currentRotationMod = rotation % 360;
    const delta = (targetRotation - currentRotationMod + 360) % 360;
    const finalRotation = rotation + extraTurns + delta;

    setRotation(finalRotation);

    let lastCrossedAngle = 0;
    const notchSize = 18;
    const startNow = performance.now();

    const monitorTicking = () => {
      const elapsed = performance.now() - startNow;
      const progress = elapsed / SPIN_DURATION_MS;

      if (progress < 1.0) {
        const t = progress;
        const easedProgress = 1 - Math.pow(1 - t, 3);
        const currentAngle = (rotation + (finalRotation - rotation) * easedProgress) % 360;

        const currentSlotIndex = Math.floor(currentAngle / notchSize);
        const lastSlotIndex = Math.floor(lastCrossedAngle / notchSize);

        if (currentSlotIndex !== lastSlotIndex) {
          audioService.sounds.tick();
          const ptr = document.getElementById('rachel-ptr-svg');
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

    setTimeout(() => {
      cancelAnimationFrame(rotationRef.current);
      setIsSpinning(false);
      unlockSpin();
      setSpinDone(true);

      const settledAngle = targetAngle % 360;
      const hitSlice = slices.find(s => settledAngle >= s.start && settledAngle < s.end) || slices[0];

      setWinningSlice(hitSlice);
      resolveOutcome(hitSlice);
    }, SPIN_DURATION_MS);
  };

  const resolveOutcome = (slice: RachelSlice) => {
    const activeTeam = state.teams[state.activeIndex];
    const triggerX = window.innerWidth / 2;
    const triggerY = window.innerHeight / 2 - 50;

    if (slice.type === 'bomb') {
      // Direct total wipe to 0 score!
      setScore(activeTeam.index, 0);
      explodeAt(triggerX, triggerY);
      shakeScreen();
      audioService.sounds.bomb();
      floatText("💣 COMPLETE WIPE!", "#ef4444");
      setOutcomeMsg(`${activeTeam.name} score has been wiped back to 0!`);
      setSpinResult('WIPE');

    } else if (slice.type === 'points') {
      const points = slice.value || 1;
      // Auto bank
      addScore(activeTeam.index, points);
      audioService.sounds.point(points);
      floatText(`+${points} STARS!`, '#38b000');
      particles('rachel-pts-item', '#38b000', 12);
      setOutcomeMsg(`Landed on +${points}! Points have been automatically added to your score.`);
      setSpinResult(`+${points}`);

    } else if (slice.type === 'rare') {
      const rareId = (slice as any).id;
      setSpinResult(slice.label.split(' ')[0]); // Display the icon (🎁 or 🔄)

      if (rareId === 'give') {
        // Find trailing team (excluding current team)
        const sorted = [...state.teams].sort((a, b) => a.score - b.score);
        const targetTeam = sorted.find(t => t.index !== activeTeam.index) || sorted[0];

        addScore(targetTeam.index, 3);
        audioService.sounds.rare();
        floatText(`🎁 GAVE 3 TO ${targetTeam.name}`, '#ff007f');
        setOutcomeMsg(`Gave 3 free points to ${targetTeam.name}!`);

      } else if (rareId === 'swap') {
        // Find leading team
        const sorted = [...state.teams].sort((a, b) => b.score - a.score);
        const leader = sorted[0];

        // If active team IS already the leader, swap with the runner up (2nd place)
        const targetTeam = leader.index === activeTeam.index ? sorted[1] : leader;

        if (targetTeam) {
          swapScores(activeTeam.index, targetTeam.index);
          audioService.sounds.rare();
          floatText(`🔄 SWAPPED WITH ${targetTeam.name}!`, '#8338ec');
          setOutcomeMsg(`Swapped scores directly with ${targetTeam.name}!`);
          setSpinResult('SWAP');
        } else {
          addScore(activeTeam.index, 2);
          setOutcomeMsg("No partner to swap with, gained 2 points.");
          setSpinResult('+2');
        }
      }
    }

    // Reset highlighting after a delay since Rachel doesn't have bomb growth
    setTimeout(() => {
      setWinningSlice(null);
    }, 1500);
  };

  const handleNext = () => {
    onTurnEnd();
  };

  return (
    <div className="flex flex-col xl:flex-row items-center justify-center gap-12 xl:gap-20 p-4 w-full h-full select-none animate-[fadeIn_0.5s_forwards]">
      
      {/* Visual Wheel Frame */}
      <div className="relative flex flex-col items-center scale-100 xl:scale-110">
        <svg
          id="rachel-ptr-svg"
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

        <div className="relative w-[440px] h-[440px] md:w-[520px] md:h-[520px] rounded-full border-8 border-purple-900/60 p-1 bg-zinc-950 flex items-center justify-center shadow-[0_0_70px_rgba(139,92,246,0.35)] relative">
          
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

          <div className="absolute w-24 h-24 rounded-full bg-zinc-900 border-4 border-purple-950 flex flex-col items-center justify-center text-center z-10 shadow-lg">
            <span className="text-[10px] text-zinc-500 font-extrabold tracking-widest font-mono">BOMB</span>
            <span className="text-xl font-black mt-0.5 text-zinc-300">
              15%
            </span>
          </div>

        </div>
      </div>

      {/* Control Actions & HUD panel */}
      <div className="flex-1 max-w-md w-full space-y-6 bg-zinc-900/10 p-6 rounded-[2rem] border border-white/5 backdrop-blur-sm">
        
        {/* Pot scoreboard panel */}
        <div className="bg-zinc-950/80 border border-zinc-850 rounded-2xl p-5 text-center shadow-inner relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-purple-500/10 to-transparent pointer-events-none" />
          <div id="rachel-pts-item" className="text-purple-400 text-xs font-bold uppercase tracking-widest">Spin Result</div>
          <div className="text-5xl md:text-6xl font-black text-zinc-100 my-2 tracking-tight font-mono animate-pulse filter drop-shadow-[0_0_15px_rgba(168,85,247,0.35)]">
            {spinResult}
          </div>
          <div className="text-xs text-zinc-500 italic">Points are automatically banked to your team!</div>
        </div>

        {/* Action button rows */}
        <div className="flex flex-col gap-4">
          {!spinDone ? (
            <button
              disabled={isSpinning}
              onClick={handleSpin}
              className="py-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:hover:bg-purple-600 text-white rounded-xl text-lg font-extrabold shadow-lg hover:shadow-purple-500/10 cursor-pointer active:scale-95 transition-all text-center uppercase tracking-wider"
            >
              🌀 SPIN COMPACT WHEEL
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-lg font-extrabold shadow-lg hover:shadow-indigo-500/10 cursor-pointer active:scale-95 transition-all text-center uppercase tracking-wider"
            >
              CONTINUE GAME ➔
            </button>
          )}
        </div>

        {/* Status ticker list */}
        {outcomeMsg && (
          <div className="p-4 bg-zinc-900/60 border border-zinc-850 rounded-xl text-sm font-semibold text-purple-200 animate-[fadeIn_0.3s_forwards] text-center border-l-4 border-l-purple-500">
            {outcomeMsg}
          </div>
        )}

        {/* Color Legend */}
        <div className="bg-zinc-950/40 border border-zinc-850/50 rounded-2xl p-6">
          <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4 text-center">Galactic Legend</h4>
          <div className="flex flex-col gap-y-3">
            {SEGMENTS.map(s => (
              <div key={s.label} className="flex items-center gap-3 text-[11px] font-bold">
                <div className="w-3.5 h-3.5 rounded-full border border-white/10 shadow-sm" style={{ backgroundColor: s.color }} />
                <span className={s.type === 'bomb' ? 'text-red-500' : 'text-zinc-300'}>
                  {s.label} {s.type === 'points' ? 'Pts' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
export default RouletteRachelGame;
