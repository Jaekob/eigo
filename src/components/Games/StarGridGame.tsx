import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { useEffects } from '../EffectsOverlay';
import { audioService } from '../../services/audioService';

interface GridCell {
  id: number;
  rowName: number; // 1-6
  colName: string; // A-F
  type: 'points' | 'assist' | 'swap';
  value: number;
  icon: string;
  revealed: boolean;
  pickedBy: number | null;
}

const GRID_SIZE = 6;
const REVEAL_DELAY_MS = 1800;

export const StarGridGame: React.FC<{ onTurnEnd: () => void }> = ({ onTurnEnd }) => {
  const { state, addScore, swapScores, startRound } = useGame();
  const { floatText, particles } = useEffects();

  const [board, setBoard] = useState<GridCell[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [lastOutcome, setLastOutcome] = useState<string | null>(null);

  const storageKey = `apollo_star_grid_board_${state.teams.map(t => t.name).join('_')}`;

  // Generate shuffled board once per lifetime
  const generateBoard = (): GridCell[] => {
    const totalCells = GRID_SIZE * GRID_SIZE; // 36
    const pool: Omit<GridCell, 'id' | 'rowName' | 'colName' | 'revealed' | 'pickedBy'>[] = [];

    const distribution = [
      { type: 'points', value: 5, icon: '⭐', pct: 0.50 },
      { type: 'points', value: 10, icon: '🌟', pct: 0.22 },
      { type: 'assist', value: 10, icon: '🚀', pct: 0.11 }, // +10 to last place
      { type: 'swap', value: 0, icon: '🛸', pct: 0.08 },
      { type: 'points', value: 20, icon: '💎', pct: 0.09 }
    ];

    distribution.forEach(d => {
      const count = Math.floor(totalCells * d.pct);
      for (let i = 0; i < count; i++) {
        pool.push({ type: d.type as any, value: d.value, icon: d.icon });
      }
    });

    // Fill any rounding gaps
    while (pool.length < totalCells) {
      pool.push({ type: 'points', value: 5, icon: '⭐' });
    }

    // Shuffle pool
    const shuffled = [...pool].sort(() => Math.random() - 0.5);

    return shuffled.map((cell, idx) => {
      const r = Math.floor(idx / GRID_SIZE) + 1;
      const c = String.fromCharCode(65 + (idx % GRID_SIZE)); // A-F
      return {
        id: idx,
        rowName: r,
        colName: c,
        type: cell.type,
        value: cell.value,
        icon: cell.icon,
        revealed: false,
        pickedBy: null
      };
    });
  };

  useEffect(() => {
    startRound();
    let loaded = false;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setBoard(JSON.parse(stored));
        loaded = true;
      }
    } catch (e) {
      console.error('Failed to load star grid board', e);
    }

    if (!loaded && board.length === 0) {
      const newBoard = generateBoard();
      setBoard(newBoard);
      localStorage.setItem(storageKey, JSON.stringify(newBoard));
    }
    setIsLocked(false);
  }, [state.activeIndex]);

  const handleCellPick = (cell: GridCell, e: React.MouseEvent) => {
    if (isLocked || cell.revealed) return;

    setIsLocked(true);
    setLastOutcome(null);

    // Trigger visual particles
    particles(e.currentTarget as HTMLElement, '#f1c40f', 12);
    audioService.sounds.tick();

    const activeTeam = state.teams[state.activeIndex];

    // Reveal cell
    const updatedBoard = board.map(item =>
      item.id === cell.id 
        ? { ...item, revealed: true, pickedBy: activeTeam.index } 
        : item
    );
    setBoard(updatedBoard);
    localStorage.setItem(storageKey, JSON.stringify(updatedBoard));

    // Resolve grid cell rewards
    setTimeout(() => {
      resolveCellResult(cell, updatedBoard);
    }, 600);
  };

  const resolveCellResult = (cell: GridCell, currentBoard: GridCell[]) => {
    const activeTeam = state.teams[state.activeIndex];
    const coordinateLabel = `${cell.colName}${cell.rowName}`;

    if (cell.type === 'points') {
      addScore(activeTeam.index, cell.value);
      audioService.sounds.point(cell.value);
      floatText(`+${cell.value} PTS!`, '#2ecc71');
      setLastOutcome(`${activeTeam.name} scanned ${coordinateLabel}: Found +${cell.value} Points ${cell.icon}`);

    } else if (cell.type === 'assist') {
      // Find trailing last-place team (excluding active index if there are other candidates)
      const sorted = [...state.teams].sort((a, b) => a.score - b.score);
      const trailingTeam = sorted.find(t => t.index !== activeTeam.index) || sorted[0];

      addScore(trailingTeam.index, 10);
      audioService.sounds.rare();
      floatText(`🚀 ASSIST: ${trailingTeam.name} +10`, '#3498db');
      setLastOutcome(`${activeTeam.name} scanned ${coordinateLabel}: +10 Assist to ${trailingTeam.name} 🚀`);

    } else if (cell.type === 'swap') {
      // Swap with a random opponent team index
      const opponents = state.teams.filter(t => t.index !== activeTeam.index);
      if (opponents.length > 0) {
        const target = opponents[Math.floor(Math.random() * opponents.length)];
        swapScores(activeTeam.index, target.index);
        audioService.sounds.rare();
        floatText(`🛸 SWAP WITH ${target.name}!`, '#9b59b6');
        setLastOutcome(`${activeTeam.name} scanned ${coordinateLabel}: Score Swapped with ${target.name} 🛸`);
      } else {
        addScore(activeTeam.index, 5);
        setLastOutcome(`${activeTeam.name} scanned ${coordinateLabel}: Found +5 Points 🛸`);
      }
    }

    // Auto-wipe/reset board if completely scanned
    const allRevealed = currentBoard.every(c => c.revealed);

    setTimeout(() => {
      if (allRevealed) {
        const newBoard = generateBoard();
        setBoard(newBoard);
        localStorage.setItem(storageKey, JSON.stringify(newBoard));
      }
      onTurnEnd();
    }, REVEAL_DELAY_MS);
  };

  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div className="flex flex-col xl:flex-row items-center justify-center gap-12 xl:gap-20 p-4 w-full h-full select-none animate-[fadeIn_0.5s_forwards]">
      
      {/* 1. Grid matrix board */}
      <div className="bg-zinc-950/40 border border-zinc-900 rounded-[2.5rem] p-8 shadow-2xl relative scale-100 xl:scale-110">
        <div className="grid grid-cols-[50px_repeat(6,_minmax(70px,_90px))] gap-3 items-center text-center">
          
          {/* Header Row (Empty corner + letters) */}
          <div className="h-10 flex items-center justify-center" />
          {letters.map(char => (
            <div key={char} className="font-['Outfit'] text-sm font-black text-indigo-400 tracking-widest uppercase">
              {char}
            </div>
          ))}

          {/* Grid Content */}
          {Array.from({ length: GRID_SIZE }).map((_, rIdx) => {
            const rowNum = rIdx + 1;
            return (
              <React.Fragment key={rowNum}>
                {/* Row Header (Number) */}
                <div className="font-['Outfit'] text-sm font-black text-indigo-400 tracking-widest flex items-center justify-center">
                  {rowNum}
                </div>

                {/* Columns */}
                {Array.from({ length: GRID_SIZE }).map((_, cIdx) => {
                  const colChar = String.fromCharCode(65 + cIdx);
                  const cell = board.find(item => item.rowName === rowNum && item.colName === colChar);
                  if (!cell) return <div key={colChar} />;

                  const pickerColor = cell.revealed && cell.pickedBy !== null
                    ? state.teams[cell.pickedBy]?.color
                    : 'transparent';

                  return (
                    <button
                      key={colChar}
                      disabled={isLocked || cell.revealed}
                      onClick={(e) => handleCellPick(cell, e)}
                      style={{
                        borderColor: cell.revealed ? pickerColor : 'rgba(99,102,241,0.2)'
                      }}
                      className={`aspect-square w-full rounded-2xl border-2 border-dashed flex items-center justify-center text-5xl transition-all duration-200 cursor-pointer ${
                        cell.revealed 
                          ? 'bg-zinc-950 shadow-inner' 
                          : 'bg-zinc-900/60 hover:bg-zinc-800/60 hover:scale-105 active:scale-95 shadow-lg'
                      }`}
                    >
                      {cell.revealed ? (
                        <span className="scale-110 filter drop-shadow-[0_0_12px_rgba(255,255,255,0.8)] animate-[wave_0.4s_ease-out]">
                          {cell.icon}
                        </span> // Corrected icon rendering
                      ) : (
                        <span className="text-zinc-600 text-xs font-semibold hover:text-indigo-400 font-mono tracking-widest leading-none">
                          ✨
                        </span>
                      )}
                    </button>
                  );
                })}
              </React.Fragment>
            );
          })}

        </div>
      </div>

      {/* 2. Side Legend panel */}
      <div className="w-full max-w-md space-y-6">
        <div className="bg-zinc-950/80 border border-zinc-850 rounded-3xl p-6 shadow-inner">
          <h3 className="text-[10px] font-black text-zinc-500 text-center uppercase tracking-[0.3em] border-b border-zinc-900 pb-4 mb-5">
            SCAN SYMBOLOGY
          </h3>
          <div className="space-y-5 text-sm text-zinc-300">
            <div className="flex items-center gap-3">
              <span className="text-2xl w-8 text-center filter drop-shadow-[0_0_5px_rgba(234,179,8,0.3)]">⭐</span>
              <div className="flex-1">
                <div className="font-black text-zinc-100 uppercase tracking-tight">+5 Points</div>
                <div className="text-[11px] text-zinc-500 font-medium">Standard star discovery.</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl w-8 text-center filter drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]">🌟</span>
              <div className="flex-1">
                <div className="font-black text-zinc-100 uppercase tracking-tight">+10 Points</div>
                <div className="text-[11px] text-zinc-500 font-medium">High-energy star chime.</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl w-8 text-center filter drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]">💎</span>
              <div className="flex-1">
                <div className="font-black text-zinc-100 uppercase tracking-tight">+20 Points</div>
                <div className="text-[11px] text-zinc-500 font-medium">Rare cosmic gem deposit.</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl w-8 text-center filter drop-shadow-[0_0_5px_rgba(52,152,219,0.5)]">🚀</span>
              <div className="flex-1">
                <div className="font-black text-zinc-100 uppercase tracking-tight">+10 Assist</div>
                <div className="text-[11px] text-zinc-500 font-medium">Gives +10 points to last place.</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl w-8 text-center filter drop-shadow-[0_0_5px_rgba(139,92,246,0.5)]">🛸</span>
              <div className="flex-1">
                <div className="font-black text-zinc-100 uppercase tracking-tight Score Swap">Score Swap</div>
                <div className="text-[11px] text-zinc-500 font-medium">Randomly swap scores with an opponent.</div>
              </div>
            </div>
          </div>
        </div>

        {lastOutcome && (
          <div className="p-5 bg-zinc-900/60 border border-zinc-850 rounded-2xl text-center text-xs font-bold text-indigo-300 border-l-4 border-l-yellow-500 uppercase tracking-widest leading-relaxed">
            {lastOutcome}
          </div>
        )}
      </div>

    </div>
  );
};
export default StarGridGame;
