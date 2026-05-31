import React from 'react';
import { Sparkles, X, ArrowRight } from 'lucide-react';
import { ActivityType, GameType } from '../../../types';

interface PresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadPreset: (preset: any) => void;
}

export const PresetModal: React.FC<PresetModalProps> = ({ isOpen, onClose, onLoadPreset }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-[fadeIn_0.3s_ease-out]">
      <div className="w-full max-w-xl bg-zinc-900/20 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col animate-[scaleUp_0.3s_ease-out]">
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <Sparkles className="text-pink-400" size={24} />
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Fast Setup Presets</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-zinc-500 hover:text-white transition-all cursor-pointer"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          {[
            {
              name: '🌈 Colors Pachinko',
              desc: 'ES Colors + Physics Ball Drop',
              lessonId: 'lt1-u4-colors',
              activityId: 'multiple-choice',
              gameId: 'pachinko',
              studyMode: false,
              teams: 4
            },
            {
              name: '🔟 Numbers Roll Call',
              desc: 'Number Counting + Star Finding',
              lessonId: 'lt1-u3-numbers-special',
              activityId: 'flashcard',
              gameId: 'roll-call',
              studyMode: false,
              teams: 3
            },
            {
              name: '🚀 Past Tense Galaxy Race',
              desc: 'JHS Grammar + Space Race',
              lessonId: 'jhs2-u2-past',
              activityId: 'word-scramble',
              gameId: 'galaxy-race',
              studyMode: false,
              teams: 3
            }
          ].map((preset, idx) => (
            <button
              key={idx}
              onClick={() => onLoadPreset(preset)}
              className="w-full text-left p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group flex items-center justify-between"
            >
              <div>
                <div className="text-lg font-black text-zinc-200 group-hover:text-pink-400 transition-colors">{preset.name}</div>
                <div className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-bold">{preset.desc}</div>
              </div>
              <ArrowRight size={20} className="text-zinc-600 group-hover:text-pink-400 group-hover:translate-x-1 transition-all" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};