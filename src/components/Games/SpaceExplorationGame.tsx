import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { useEffects } from '../EffectsOverlay';
import { audioService } from '../../services/audioService';

interface ZoneReward {
  icon: string;
  value: number;
  label: string;
}

const REWARD_POOL: ZoneReward[] = [
  { icon: '⭐', value: 10, label: 'Credits' },
  { icon: '🌟', value: 20, label: 'Rare Crystals' },
  { icon: '🪐', value: 40, label: 'Planet Core' },
  { icon: '🛰️', value: 25, label: 'Space Satellite' },
  { icon: '🌌', value: 35, label: 'Gaseous Nebula' }
];

const WRONG_ANS_MULTIPLIER = 0.5;

export const SpaceExplorationGame: React.FC<{ onTurnEnd: () => void }> = ({ onTurnEnd }) => {
  const { state, addScore, startRound } = useGame();
  const { floatText } = useEffects();

  // Setup round states
  const [zoneRewards, setZoneRewards] = useState<ZoneReward[]>([]);
  
  // Mapping team index -> { zoneIndex: number, correct: boolean }
  const [picks, setPicks] = useState<{ [teamIdx: number]: { zoneIdx: number; correct: boolean } }>({});
  
  const [selectingIdx, setSelectingIdx] = useState<number>(0);
  const [revealed, setRevealed] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // Initialize round
  const startNewRound = () => {
    // Pick 3 unique rewards for the 3 sectors
    const shuffled = [...REWARD_POOL].sort(() => Math.random() - 0.5);
    setZoneRewards(shuffled.slice(0, 3));
    setPicks({});
    setSelectingIdx(0);
    setRevealed(false);
    setIsLocked(false);
  };

  useEffect(() => {
    startRound();
    // Restart round selection from zero on active phase entry
    if (Object.keys(picks).length === 0) {
      startNewRound();
    }
  }, [state.activeGameId]);

  const handleZoneSelect = (zoneIdx: number) => {
    if (revealed || isLocked) return;

    // Register active team pick
    const activeTeamToPick = state.teams[selectingIdx];
    const gotCorrect = selectingIdx === state.activeIndex 
      ? state.lastQuestionCorrect 
      : state.teams[selectingIdx].score > 0 || Math.random() > 0.3; // opposing team mock or historical

    const updatedPicks = { ...picks, [selectingIdx]: { zoneIdx, correct: gotCorrect } };
    setPicks(updatedPicks);

    audioService.sounds.tick();
    floatText(`${activeTeamToPick.name} Locked! 🌌`, activeTeamToPick.color);

    const isAllPicked = Object.keys(updatedPicks).length === state.teams.length;
    
    if (!isAllPicked) {
      // Transition to next team picker
      setSelectingIdx(prev => prev + 1);
    } else {
      // Finished private picking block
      setIsLocked(true);
    }
  };

  const handleReveal = () => {
    setRevealed(true);
    audioService.sounds.rare();

    // Reward points for all picks
    state.teams.forEach((t) => {
      const p = picks[t.index];
      if (!p) return;

      const reward = zoneRewards[p.zoneIdx];
      if (!reward) return;

      const baseValue = reward.value;
      const finalAward = p.correct ? baseValue : Math.floor(baseValue * WRONG_ANS_MULTIPLIER);
      addScore(t.index, finalAward);
    });
  };

  const handleFinishRound = () => {
    startNewRound();
    onTurnEnd();
  };

  const allPicked = Object.keys(picks).length === state.teams.length;
  const currentTeamSelecting = state.teams[selectingIdx];

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full h-full select-none animate-[fadeIn_0.5s_forwards]">
      
      {/* 1. Header prompts */}
      <div className="text-center mb-10 max-w-lg">
        <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-indigo-400 tracking-tight mb-2">
          Deep Space Exploration
        </h2>
        {!revealed ? (
          <div>
            {!allPicked ? (
              <div className="p-3 bg-zinc-900 border border-zinc-850 rounded-2xl animate-[fadeIn_0.4s_forwards]">
                <p className="text-zinc-400 text-sm">Pass device to team members for private dockings!</p>
                <div 
                  className="text-xl font-black mt-2 uppercase tracking-wider" 
                  style={{ color: currentTeamSelecting?.color }}
                >
                  📡 {currentTeamSelecting?.name}: Select Zone
                </div>
              </div>
            ) : (
              <div className="p-3 bg-teal-950/20 border border-teal-900 text-teal-300 rounded-2xl animate-[pulse_1.5s_infinite]">
                <p className="text-lg font-bold">All Starships Docked Successfully!</p>
                <p className="text-xs text-teal-400/80 mt-1">Ready to initiate mission telemetry scan.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 bg-emerald-950/20 border border-emerald-900 text-emerald-300 rounded-2xl">
            <h4 className="text-lg font-bold">Scan Results Deployed!</h4>
            <p className="text-xs text-zinc-500">Points applied across team databases.</p>
          </div>
        )}
      </div>

      {/* 2. Visual Exploration Zones map */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mb-10">
        {[0, 1, 2].map((zIdx) => {
          const zoneKey = String.fromCharCode(65 + zIdx); // A, B, C
          const reward = zoneRewards[zIdx];

          // Count or map docked spaceships in this zone
          const dockedShips = Object.entries(picks)
            .filter(([_, p]) => (p as any).zoneIdx === zIdx)
            .map(([tIdx, p]) => {
              const team = state.teams[parseInt(tIdx)];
              const pts = reward ? ((p as any).correct ? reward.value : Math.floor(reward.value * WRONG_ANS_MULTIPLIER)) : 0;
              return { team, pts };
            });

          return (
            <div
              key={zIdx}
              onClick={() => !allPicked && handleZoneSelect(zIdx)}
              className={`border-2 rounded-[2rem] p-6 text-center transition-all min-h-[280px] flex flex-col justify-between items-center ${
                allPicked
                  ? 'border-indigo-900 bg-zinc-950/20 cursor-default'
                  : 'border-zinc-800 bg-zinc-900/10 hover:bg-zinc-900/30 hover:border-zinc-700 cursor-pointer active:scale-95'
              }`}
            >
              <h3 className="text-2xl font-black text-indigo-400 font-['Outfit']">
                SECTOR {zoneKey}
              </h3>

              {/* Reward Icon reveals once calculated */}
              <div className="text-6xl my-4 text-center filter drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
                {revealed && reward ? (
                  <div className="animate-[scaleUp_0.4s_forwards]">
                    <div>{reward.icon}</div>
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-2">{reward.label}</div>
                  </div> // Corrected reward display
                ) : (
                  <span className="text-zinc-800">❔</span>
                )}
              </div>

              {/* Space docking tokens */}
              <div className="flex flex-wrap gap-2 justify-center max-w-full">
                {dockedShips.map(({ team, pts }) => {
                  const showScore = revealed;
                  return (
                    <div
                      key={team.index}
                      className="flex flex-col items-center animate-[floatFade_1s_forwards]"
                      style={{ color: team.color }}
                    >
                      <span className="text-3xl filter drop-shadow-[0_0_8px_currentColor]">🚀</span>
                      <span className="text-[10px] font-black uppercase tracking-tight mt-1 truncate max-w-[80px]">
                        {team.name}
                      </span>
                      {showScore && (
                        <span className="text-xs bg-zinc-950 font-bold px-1.5 py-0.5 rounded border border-zinc-850 mt-1 text-white">
                          +{pts}
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

      {/* 3. Global Control rows */}
      <div className="flex items-center justify-center gap-4">
        {allPicked && !revealed && (
          <button
            onClick={handleReveal}
            className="px-10 py-4 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-xl text-lg font-bold shadow-lg hover:scale-105 active:scale-95 cursor-pointer transition-all uppercase tracking-wider"
          >
            🔥 REVEAL ADVENTURE DATA
          </button>
        )}

        {revealed && (
          <button
            onClick={handleFinishRound}
            className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-lg font-bold shadow-lg hover:scale-105 active:scale-95 cursor-pointer transition-all uppercase tracking-wider"
          >
            NEXT TURN ➔
          </button>
        )}
      </div>

    </div>
  );
};
export default SpaceExplorationGame;
