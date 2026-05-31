import React from 'react';
import { useGame } from '../../context/GameContext';
import { RouletteBaseGame } from './RouletteBaseGame';
import { RouletteRachelGame } from './RouletteRachelGame';
import { StarGridGame } from './StarGridGame';
import { SpaceExplorationGame } from './SpaceExplorationGame';
import { PachinkoGame } from './PachinkoGame';
import { GalaxyRaceGame } from './GalaxyRaceGame';
import { DebugGame } from './DebugGame';

interface GamesArenaProps {
  onTurnEnd: () => void;
}

export const GamesArena: React.FC<GamesArenaProps> = ({ onTurnEnd }) => {
  const { state } = useGame();

  if (state.isStudyMode || !state.activeGameId) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-zinc-950/20 border border-zinc-900 rounded-[2.5rem] w-full max-w-lg mt-8 self-center select-none animate-[fadeIn_0.5s_forwards]">
        <div className="text-5xl mb-4">📖</div>
        <h3 className="text-2xl font-black text-indigo-400 font-['Outfit'] mb-2">Pure Study Mode</h3>
        <p className="text-zinc-400 text-sm max-w-sm mb-6 leading-relaxed">
          You are currently in study mode. To explore scores and gaming modules, configure a live game in the setup menu.
        </p>
        <button
          onClick={onTurnEnd}
          className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-bold font-['Outfit'] uppercase tracking-widest cursor-pointer text-zinc-300"
        >
          NEXT CARD ➔
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center">
      {state.activeGameId === 'roulette-base' && <RouletteBaseGame onTurnEnd={onTurnEnd} />}
      {state.activeGameId === 'roulette-rachel' && <RouletteRachelGame onTurnEnd={onTurnEnd} />}
      {state.activeGameId === 'star-grid' && <StarGridGame onTurnEnd={onTurnEnd} />}
      {state.activeGameId === 'space-exploration' && <SpaceExplorationGame onTurnEnd={onTurnEnd} />}
      {state.activeGameId === 'pachinko' && <PachinkoGame onTurnEnd={onTurnEnd} />}
      {state.activeGameId === 'galaxy-race' && <GalaxyRaceGame onTurnEnd={onTurnEnd} />}
      {state.activeGameId === 'debug' && <DebugGame onTurnEnd={onTurnEnd} />}
    </div>
  );
};
export default GamesArena;
