import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { useEffects } from '../EffectsOverlay';
import { audioService } from '../../services/audioService';
import { ArrowRight, Sparkles } from 'lucide-react';

interface GalaxyRaceGameProps {
  onTurnEnd: () => void;
}

const BOARD_FINISH = 10;

export const GalaxyRaceGame: React.FC<GalaxyRaceGameProps> = ({ onTurnEnd }) => {
  const { state, addScore, endGame, startRound } = useGame();
  const { floatText, particlesAt, startConfetti, stopConfetti } = useEffects();

  // Positions: teamIndex -> space (0 to 10)
  const [positions, setPositions] = useState<{ [teamIndex: number]: number }>({});
  
  // Turn states
  const [isRolling, setIsRolling] = useState(false);
  const [rolledNumber, setRolledNumber] = useState<number | null>(null);
  const [turnCompleted, setTurnCompleted] = useState(false);
  const [raceWinner, setRaceWinner] = useState<number | null>(null);
  const [eventMessage, setEventMessage] = useState<string | null>(null);

  const activeTeam = state.teams[state.activeIndex];
  const storageKey = `apollo_galaxy_race_pos_${state.teams.map(t => t.name).join('_')}`;

  // Initialize and load positions
  useEffect(() => {
    startRound();
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setPositions(JSON.parse(stored));
      } else {
        const initial: { [key: number]: number } = {};
        state.teams.forEach(t => {
          initial[t.index] = 0;
        });
        setPositions(initial);
        localStorage.setItem(storageKey, JSON.stringify(initial));
      }
    } catch (e) {
      console.error('Failed to parse galaxy race positions', e);
    }
  }, [state.teams]);

  const savePositions = (newPos: { [teamIndex: number]: number }) => {
    setPositions(newPos);
    localStorage.setItem(storageKey, JSON.stringify(newPos));
  };

  const handleRoll = () => {
    if (isRolling || turnCompleted || raceWinner !== null) return;

    setIsRolling(true);
    setEventMessage(null);
    audioService.sounds.navHover();

    // Fast numbers cycle animation
    let ticks = 0;
    const interval = setInterval(() => {
      setRolledNumber(1 + Math.floor(Math.random() * 3)); // roll 1, 2, or 3
      audioService.play({ freq: 600 + Math.random() * 200, type: 'sine', dur: 0.05, vol: 0.05 });
      ticks++;
      if (ticks > 12) {
        clearInterval(interval);
        
        // Final Roll Result
        const roll = 1 + Math.floor(Math.random() * 3);
        setRolledNumber(roll);
        setIsRolling(false);
        
        setTimeout(() => {
          resolveMovement(roll);
        }, 400);
      }
    }, 80);
  };

  const resolveMovement = (steps: number) => {
    const currentPos = positions[activeTeam.index] || 0;
    let targetPos = Math.min(BOARD_FINISH, currentPos + steps);
    
    floatText(`MOVED +${steps}!`, activeTeam.color);
    audioService.sounds.navSelect();

    // Step-by-step update for smooth visual tracking
    let stepCount = 0;
    const stepInterval = setInterval(() => {
      stepCount++;
      const nextPos = Math.min(BOARD_FINISH, currentPos + stepCount);
      
      const updated = { ...positions, [activeTeam.index]: nextPos };
      savePositions(updated);

      if (nextPos === BOARD_FINISH || stepCount === steps) {
        clearInterval(stepInterval);
        
        // Check Landing Tile Events
        setTimeout(() => {
          checkLandingEvent(nextPos, updated);
        }, 300);
      }
    }, 200);
  };

  const checkLandingEvent = (landedPos: number, currentPosMap: { [teamIndex: number]: number }) => {
    const updated = { ...currentPosMap };
    
    // Space 3: Wormhole (Warp +1)
    if (landedPos === 3) {
      updated[activeTeam.index] = 4;
      savePositions(updated);
      audioService.sounds.rare();
      setEventMessage('🌀 WORMHOLE! Teleported +1 space forward!'); // Corrected message
      floatText('WARP! +1', '#3498db');
      particlesAt(window.innerWidth / 2, window.innerHeight / 2, '#3498db', 15);
    } 
    // Space 5: Asteroid Field (Slow -1)
    else if (landedPos === 5) {
      updated[activeTeam.index] = 4;
      savePositions(updated);
      audioService.sounds.wrong();
      setEventMessage('☄️ ASTEROID COLLISION! Knocked back -1 space!');
      floatText('BOOM! -1', '#ef4444');
    }
    // Space 7: Supernova Swap (Swap with closest team in front)
    else if (landedPos === 7) {
      // Find team in front
      const activePos = landedPos;
      let targetTeamIdx: number | null = null;
      let closestPos = 99;

      state.teams.forEach(t => {
        if (t.index !== activeTeam.index) {
          const tPos = currentPosMap[t.index] || 0;
          if (tPos > activePos && tPos < closestPos) {
            closestPos = tPos;
            targetTeamIdx = t.index;
          }
        }
      });

      if (targetTeamIdx !== null) {
        const otherTeamName = state.teams[targetTeamIdx].name;
        // Swap positions
        updated[activeTeam.index] = closestPos;
        updated[targetTeamIdx] = activePos;
        savePositions(updated);
        
        audioService.sounds.rare();
        setEventMessage(`🌌 SUPERNOVA SWAP! Swapped positions with ${otherTeamName}!`);
        floatText('WARP SWAP!', '#9b59b6');
        particlesAt(window.innerWidth / 2, window.innerHeight / 2, '#9b59b6', 20);
      } else {
        // No one in front, give a small boost
        updated[activeTeam.index] = Math.min(BOARD_FINISH, activePos + 1);
        savePositions(updated);
        setEventMessage('🌌 Supernova boost! Moved +1 forward!');
        floatText('BOOST! +1', '#9b59b6');
      }
    }
    // Space 9: Star Station (+10 points)
    else if (landedPos === 9) {
      addScore(activeTeam.index, 10);
      audioService.sounds.point(10);
      setEventMessage('🛰️ STAR STATION! Discovered energy cells (+10 points)!');
      floatText('+10 PTS!', '#2ecc71');
    }

    // Check Victory Condition
    const finalPos = updated[activeTeam.index] || 0;
    if (finalPos >= BOARD_FINISH) {
      setRaceWinner(activeTeam.index);
      addScore(activeTeam.index, 30); // winner gets 30 bonus points
      localStorage.removeItem(storageKey); // clear race
      
      startConfetti();
      audioService.sounds.victory();
      setEventMessage(`🏆 ${activeTeam.name} HAS WON THE GALAXY RACE! (+30 points)`);
    }

    setTurnCompleted(true);
  };

  const handleNextTurn = () => {
    if (raceWinner !== null) {
      stopConfetti();
      endGame(); // Ends the entire session since someone won the race!
    } else {
      onTurnEnd();
    }
  };

  return (
    <div className="flex flex-col xl:flex-row items-center justify-center gap-8 p-4 w-full h-full select-none animate-[fadeIn_0.5s_forwards]">
      
      {/* 1. Race track dashboard */}
      <div className="flex-1 bg-zinc-950/40 border border-zinc-900 rounded-[2rem] p-6 shadow-2xl w-full max-w-4xl">
        <h3 className="text-sm font-extrabold text-indigo-400 uppercase tracking-widest border-b border-zinc-900 pb-3 mb-6 flex justify-between items-center">
          <span>Galaxy Race Lanes</span>
          <span className="text-[10px] text-zinc-500 font-mono font-normal">First to Space 10 wins!</span>
        </h3>

        {/* Lanes List */}
        <div className="space-y-5">
          {state.teams.map((team) => {
            const pos = positions[team.index] || 0;
            const isActive = team.index === activeTeam.index;

            return (
              <div 
                key={team.index} 
                className={`relative p-3 border rounded-2xl flex flex-col gap-2.5 transition-all duration-200 ${
                  isActive 
                    ? 'border-indigo-500/40 bg-indigo-950/10 shadow-md shadow-indigo-500/2'
                    : 'border-zinc-900/60 bg-zinc-950/20'
                }`}
              >
                {/* Lane Info */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black" style={{ color: team.color }}>
                    {team.name} {isActive && '🚀 (Active)'}
                  </span>
                  <span className="font-mono text-zinc-500">
                    Space {pos} / {BOARD_FINISH}
                  </span>
                </div>

                {/* Grid Track */}
                <div className="grid grid-cols-11 gap-1.5 h-12 items-center bg-zinc-950/50 p-1.5 border border-zinc-900 rounded-xl relative overflow-hidden">
                  
                  {/* Outer lanes indicators */}
                  {Array.from({ length: BOARD_FINISH + 1 }).map((_, spaceIdx) => {
                    const hasRocket = pos === spaceIdx;
                    
                    // Special blocks
                    const isWormhole = spaceIdx === 3;
                    const isAsteroid = spaceIdx === 5;
                    const isSwap = spaceIdx === 7;
                    const isStation = spaceIdx === 9;
                    const isFinish = spaceIdx === 10;

                    let blockClass = 'border-zinc-900 bg-zinc-900/10';
                    let icon = '';
                    if (isWormhole) { blockClass = 'border-blue-900/40 bg-blue-950/10 text-blue-400'; icon = '🌀'; }
                    else if (isAsteroid) { blockClass = 'border-red-900/40 bg-red-950/10 text-red-500'; icon = '☄️'; }
                    else if (isSwap) { blockClass = 'border-purple-900/40 bg-purple-950/10 text-purple-400'; icon = '🌌'; }
                    else if (isFinish) { blockClass = 'border-yellow-900/40 bg-yellow-950/10 text-yellow-500'; icon = '🏁'; }
                    else if (isStation) { blockClass = 'border-emerald-900/40 bg-emerald-950/10 text-emerald-400'; icon = '🛰️'; }

                    return (
                      <div 
                        key={spaceIdx} 
                        className={`h-full rounded-lg border flex items-center justify-center relative transition-all ${blockClass}`}
                      >
                        {hasRocket ? (
                          <span 
                            className="text-2xl filter drop-shadow-[0_0_8px_currentColor] animate-bounce z-10"
                            style={{ color: team.color }}
                          >
                            🚀
                          </span>
                        ) : (
                          <span className="text-xs opacity-40 select-none font-mono">
                            {icon || spaceIdx}
                          </span>
                        )}
                      </div>
                    );
                  })}

                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Roll Controller Panel */}
      <div className="w-full max-w-xs flex flex-col justify-between self-stretch gap-6">
        
        {/* Die view */}
        <div className="bg-zinc-950/80 border border-zinc-850 rounded-[2rem] p-6 shadow-inner flex-1 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-widest font-mono mb-6">
            Astral Travel Spinner
          </span>

          <div className="w-24 h-24 bg-gradient-to-br from-indigo-650 to-purple-650 rounded-3xl border border-indigo-500 flex items-center justify-center text-white text-5xl font-black font-mono shadow-2xl relative animate-pulse">
            {rolledNumber !== null ? rolledNumber : '?'}
            {isRolling && <span className="absolute inset-0 bg-white/10 rounded-3xl animate-ping" />}
          </div>

          <div className="mt-6 text-zinc-400 text-xs font-semibold">
            {isRolling ? 'SPINNING...' : 'Roll die to advance 1, 2, or 3 spaces!'}
          </div>
        </div>

        {/* Console outputs */}
        {eventMessage && (
          <div className="p-4 bg-zinc-900/50 border border-zinc-850 rounded-xl text-center text-xs font-bold text-indigo-300 border-l-4 border-l-yellow-500 uppercase tracking-wide leading-normal">
            {eventMessage}
          </div>
        )}

        {/* Buttons triggers */}
        <div className="flex flex-col gap-3">
          {!turnCompleted ? (
            <button
              onClick={handleRoll}
              disabled={isRolling || raceWinner !== null}
              className="w-full py-4 bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 text-white rounded-2xl font-black text-md tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98 transition-all uppercase"
            >
              🎲 Roll space die
            </button>
          ) : (
            <button
              onClick={handleNextTurn}
              className="w-full py-4 bg-indigo-650 hover:bg-indigo-600 text-white border border-indigo-500 rounded-2xl font-black text-md tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98 transition-all uppercase"
            >
              {raceWinner !== null ? '🏁 END SESSION' : 'NEXT TEAM TURN ➔'}
            </button>
          )}
        </div>

      </div>

    </div>
  );
};
export default GalaxyRaceGame;
