import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { Question } from '../../types';
import { audioService } from '../../services/audioService';

export const HotSeatActivity: React.FC<{ question: Question; onResolved: (correct: boolean) => void }> = ({ question, onResolved }) => {
  const { state } = useGame();
  const [seconds, setSeconds] = useState(10);

  useEffect(() => {
    setSeconds(10);
    const timer = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) { clearInterval(timer); onResolved(false); return 0; }
        audioService.sounds.tick();
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [question]);

  const showPrompt = state.showBackFirst ? (question.back || question.front) : question.front;

  return (
    <div className="w-full flex flex-col items-center space-y-8 animate-[fadeIn_0.5s_forwards]">
      <div className="w-full bg-zinc-950 border border-zinc-850 rounded-[2.5rem] p-12 text-center shadow-xl">
        <div className="text-white text-5xl md:text-8xl font-black leading-relaxed break-words" dangerouslySetInnerHTML={{ __html: showPrompt }} />
      </div>
      <div className="flex items-center gap-6 bg-zinc-900/30 border border-zinc-900 p-4 rounded-3xl w-full max-w-sm justify-center shadow-lg">
        <svg viewBox="0 0 120 120" width="100" height="100">
          <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8"/>
          <circle cx="60" cy="60" r="50" fill="none" stroke={seconds > 5 ? '#f59f00' : '#ef4444'} strokeWidth="8" strokeDasharray="314" strokeDashoffset={314 * (1 - seconds / 10)} transform="rotate(-90 60 60)" className="transition-all duration-1000 ease-linear" />
          <text x="60" y="67" textAnchor="middle" fill={seconds > 5 ? '#f59f00' : '#ef4444'} className="font-bold text-2xl font-mono">{seconds}s</text>
        </svg>
        <div className="text-left select-none">
          <div className="font-extrabold text-sm uppercase tracking-widest text-zinc-500">Rapid Hot Seat</div>
          <div className="text-zinc-300 text-xs mt-1">Answer before the timer runs out!</div>
        </div>
      </div>
    </div>
  );
};