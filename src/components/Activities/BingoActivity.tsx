import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { Question } from '../../types';
import { audioService } from '../../services/audioService';
import { useEffects } from '../EffectsOverlay';

interface BingoActivityProps {
  onResolved: (correct: boolean) => void;
}

// Helper Component: Renders a 3D-effect Bingo ball (Ping-pong style)
const BingoBall: React.FC<{
  number: number;
  color?: string;
  size?: 'sm' | 'lg' | 'xl';
  isShuffling?: boolean;
}> = ({ number, color = '#6366f1', size = 'lg', isShuffling }) => {
  const sizeMap = {
    sm: 'w-16 h-16 text-xl',
    lg: 'w-32 h-32 text-4xl',
    xl: 'w-48 h-48 text-6xl'
  };

  return (
    <div
      className={`${sizeMap[size]} rounded-full flex items-center justify-center font-black text-zinc-950 shadow-[inset_-4px_-4px_12px_rgba(0,0,0,0.2),0_15px_30px_rgba(0,0,0,0.3)] relative overflow-hidden transition-all duration-300 ${isShuffling ? 'animate-bounce' : ''}`}
      style={{
        background: `radial-gradient(circle at 35% 35%, #ffffff 0%, #f4f4f5 40%, #d1d5db 100%)`,
        border: `1px solid rgba(0,0,0,0.1)`
      }}
    >
      {/* Glossy Reflection */}
      <div className="absolute top-[10%] left-[20%] w-[30%] h-[30%] bg-white/20 rounded-full blur-[2px]" />
      <span className="z-10 font-mono tracking-tighter">{number}</span>
    </div>
  );
};

