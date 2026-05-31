import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { Question } from '../../types';
import { useEffects } from '../EffectsOverlay';

export const MultipleChoiceActivity: React.FC<{ question: Question; onResolved: (correct: boolean) => void }> = ({ question, onResolved }) => {
  const { state } = useGame();
  const { particles } = useEffects();
  const [options, setOptions] = useState<{ id: string; val: string; isCorrect: boolean }[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    setSelected(null);
    if (question.choices?.A) {
      setOptions(['A', 'B', 'C', 'D']
        .filter(k => question.choices?.[k])
        .map(k => ({ id: k, val: question.choices![k]!, isCorrect: k === question.correct })));
    } else {
      const correctText = question.back || '';
      const pool = (state.activeLesson?.questions || []).map(q => q.back || '').filter(b => b && b !== correctText);
      const distractors = pool.sort(() => Math.random() - 0.5).slice(0, 3);
      setOptions([correctText, ...distractors]
        .sort(() => Math.random() - 0.5)
        .map((val, i) => ({ id: ['A', 'B', 'C', 'D'][i], val, isCorrect: val === correctText })));
    }
  }, [question]);

  const handlePick = (opt: any, e: React.MouseEvent) => {
    if (selected) return;
    setSelected(opt.id);
    particles(e.currentTarget as HTMLElement, opt.isCorrect ? '#38b000' : '#ef4444', 12);
    onResolved(opt.isCorrect);
  };

  const showPrompt = state.showBackFirst ? (question.back || question.front) : question.front;

  return (
    <div className="w-full space-y-6 animate-[fadeIn_0.5s_forwards]">
      <div className="bg-zinc-950/20 border border-zinc-900 p-10 rounded-[2rem] text-center">
        <div className="text-white text-4xl md:text-7xl font-black leading-relaxed" dangerouslySetInnerHTML={{ __html: showPrompt }} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        {options.map((opt, i) => {
          const colors = ['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-emerald-500'];
          const isSel = selected === opt.id;
          const highlight = selected 
            ? (opt.isCorrect ? 'border-emerald-400 scale-[1.02] shadow-emerald-500/20' : isSel ? 'border-red-500 opacity-60' : 'opacity-20')
            : 'border-white/10';

          return (
            <button
              key={opt.id}
              disabled={!!selected}
              onClick={(e) => handlePick(opt, e)}
              className={`${colors[i % 4]} ${highlight} border-2 px-8 py-7 rounded-2xl text-left text-white text-2xl md:text-3xl font-bold flex items-center transition-all cursor-pointer`}
            >
              <span className="w-8 border-r-2 border-white/25 pr-3 mr-4 font-mono font-black text-white/50">{opt.id}</span>
              <span className="flex-1 truncate">{opt.val}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};