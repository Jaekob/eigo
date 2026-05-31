import React, { useState } from 'react';
import { useGame } from '../../../context/GameContext';
import { audioService } from '../../../services/audioService';
import { GameType } from '../../../types';
import { Dices, X, Check } from 'lucide-react';

interface GameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (id: GameType | null) => void;
}

export const GameModal: React.FC<GameModalProps> = ({ isOpen, onClose, onSelect }) => {
  const { state } = useGame();
  const [isVariantOpen, setIsVariantOpen] = useState(false);

  if (!isOpen) return null;

  if (isVariantOpen) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-[fadeIn_0.3s_ease-out]">
        <div className="w-full max-w-xl bg-zinc-900/20 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col animate-[scaleUp_0.3s_ease-out]">
          <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <Dices className="text-purple-400" size={24} />
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">Choose Roulette Variant</h3>
            </div>
            <button onClick={() => setIsVariantOpen(false)} className="p-2 hover:bg-white/10 rounded-full text-zinc-500 hover:text-white transition-all cursor-pointer"><X size={20} /></button>
          </div>
          
          <div className="space-y-4">
            <span className="text-[11px] text-zinc-500 font-black uppercase tracking-widest block mb-4">Select a variant for Cosmic Roulette</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { id: 'roulette-base', name: 'Standard Roulette', icon: '🎡', desc: 'Classic spin with points, bombs, and rare powers.' },
                { id: 'roulette-rachel', name: 'Galactic Roulette', icon: '🌌', desc: 'Simplified wheel with social scoring and unique events.' }
              ].map(v => (
                <button
                  key={v.id}
                  onClick={() => { 
                    onSelect(v.id as GameType); 
                    setIsVariantOpen(false); 
                  }}
                  className={`p-6 border rounded-2xl text-left cursor-pointer transition-all duration-150 flex flex-col justify-between min-h-[120px] ${state.activeGameId === v.id ? 'border-purple-500 bg-purple-500/10 shadow-lg' : 'border-white/5 bg-white/5 hover:border-white/20'}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{v.icon}</span>
                    <span className={`font-black text-lg ${state.activeGameId === v.id ? 'text-purple-400' : 'text-zinc-200'}`}>{v.name}</span>
                  </div>
                  <span className="text-xs text-zinc-500 leading-relaxed">{v.desc}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-white/5">
            <button onClick={() => setIsVariantOpen(false)} className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer">◀ Back to Game Modes</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-[fadeIn_0.3s_ease-out]">
      <div className="w-full max-w-3xl bg-zinc-900/20 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col animate-[scaleUp_0.3s_ease-out]">
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <Dices className="text-purple-400" size={24} />
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Choose Mini-Game Mode</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-zinc-500 hover:text-white transition-all cursor-pointer"><X size={20} /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-500 max-h-[60vh] space-y-6">
          <div
            onClick={() => onSelect(null)}
            className={`p-6 border rounded-2xl cursor-pointer transition-all flex items-center justify-between ${state.isStudyMode ? 'border-emerald-500 bg-emerald-500/10 shadow-lg' : 'border-white/5 bg-white/5 hover:border-white/20'}`}
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">📖</span>
              <div>
                <div className={`font-black text-lg ${state.isStudyMode ? 'text-emerald-400' : 'text-zinc-200'}`}>Pure Study Mode</div>
                <div className="text-xs text-zinc-500 mt-1">No scoring or mini-games. Best for initial teaching.</div>
              </div>
            </div>
            {state.isStudyMode && <Check size={20} className="text-emerald-400" />}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { id: 'galaxy-race', name: 'Galaxy Race', desc: '🚀 Roll space dice to race rockets!' },
              { id: 'roulette-base', name: 'Cosmic Roulette', desc: '🎡 Interactive spin wheel with powers.' },
              { id: 'star-grid', name: 'Star Grid Coordinate', desc: '✨ Scan coordinates to find stars.' },
              { id: 'space-exploration', name: 'Simultaneous Bid', desc: '🛰️ Secretly bid on space grid.' },
              { id: 'pachinko', name: 'Physics Pachinko', desc: '🔮 Cascading gravity ball drops.' }
            ].map(gm => {
              const isSel = !state.isStudyMode && state.activeGameId === gm.id;
              return (
                <button
                  key={gm.id}
                  onClick={() => {
                    if (gm.id === 'roulette-base') {
                      audioService.sounds.navSelect();
                      setIsVariantOpen(true);
                    } else {
                      onSelect(gm.id as GameType);
                    }
                  }}
                  className={`p-6 border rounded-2xl text-left cursor-pointer transition-all duration-150 flex flex-col justify-between min-h-[120px] ${isSel ? 'border-purple-500 bg-purple-500/10 shadow-lg' : 'border-white/5 bg-white/5 hover:border-white/20'}`}
                >
                  <span className={`font-black text-lg ${isSel ? 'text-purple-400' : 'text-zinc-200'}`}>{gm.name}</span>
                  <span className="text-xs text-zinc-500 mt-2 leading-relaxed">{gm.desc}</span>
                </button>
              );
            })}
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-white/5">
          <button onClick={onClose} className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer">Confirm Game Mode</button>
        </div>
      </div>
    </div>
  );
};