export const BingoActivity: React.FC<BingoActivityProps> = () => {
  const { state, advanceTurn } = useGame();
  const { floatText } = useEffects();

  // State for tracking available and drawn questions
  const [available, setAvailable] = useState<(Question & { num: number })[]>([]);
  const [drawn, setDrawn] = useState<(Question & { num: number })[]>([]);
  const [current, setCurrent] = useState<(Question & { num: number }) | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animNumber, setAnimNumber] = useState<number>(0);
  const [isStirring, setIsStirring] = useState(false);

  // Initialize or reset when the lesson changes
  useEffect(() => {
    if (state.activeLesson) {
      const mapped = state.activeLesson.questions.map((q, i) => ({ ...q, num: i + 1 }));
      setAvailable(mapped);
      setDrawn([]);
      setCurrent(null);
      setIsStirring(true);
    }
  }, [state.activeLesson]);

  // Stirring sound effect loop
  useEffect(() => {
    if (!isStirring || isAnimating || available.length === 0) return;
    
    const interval = setInterval(() => {
      audioService.play({ freq: 120 + Math.random() * 50, type: 'sine', dur: 0.05, vol: 0.02 });
    }, 400);
    
    return () => clearInterval(interval);
  }, [isStirring, isAnimating, available.length]);

  const drawNext = () => {
    if (isAnimating || available.length === 0) return;

    setIsAnimating(true);
    audioService.sounds.navHover();

    let ticks = 0;
    const interval = setInterval(() => {
      const rnd = available[Math.floor(Math.random() * available.length)];
      setAnimNumber(rnd.num);
      audioService.sounds.tick();
      ticks++;
      
      if (ticks > 18) {
        clearInterval(interval);
        
        const index = Math.floor(Math.random() * available.length);
        const picked = available[index];
        const newAvailable = available.filter((_, i) => i !== index);
        
        setAvailable(newAvailable);
        setCurrent(picked);
        setDrawn(prev => [picked, ...prev]);
        setIsStirring(true);
        setIsAnimating(false);
        
        audioService.sounds.victory();
        floatText(`NUMBER ${picked.num} DRAWN!`, "#f1c40f");
      }
    }, 80);
  };

  const showPrompt = current ? (state.showBackFirst ? (current.back || current.front) : current.front) : "";

  return (
    <div className="w-full h-full flex gap-6 animate-[fadeIn_0.5s_forwards] select-none p-2 overflow-hidden min-h-0">
      
      {/* 1. LEFT 1/3: Vertical scroll history container */}
      <div className="w-1/3 bg-zinc-950/30 border border-zinc-900 rounded-[2rem] flex flex-col shadow-2xl overflow-hidden h-full min-h-0 max-h-full">
        <div className="p-5 border-b border-white/5 bg-zinc-900/20 shrink-0">
          <h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center justify-between">
            <span>Call History</span>
            <span className="text-zinc-600 font-mono">{drawn.length} pulled</span>
          </h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent h-full min-h-0">
          {drawn.map((q, i) => (
            <div 
              key={`${q.id}-${i}`}
              className={`flex items-center gap-4 p-4 rounded-2xl border transition-all animate-[slideInLeft_0.3s_ease-out] ${
                i === 0 
                  ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/20' 
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-300'
              }`}
            >
              <div className="shrink-0">
                <BingoBall number={q.num} size="sm" color={i === 0 ? '#818cf8' : '#3f3f46'} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold uppercase opacity-50 mb-1">Entry #{q.num}</div>
                <div className="text-lg font-black truncate" dangerouslySetInnerHTML={{ __html: state.showBackFirst ? (q.back || q.front) : q.front }} />
              </div>
            </div>
          ))}
          {drawn.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-zinc-700 space-y-4 px-6 text-center">
              <div className="w-16 h-16 border-4 border-dashed border-zinc-800 rounded-full flex items-center justify-center text-2xl font-black">?</div>
              <div className="text-xs font-black uppercase tracking-widest">Awaiting first call...</div>
            </div>
          )}
        </div>
      </div>

      {/* 2. RIGHT 2/3: The Bingo Air-Machine container */}
      <div className="w-2/3 flex flex-col gap-4 h-full min-h-0">
        <div className="flex-1 bg-zinc-900/10 border border-white/5 rounded-[2.5rem] p-8 text-center shadow-2xl relative overflow-hidden flex flex-col items-center justify-center min-h-0">
          {/* Machine Header */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 text-[10px] text-zinc-600 font-black uppercase tracking-[0.4em] font-mono whitespace-nowrap">
            Pneumatic Bingo Dispatcher
          </div>

          {/* Air Tube Visualization */}
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 w-full flex-1 min-h-0">
            
            {/* Left side: The Pneumatic Snowglobe Machine */}
            <div className="flex flex-col items-center shrink-0 relative">
              {/* Snowglobe Sphere */}
              <div className="w-64 h-64 lg:w-72 lg:h-72 rounded-full border-4 border-white/10 bg-white/5 backdrop-blur-md relative overflow-hidden flex items-center justify-center shadow-[inset_0_0_40px_rgba(255,255,255,0.1),0_20px_40px_rgba(0,0,0,0.5)] group">
                {/* Glass reflections */}
                <div className="absolute top-[10%] left-[20%] w-[40%] h-[30%] bg-gradient-to-b from-white/20 to-transparent rounded-full blur-md pointer-events-none" />
                <div className="absolute bottom-[5%] right-[15%] w-[20%] h-[20%] bg-white/5 rounded-full blur-sm pointer-events-none" />
                
                <div className={`absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.1),transparent)] ${isStirring ? 'animate-pulse' : ''}`} />
                
                {/* "Snowglobe" balls - Representing remaining entries */}
                <div className="absolute inset-4 overflow-hidden rounded-full">
                  {available.slice(0, 30).map((_, i) => (
                    <div 
                      key={i} 
                      className={`absolute w-4 h-4 lg:w-5 lg:h-5 rounded-full shadow-lg ${isStirring ? 'animate-float' : ''}`}
                      style={{ 
                        background: `radial-gradient(circle at 35% 35%, #ffffff 0%, #f4f4f5 40%, #d1d5db 100%)`,
                        animationDelay: `${i * 0.1 + Math.random() * 0.5}s`, 
                        top: `${20 + Math.random() * 60}%`, 
                        left: `${20 + Math.random() * 60}%`,
                        opacity: 0.9,
                        transform: `scale(${0.5 + Math.random() * 0.5})`
                      }}
                    />
                  ))}
                  {available.length > 30 && (
                     <div className="absolute bottom-8 left-0 right-0 text-center text-[10px] font-black text-white/20 uppercase tracking-widest">
                       + {available.length - 30} more
                     </div>
                  )}
                </div>
              </div>
              
              {/* Air Tube Exit */}
              <div className="absolute -bottom-4 w-16 h-16 bg-zinc-800 rounded-b-full flex items-center justify-center">
                <div className="w-10 h-10 bg-zinc-950 rounded-full border border-zinc-700" />
              </div>

              {/* Machine Base */}
              <div className="w-64 h-20 bg-gradient-to-b from-zinc-800 to-zinc-950 border-x-2 border-b-2 border-zinc-700 rounded-b-[2rem] shadow-xl relative -mt-10 flex items-center justify-center">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-indigo-500/30 rounded-full blur-[1px]" />
                <div className="text-zinc-600 text-[9px] font-black uppercase tracking-widest mt-8">PNEUMATIC SYSTEM</div>
              </div>
            </div>

            {/* Air Tube Visual connecting to presentation */}
            <div className="relative w-16 h-48 lg:h-64 flex items-center justify-center">
              <div className="absolute w-4 h-full bg-white/5 rounded-full border border-white/10 shadow-inner" />
              {isAnimating && (
                <div className="absolute w-10 h-10 rounded-full bg-white/20 animate-[airFlow_1s_infinite_linear]" />
              )}
              {isAnimating && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 animate-[ballTravel_1.5s_ease-in-out_forwards] z-20">
                  <BingoBall number={animNumber} size="lg" isShuffling />
                </div>
              )}
            </div>

            {/* Presentation Area */}
            <div className="flex flex-col items-center gap-6 flex-1 min-w-0">
              {isAnimating ? (
                <div className="text-zinc-800 text-3xl font-black uppercase tracking-[0.2em] italic animate-pulse">
                  Identifying...
                </div>
              ) : current ? (
                <div className="flex flex-col items-center gap-6 animate-[scaleUp_0.4s_forwards] w-full">
                  <BingoBall number={current.num} size="xl" />
                  <div className="space-y-2">
                    <div className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">Entry Identified</div>
                    <div 
                      className="text-white text-4xl md:text-7xl lg:text-8xl font-black drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)] leading-tight break-words px-2"
                      dangerouslySetInnerHTML={{ __html: showPrompt }}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-zinc-800 text-3xl font-black uppercase tracking-[0.2em] italic animate-pulse">
                  System Ready
                </div>
              )}
            </div>
          </div>

          <div className="absolute bottom-6 right-8">
             <span className="text-[11px] text-zinc-600 font-mono font-black border border-zinc-900 px-3 py-1.5 rounded-full bg-black/20">
               REMAINING: {available.length} / { (state.activeLesson?.questions.length || 0) }
             </span>
          </div>
        </div>

        {/* Bottom Control Area container - Rigid height to stop pushing */}
        <div className="flex justify-end shrink-0">
          <button
            onClick={drawNext}
            className="px-16 py-5 bg-emerald-650 hover:bg-emerald-550 text-white rounded-2xl font-black text-xl tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-4 disabled:opacity-20 disabled:grayscale cursor-pointer uppercase whitespace-nowrap"
          >
            {available.length === 0 ? "Bingo Set Complete" : "🎲 Draw Next Ball"}
          </button>
        </div>
      </div>

    </div>
  );
};