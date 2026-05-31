import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { useEffects } from '../EffectsOverlay';
import { audioService } from '../../services/audioService';
import { ActivitiesArena } from '../Activities/ActivitiesArena';
import { GamesArena } from '../Games/GamesArena';
import { SettingsModal } from '../Modals/SettingsModal';
import { Settings, Shield, Bomb, Trophy, Sparkles, HelpCircle } from 'lucide-react';

export const GameplayArena: React.FC = () => {
  const { state, setScore, advanceTurn, resetGame, endGame } = useGame();
  const { floatText } = useEffects();

  // Phase tracker: 'question' | 'game'
  const [phase, setPhase] = useState<'question' | 'game'>('question');

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Confirmation dialog state
  const [confirmingAction, setConfirmingAction] = useState<'quit' | 'finish' | null>(null);

  const activeTeam = state.teams[state.activeIndex];

  const handleQuestionResolved = (correct: boolean) => {
    if (correct) {
      if (state.isStudyMode || !state.activeGameId) {
        // Study mode / no game: advance direct to next turn
        setTimeout(() => {
          advanceTurn();
          setPhase('question');
        }, 1000);
      } else {
        // Game mode: slide into game phase
        setPhase('game');
      }
    } else {
      // Mistake: auto-advance immediately to the next team
      setTimeout(() => {
        advanceTurn();
        setPhase('question');
      }, 1000);
    }
  };

  const handleGameTurnEnded = () => {
    advanceTurn();
    setPhase('question');
  };

  const playHover = () => {
    audioService.sounds.navHover();
  };

  // Score override popup dialog
  const handleScoreOverride = (teamIndex: number) => {
    audioService.sounds.navSelect();
    const team = state.teams[teamIndex];
    if (!team) return;

    const raw = prompt(`Configure manual score adjustment for ${team.name}:`, team.score.toString());
    if (raw !== null && !isNaN(parseInt(raw))) {
      const targetScore = Math.max(0, parseInt(raw));
      setScore(teamIndex, targetScore);
      floatText(`${team.name} updated to ${targetScore}!`);
      audioService.sounds.rare();
    }
  };

  if (state.teams.length === 0 || !activeTeam) {
    return null;
  }

  // Calculate learning session progress percentage (Corrected calculation)
  const totalQuestions = state.activeLesson?.questions.length || 1;
  const progressPercent = Math.min(100, Math.max(0, ((state.activeIndex + 1) / totalQuestions) * 100));

  // Determine if the footer (team bar) should be visible
  const showFooter = state.isStudyMode === false && state.activeQuestionnaireId !== 'bingo';

  return (
    <div className="flex flex-col h-screen text-white select-none animate-[fadeIn_0.5s_ease-out]">
      
      {/* 1. Header Progress & Control panels */}
      <header className="px-6 py-4 bg-zinc-900/20 backdrop-blur-2xl border-b border-white/10 flex items-center justify-between z-40">
        <div className="flex items-center gap-4">
          <button
            onMouseEnter={playHover}
            onClick={() => setIsSettingsOpen(true)}
            className="p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 rounded-xl cursor-pointer transition-all flex items-center justify-center shadow-md text-zinc-400 hover:text-indigo-400"
          >
            <Settings size={20} />
          </button>

          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-widest font-mono">
              Lesson
            </span>
            <span className="text-zinc-200 font-black text-md">
              {state.activeLesson?.name}
            </span>
          </div>
        </div>

        {/* Active team chips banner */}
        <div className="flex items-center gap-3 bg-zinc-900/40 border border-zinc-850/60 px-5 py-2.5 rounded-full filter drop-shadow-md">
          <span className="text-2xl filter drop-shadow-[0_0_8px_currentColor]" style={{ color: activeTeam.color }}>
            🚀
          </span>
          <div className="text-left font-['Outfit'] pr-1">
            <div className="text-[9px] text-zinc-500 font-extrabold tracking-widest block uppercase">UP NEXT</div>
            <div className="text-lg font-black" style={{ color: activeTeam.color }}>
              {activeTeam.name}
            </div>
          </div>
          
          {/* Active conditions indicators */}
          <div className="flex items-center gap-1.5 ml-2">
            {state.shielded[activeTeam.index] && (
              <span className="text-blue-400 bg-blue-950/40 border border-blue-900/50 p-1 rounded-full flex items-center justify-center animate-pulse" title="Star Shield Active!">
                <Shield size={14} />
              </span>
            )}
            {state.pendingBombTargets[activeTeam.index] && (
              <span className="text-red-500 bg-red-950/40 border border-red-900/50 p-1 rounded-full flex items-center justify-center animate-[bounce_1s_infinite]" title="Bomb Planted!">
                <Bomb size={14} />
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex flex-col items-end pr-2 text-right">
            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest font-mono">Progress</span>
            <span className="text-xs text-indigo-400 font-black">
              {Math.round(progressPercent)}%
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onMouseEnter={playHover}
              onClick={() => {
                audioService.sounds.navSelect();
                setConfirmingAction('quit');
              }}
              className="px-4 py-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-800 rounded-xl text-[10px] font-black tracking-widest uppercase text-zinc-500 hover:text-zinc-300 transition-all cursor-pointer"
            >
              Quit
            </button>
            
            <button
              onMouseEnter={playHover}
              onClick={() => {
                audioService.sounds.navSelect();
                setConfirmingAction('finish');
              }}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-105 active:scale-95 text-white text-xs font-black tracking-widest uppercase rounded-xl border border-indigo-500 shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
            >
              🏁 Finish Session
            </button>
          </div>
        </div>
      </header>

      {/* Progress horizontal line bar on HUD */}
      <div className="w-full h-1.5 bg-zinc-950">
        <div 
          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* 2. Main Arena splits between Question Cards and Active mini-games */}
      <main className="flex-1 min-h-0 flex items-stretch justify-center p-6 relative overflow-hidden bg-zinc-950/10">
        
        {phase === 'question' ? (
          <div className="w-full h-full flex flex-col items-center justify-center min-h-0">
            <div className="text-center text-xs text-zinc-500 font-bold uppercase tracking-widest font-mono mb-4 absolute top-4 left-6 py-1 px-3 bg-zinc-900/40 border border-zinc-900/40 rounded-full flex items-center gap-2 select-none">
              <Sparkles size={12} className="text-yellow-400 animate-spin" />
              <span>QUIZ MODE: ANSWER QUESTION</span>
            </div> 
            <ActivitiesArena onQuestionResolved={handleQuestionResolved} />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-xs text-zinc-500 font-bold uppercase tracking-widest font-mono mb-4 absolute top-4 left-6 py-1 px-3 bg-zinc-900/40 border border-zinc-900/40 rounded-full flex items-center gap-2 select-none">
              <Trophy size={12} className="text-purple-400" />
              <span>BONUS MINI-GAME</span>
            </div>
            <GamesArena onTurnEnd={handleGameTurnEnded} />
          </div>
        )}

      </main>

      {/* 3. Footer Standings & Scores tracker panel */}
      {showFooter && (
        <footer className="px-6 py-4 bg-zinc-900/20 backdrop-blur-2xl border-t border-white/10 flex gap-4 overflow-x-auto select-none scrollbar-thin scrollbar-thumb-zinc-500 scrollbar-track-white/5 shrink-0">
          {state.teams.map((team, idx) => {
            const isActive = idx === state.activeIndex;
            const isTargeted = state.pendingBombTargets[team.index];
            const isShielded = state.shielded[team.index];

            return (
              <div
                key={team.index}
                onClick={() => handleScoreOverride(team.index)}
                className={`flex-1 min-w-[130px] p-3 border-b-4 rounded-xl cursor-pointer select-none transition-all duration-150 flex flex-col justify-between ${
                  isActive
                    ? 'bg-zinc-900/80 border-b-indigo-500 shadow-md scale-102 font-bold'
                    : 'bg-zinc-950/20 hover:bg-zinc-900/20 border-b-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between text-xs text-zinc-500 font-semibold mb-1">
                  <span className="truncate max-w-[80px]" style={{ color: team.color }}>
                    {team.name}
                  </span>
                  <div className="flex items-center gap-0.5">
                    {isShielded && <Shield size={10} className="text-blue-400" />}
                    {isTargeted && <Bomb size={10} className="text-red-500" />}
                  </div>
                </div>

                <div id="tab-score-item" className="text-2xl font-black text-white font-mono flex items-center justify-between mt-1">
                  <span>{team.score}</span>
                  <span className="text-[10px] text-zinc-600 font-normal">pts</span>
                </div>
              </div>
            );
          })}
        </footer>
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* 5. Confirmation Popups */}
      {confirmingAction && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[60] animate-[fadeIn_0.2s_ease-out]">
          <div className="w-full max-w-sm bg-zinc-950 border border-zinc-850 rounded-[2rem] p-8 shadow-2xl text-center animate-[scaleUp_0.2s_ease-out]">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${confirmingAction === 'quit' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'}`}>
              <HelpCircle size={32} />
            </div>
            
            <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">
              {confirmingAction === 'quit' ? 'Quit Session?' : 'Finish Session?'}
            </h3>
            
            <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
              {confirmingAction === 'quit' 
                ? 'Are you sure you want to quit? This will immediately reset the current session and return you to the hub.' 
                : 'Are you sure you want to end this session and proceed to the results?'}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmingAction(null)}
                className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 text-zinc-400 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                CANCEL
              </button>
              <button
                onClick={() => {
                  if (confirmingAction === 'quit') {
                    resetGame();
                  } else {
                    audioService.sounds.victory();
                    endGame();
                  }
                  setConfirmingAction(null);
                }}
                className={`flex-1 py-3 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg transition-all cursor-pointer ${
                  confirmingAction === 'quit' 
                    ? 'bg-red-600 hover:bg-red-500 shadow-red-600/20' 
                    : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'
                }`}
              >
                {confirmingAction === 'quit' ? 'Confirm Quit' : 'Confirm Finish'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default GameplayArena;
