import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { Question } from '../../types';
import { audioService } from '../../services/audioService';

export const WordScrambleActivity: React.FC<{ question: Question; onResolved: (correct: boolean) => void }> = ({ question, onResolved }) => {
  const { state } = useGame();
  const [letters, setLetters] = useState<string[]>([]);
  const [indices, setIndices] = useState<number[]>([]);

  const target = (state.showBackFirst ? question.front : (question.back || ''))
    .replace(/<[^>]*>/g, '').trim().toUpperCase().split('').filter(c => /[A-Z0-9]/.test(c)).join('');

  useEffect(() => {
    const chars = target.split('');
    let shuffled = [...chars].sort(() => Math.random() - 0.5);
    while (shuffled.join('') === target && shuffled.length > 1) shuffled.sort(() => Math.random() - 0.5);
    setLetters(shuffled);
    setIndices([]);
  }, [question]);

  const toggle = (idx: number) => {
    audioService.sounds.navHover();
    setIndices(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
  };

  const submit = () => {
    const spelled = indices.map(i => letters[i]).join('');
    onResolved(spelled === target);
  };

  const showPrompt = state.showBackFirst ? (question.back || question.front) : question.front;

  return (
    <div className="w-full flex flex-col items-center space-y-6 animate-[fadeIn_0.5s_forwards]">
      <div className="w-full bg-zinc-950/20 border border-zinc-850 p-10 rounded-[2rem] text-center shadow-md">
        <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold block mb-2">Scramble Hint</span>
        <div className="text-white text-4xl md:text-6xl font-black" dangerouslySetInnerHTML={{ __html: showPrompt }} />
      </div>

      <div className="flex gap-2 flex-wrap justify-center py-4 px-6 bg-zinc-950/20 border border-zinc-900 rounded-2xl w-full min-h-[80px] items-center">
        {target.split('').map((_, i) => (
          <button key={i} onClick={() => i < indices.length && toggle(indices[i])} className={`w-16 h-16 rounded-xl border flex items-center justify-center font-bold text-3xl transition-all ${i < indices.length ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-zinc-900/40 border-zinc-850 border-dashed text-transparent'}`}>
            {i < indices.length ? letters[indices[i]] : ''}
          </button>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap justify-center py-2 max-w-xl">
        {letters.map((l, i) => {
          const isSel = indices.includes(i);
          return (
            <button key={i} disabled={isSel} onClick={() => toggle(i)} className={`w-16 h-16 rounded-full border font-black text-2xl flex items-center justify-center transition-all ${isSel ? 'opacity-20 scale-90 grayscale' : 'bg-zinc-850 text-yellow-400 hover:scale-105 cursor-pointer'}`}>
              {l}
            </button>
          );
        })}
      </div>

      <div className="flex gap-4">
        <button onClick={() => setIndices([])} className="px-6 py-2 bg-zinc-900 text-zinc-400 text-xs font-black uppercase rounded-xl cursor-pointer">Reset</button>
        <button onClick={submit} disabled={indices.length < target.length} className="px-8 py-2.5 bg-yellow-500 text-white rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer disabled:opacity-40">Submit Spell</button>
      </div>
    </div>
  );
};