import React, { useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { useEffects } from '../EffectsOverlay';
import { audioService } from '../../services/audioService';
import { Trophy, RefreshCcw, Medal, Hourglass, CircleUser } from 'lucide-react';

export const StandingsArena: React.FC = () => {
  const { state, resetGame } = useGame();
  const { startConfetti, stopConfetti } = useEffects();

  // Sorting rankings: descending score order
  const ranked = [...state.teams].sort((a, b) => b.score - a.score);
  const winner = ranked[0];
  const isTie = ranked.length > 1 && ranked[0].score === ranked[1].score;

  // Medals index
  const medals = ['🥇', '🥈', '🥉'];

  useEffect(() => {
    // Initiate celebratory visual waves and triumphal melodies
    startConfetti();
    audioService.sounds.victory();

    return () => {
      // Ceases confetti triggers on unmount
      stopConfetti();
    };
  }, []);

  const handlePlayAgain = () => {
    audioService.sounds.navSelect();
    resetGame();
  };

  if (!winner) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md w-full h-full min-h-screen z-50 overflow-y-auto p-6 flex items-center justify-center animate-[fadeIn_0.5s_forwards]">
      
      <div className="w-full max-w-[96vw] flex flex-col xl:flex-row gap-8 bg-zinc-900/20 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 shadow-2xl relative select-none animate-[scaleUp_0.4s_forwards]">
        
        {/* Row 1: Left standings list */}
        <div className="flex-1 bg-white/5 border border-white/10 p-8 rounded-[2rem] flex flex-col justify-between min-h-[600px] h-[75vh]">
          <div>
            <h3 className="text-zinc-500 font-extrabold text-lg uppercase tracking-widest mb-6 font-['Outfit'] border-b border-white/5 pb-4">
              Final Standings
            </h3>
            <div className="space-y-3 overflow-y-auto flex-1 pr-2 scrollbar-thin scrollbar-thumb-zinc-500 scrollbar-track-white/5">
              {ranked.map((team, idx) => (
                <div
                  key={team.index}
                  className={`flex items-center justify-between p-3.5 rounded-xl border border-zinc-900/40 relative ${
                    idx === 0 
                      ? 'bg-yellow-500/10 border-yellow-500/20' 
                      : 'bg-zinc-950/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl w-8 text-center">
                      {medals[idx] || `${idx + 1}`}
                    </span>
                    <span className="font-black text-xl" style={{ color: team.color }}>
                      {team.name}
                    </span>
                  </div>
                  <span className="font-mono font-black text-2xl text-zinc-100">
                    {team.score} pts
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[10px] text-zinc-600 font-mono tracking-wider text-center pt-4 border-t border-zinc-900/40">
            Standings compiled dynamically.
          </div>
        </div>

        {/* Row 2: Center Podium card */}
        <div className="flex-[1.5] bg-white/5 border border-white/10 p-10 rounded-[2rem] flex flex-col items-center justify-between text-center min-h-[600px] h-[75vh]">
          <div className="flex flex-col items-center mt-4">
            <div className="text-9xl filter drop-shadow-[0_0_30px_rgba(234,179,8,0.6)] animate-bounce mb-6">
              🏆
            </div>
            <h2 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 leading-none tracking-tighter drop-shadow-lg">
              {isTie ? 'GREAT DRAW TIE!' : `${winner.name} Wins!`}
            </h2>
            <p className="text-indigo-200/80 text-sm font-semibold tracking-wider block mt-2 uppercase">
              Game Completed
            </p>
          </div>

          {/* Graphical podium stand boxes */}
          <div className="flex items-end justify-center gap-4 w-full mt-12 mb-4 scale-95 md:scale-110 origin-bottom">
            
            {/* 2nd spot */}
            {ranked[1] ? (
              <div className="flex flex-col items-center flex-1">
                <span className="text-sm font-bold truncate max-w-[100px]" style={{ color: ranked[1].color }}>{ranked[1].name}</span>
                <span className="text-zinc-400 text-sm font-mono font-extrabold mt-1">{ranked[1].score}</span>
                <div className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-t-2xl h-40 mt-3 flex items-center justify-center text-4xl font-black text-zinc-600 shadow-md">
                  🥈
                </div>
              </div>
            ) : (
              <div className="flex-1 h-40" />
            )}

            {/* 1st spot */}
            <div className="flex flex-col items-center flex-1">
              <span className="text-lg font-black truncate max-w-[120px] filter drop-shadow-[0_0_8px_currentColor]" style={{ color: winner.color }}>{winner.name}</span>
              <span className="text-yellow-400 text-lg font-mono font-black mt-1">{winner.score}</span>
              <div className="w-full bg-yellow-500/10 border-2 border-yellow-500 rounded-t-2xl h-56 mt-3 flex items-center justify-center text-6xl font-black text-yellow-500 shadow-lg relative">
                🥇
                <span className="absolute -top-1 right-1 text-xs animate-ping">✨</span>
              </div>
            </div>

            {/* 3rd spot */}
            {ranked[2] ? (
              <div className="flex flex-col items-center flex-1">
                <span className="text-sm font-bold truncate max-w-[100px]" style={{ color: ranked[2].color }}>{ranked[2].name}</span>
                <span className="text-zinc-400 text-sm font-mono font-extrabold mt-1">{ranked[2].score}</span>
                <div className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-t-2xl h-28 mt-3 flex items-center justify-center text-3xl font-black text-amber-600 shadow-sm">
                  🥉
                </div>
              </div>
            ) : (
              <div className="flex-1 h-16" />
            )}

          </div>
        </div>

        {/* Row 3: Right Stats & CTA */}
        <div className="w-full xl:w-80 bg-white/5 border border-white/10 p-8 rounded-[2rem] flex flex-col justify-between min-h-[600px] h-[75vh]">
          <div>
            <h3 className="text-zinc-500 font-extrabold text-sm uppercase tracking-widest mb-4 font-['Outfit']">
              Game Stats
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-zinc-900/30 p-2.5 border border-zinc-90 w-full rounded-xl shadow-sm text-xs select-none">
                <Hourglass className="text-indigo-400" size={16} />
                <div>
                  <div className="text-zinc-500 text-[10px] font-bold block">ACTIVE LESSON</div>
                  <div className="text-zinc-200 font-black truncate max-w-[130px]">{state.activeLesson?.name}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-zinc-900/30 p-2.5 border border-zinc-90 w-full rounded-xl shadow-sm text-xs select-none">
                <CircleUser className="text-purple-400" size={16} />
                <div>
                  <div className="text-zinc-500 text-[10px] font-bold block">PARTICIPATING TEAMS</div>
                  <div className="text-zinc-200 font-black">{state.teams.length} Teams Registered</div>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handlePlayAgain}
            className="w-full py-4 mt-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl cursor-pointer hover:scale-102 active:scale-98 transition-all font-black text-white text-md tracking-wider flex items-center justify-center gap-2.5 uppercase shadow-xl"
          >
            <RefreshCcw size={16} className="animate-spin" /> PLAY AGAIN
          </button>
        </div>

      </div>

    </div>
  );
};
export default StandingsArena;
