import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { Question } from '../../types';
import { audioService } from '../../services/audioService';

export const SequenceActivity: React.FC<{ onResolved: (correct: boolean) => void; onNext: () => void }> = ({ onResolved, onNext }) => {
  const { state } = useGame();
  const [sequence, setSequence] = useState<Question[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(state.sequenceLength);
  const [hidden, setHidden] = useState(true);

  const startTimer = () => {
    setTimeLeft(state.sequenceLength);
    setHidden(false);
    setRevealed(false);
  };

  useEffect(() => {
    if (!state.activeLesson) return;
    const pool = [...state.activeLesson.questions].sort(() => Math.random() - 0.5);
    const types = pool.slice(0, Math.min(state.uniqueQuestionsInSequence, pool.length));
    setSequence(Array.from({ length: state.sequenceLength }, () => types[Math.floor(Math.random() * types.length)]));
    startTimer();
  }, [state.activeLesson]);

  useEffect(() => {
    if (hidden || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timer); setHidden(true); return 0; }
        audioService.sounds.tick();
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [hidden, timeLeft]);

  return (
    <div className="w-full space-y-6">
      {!hidden && (
        <div className="text-center text-xs text-yellow-400 font-extrabold uppercase tracking-widest animate-pulse font-mono mb-2">
          ⏳ MEMORIZING SEQUENCE... ({timeLeft}s)
        </div>
      )}

      <div className="flex gap-6 overflow-x-auto pb-4 w-full justify-center scrollbar-thin">
        {sequence.map((item, i) => {
          const isMem = !hidden;
          const frontText = state.showBackFirst ? (item.back || item.front) : item.front;
          const backText = state.showBackFirst ? item.front : (item.back || '');
          const content = revealed ? backText : (isMem ? frontText : null);

          return (
            <div key={i} className={`flex-1 min-w-[220px] max-w-[300px] aspect-[3/4] rounded-[2.5rem] border-4 flex flex-col items-center justify-between p-8 transition-all duration-500 shadow-2xl ${
              revealed ? 'border-emerald-500 bg-zinc-950' : isMem ? 'border-indigo-500 bg-zinc-950' : 'border-yellow-600/50 bg-yellow-500/5 animate-pulse'
            }`}>
              <span className="text-[10px] font-black text-zinc-500 uppercase font-mono">UNIT {i + 1}</span>
              <div className="flex-1 flex items-center justify-center text-center w-full">
                {content ? (
                  <div className={`${revealed ? 'text-4xl text-emerald-400' : 'text-2xl'} font-black [&>div]:scale-[0.4]`} dangerouslySetInnerHTML={{ __html: content }} />
                ) : <span className="text-4xl text-yellow-500/60 font-black">?</span>}
              </div>
              <div className="text-xs text-zinc-600 uppercase font-bold" dangerouslySetInnerHTML={{ __html: revealed ? frontText : 'Secret Card' }} />
            </div>
          );
        })}
      </div>

      <div className="flex justify-center gap-3 mt-2">
        <button onClick={startTimer} disabled={!hidden} className="px-6 py-2.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 text-xs font-bold text-indigo-400 rounded-full cursor-pointer transition-all disabled:opacity-40">🔄 Show Again</button>
        <button onClick={() => setRevealed(!revealed)} className="px-6 py-2.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 text-xs font-bold text-zinc-400 rounded-full cursor-pointer">👁️ {revealed ? 'Hide' : 'Reveal'} Answers</button>
      </div>
    </div>
  );
};