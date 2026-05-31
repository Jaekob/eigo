import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { useEffects } from '../EffectsOverlay';
import { audioService } from '../../services/audioService';
import { Settings, ArrowRight, ArrowLeft, Sparkles, Volume2 } from 'lucide-react';
import { triggerWarp } from '../StarfieldBackground';
import { DashboardHub } from './DashboardHub';

interface StartScreenProps {
  onStartSession: () => void;
}

type StartPage = 'splash' | 'dashboard' | 'credits';

export const StartScreen: React.FC<StartScreenProps> = ({ onStartSession }) => {
  const { state } = useGame();
  const { floatText } = useEffects();

  // Dashboard page router state
  const [page, setPage] = useState<StartPage>('dashboard');

  const handleNavigate = (nextPage: StartPage) => {
    audioService.sounds.navSelect();
    triggerWarp(6, 120, 1);
    setPage(nextPage);
  };

  const playHover = () => {
    audioService.sounds.navHover();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white relative p-6 w-full">
      
      {/* 1. Splash Page */}
      {page === 'splash' && (
        <div className="text-center animate-[fadeIn_0.6s_ease-out] flex flex-col items-center justify-center">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 mb-6 filter drop-shadow-[0_0_20px_rgba(168,85,247,0.4)]">
            E.I.G.O.
          </h1>
          <p className="text-lg md:text-xl font-light text-indigo-200/80 tracking-widest uppercase mb-12 max-w-lg leading-relaxed">
            English Interaction & Gamification Orchestrator
          </p>
          <button
            onMouseEnter={playHover}
            onClick={() => handleNavigate('dashboard')}
            className="px-12 py-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-2xl font-bold tracking-widest shadow-[0_0_35px_rgba(168,85,247,0.5)] border border-white/20 hover:scale-105 active:scale-95 transition-all outline-none animate-pulse cursor-pointer"
          >
            START SESSION
          </button>
        </div>
      )}

      {/* 3. Unified Dashboard Hub (Full Screen width overlay) */}
      {page === 'dashboard' && (
        <DashboardHub 
          onStartSession={onStartSession} 
          onExit={() => handleNavigate('splash')} 
          onCredits={() => handleNavigate('credits')}
        />
      )}

      {/* 5. Credits Page */}
      {page === 'credits' && (
        <div className="w-full max-w-lg bg-zinc-950/85 backdrop-blur-xl border border-zinc-850 rounded-3xl p-8 shadow-2xl text-center relative animate-[fadeIn_0.5s_ease-out]">
          <h2 className="text-3xl font-bold text-indigo-300 mb-6 font-['Outfit']">About E.I.G.O.</h2>
          <p className="text-zinc-400 leading-relaxed max-w-sm mx-auto mb-8 text-xs">
            E.I.G.O. is a state-of-the-art interactive teaching platform optimized for Japanese ESL elementary and junior high schools.
          </p>
          <div className="grid grid-cols-2 gap-4 text-left border-y border-zinc-900/60 py-6 mb-8 text-sm">
            <div>
              <div className="text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">Engineering</div>
              <div className="text-zinc-200">Jaekob Childress</div>
            </div>
            <div>
              <div className="text-purple-400 font-bold text-xs uppercase tracking-wider mb-1">Design Blueprint</div>
              <div className="text-zinc-200">Jaekob Childress</div>
            </div>
          </div>
          <button
            onMouseEnter={playHover}
            onClick={() => handleNavigate('dashboard')}
            className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-full text-xs font-semibold mx-auto cursor-pointer"
          >
            <ArrowLeft size={14} /> Back to Hub
          </button>
        </div>
      )}

    </div>
  );
};
export default StartScreen;
