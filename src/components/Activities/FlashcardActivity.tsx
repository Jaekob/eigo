import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { Question } from '../../types';
import { audioService } from '../../services/audioService';

interface FlashcardActivityProps {
  question: Question;
  count: number;
}

export const FlashcardActivity: React.FC<FlashcardActivityProps> = ({ question, count }) => {
  const { state } = useGame();
  const [revealed, setRevealed] = useState(false);

  useEffect(() => setRevealed(false), [question]);

  const showPrompt = state.showBackFirst ? (question.back || question.front) : question.front;
  const showAnswer = state.showBackFirst ? question.front : (question.back || '');

  return (
    <div className="w-full bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[2rem] text-center shadow-2xl relative overflow-hidden transition-all duration-300">
      <span className="absolute top-4 right-4 text-[10px] text-zinc-600 font-black tracking-widest font-mono">
        CARD #{count}
      </span>
      
      <div 
        className={`${revealed ? 'text-yellow-400' : 'text-white'} text-5xl md:text-8xl font-black mb-8 leading-relaxed max-w-5xl mx-auto break-words select-none transition-all duration-300`}
        dangerouslySetInnerHTML={{ __html: revealed ? showAnswer : showPrompt }}
      />

      {revealed ? (
        <div className="border-t-2 border-dashed border-zinc-900/60 pt-6 animate-[fadeIn_0.4s_forwards]">
          <div className="text-xs text-zinc-500 uppercase tracking-widest mb-2 font-mono">Original Question</div>
          <div 
            className="text-white/40 text-2xl md:text-3xl font-bold select-none [&>div]:scale-[0.4] [&>div]:origin-center"
            dangerouslySetInnerHTML={{ __html: showPrompt }}
          />
        </div>
      ) : (
        <button
          onClick={() => { audioService.sounds.navSelect(); setRevealed(true); }}
          className="px-6 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 text-xs font-black uppercase tracking-widest rounded-full cursor-pointer transition-all mt-4"
        >
          👁️ Reveal Translation
        </button>
      )}
    </div>
  );
};