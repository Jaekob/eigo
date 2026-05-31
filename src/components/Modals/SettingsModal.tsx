import React from 'react';
import { audioService } from '../../services/audioService';
import { useEffects } from '../EffectsOverlay';
import { X, Volume2, Settings } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { floatText } = useEffects();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[80] p-4 animate-[fadeIn_0.3s_ease-out]">
      <div className="w-full max-w-md bg-zinc-900/20 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl flex flex-col animate-[scaleUp_0.3s_ease-out] relative">
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-8">
          <div className="flex items-center gap-3">
            <Settings className="text-indigo-400" size={24} />
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Global Settings</h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-zinc-500 hover:text-white cursor-pointer hover:bg-white/5 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-10">
          {/* Audio Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
               <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Audio Engine</span>
               <div className="flex items-center gap-2 px-2 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                 <Volume2 size={12} className="text-indigo-400" />
                 <span className="text-[10px] font-black text-indigo-300">SFX READY</span>
               </div>
            </div>

            <div className="p-6 bg-black/40 rounded-2xl border border-white/5">
              <label className="block text-[11px] font-bold text-zinc-400 mb-4 uppercase tracking-tight">Master Volume Control</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                defaultValue={audioService.getVolume()}
                onChange={(e) => audioService.setVolume(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[9px] text-zinc-600 mt-3 font-black uppercase tracking-widest">
                <span>Mute</span>
                <span>50%</span>
                <span>Max</span>
              </div>
            </div>

            <button
              onClick={() => {
                audioService.sounds.victory();
                floatText("TEST SOUND PLAYED!", "#a29bfe");
              }}
              className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-zinc-300 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all cursor-pointer flex items-center justify-center gap-3"
            >
              🔊 Play Diagnostic Frequency
            </button>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 flex justify-end">
          <button
            onClick={onClose}
            className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-indigo-500/20"
          >
            Apply Settings
          </button>
        </div>
      </div>
    </div>
  );
};