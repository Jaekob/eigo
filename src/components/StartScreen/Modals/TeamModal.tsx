import React from 'react';
import { useGame } from '../../../context/GameContext';
import { audioService } from '../../../services/audioService';
import { Users, X } from 'lucide-react';

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamCount: number;
  setTeamCount: (n: number) => void;
  teamNames: string[];
  setTeamNames: (names: string[]) => void;
  startingTeamIndex: number;
  setStartingTeamIndex: (idx: number) => void;
}

export const TeamModal: React.FC<TeamModalProps> = ({ 
  isOpen, 
  onClose, 
  teamCount, 
  setTeamCount, 
  teamNames, 
  setTeamNames, 
  startingTeamIndex, 
  setStartingTeamIndex 
}) => {
  const { state } = useGame();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-[fadeIn_0.3s_ease-out]">
      <div className="w-full max-w-lg bg-zinc-900/20 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col animate-[scaleUp_0.3s_ease-out]">
        
        <div className="flex items-center justify-between border-b border-zinc-900 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
              <Users size={24} />
            </div>
            <h3 className="text-xl font-black text-white">Team Configuration</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-900 rounded-full text-zinc-500 hover:text-white transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-8 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-500 max-h-[60vh]">
          {/* Number of Teams */}
          <div>
            <span className="text-[11px] text-zinc-500 font-black uppercase tracking-widest block mb-3">Number of Active Teams</span>
            <div className="flex gap-1.5 bg-zinc-950/40 p-1.5 border border-zinc-900 rounded-2xl">
              {[2, 3, 4, 5, 6, 8].map(n => (
                <button
                  key={n}
                  onClick={() => {
                    audioService.sounds.navHover();
                    setTeamCount(n);
                    if (startingTeamIndex >= n) setStartingTeamIndex(0);
                  }}
                  className={`flex-1 py-2 text-xs border rounded-xl font-black cursor-pointer transition-all ${
                    teamCount === n
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
                      : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-200'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Team Roster & Starting Selection */}
          <div>
            <span className="text-[11px] text-zinc-500 font-black uppercase tracking-widest block mb-3">Team Roster & Turn Order</span>
            <div className="space-y-3">
              {Array.from({ length: teamCount }).map((_, idx) => {
                const color = `hsl(${(idx * 360) / teamCount}, 85%, 60%)`;
                const isStarting = startingTeamIndex === idx;
                
                return (
                  <div 
                    key={idx} 
                    className={`flex items-center gap-3 p-3 border rounded-2xl transition-all ${
                      isStarting 
                        ? 'bg-indigo-950/20 border-indigo-500/40 shadow-inner' 
                        : 'bg-zinc-950/20 border-zinc-900'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: color }} />
                    
                    <input
                      type="text"
                      value={teamNames[idx] || `Team ${idx + 1}`}
                      onChange={(e) => {
                        const updated = [...teamNames];
                        updated[idx] = e.target.value;
                        setTeamNames(updated);
                      }}
                      className="bg-transparent border-none outline-none text-sm text-zinc-100 flex-1 font-bold focus:text-white"
                      placeholder={`Enter team name...`}
                    />

                    <button
                      onClick={() => {
                        audioService.sounds.navHover();
                        setStartingTeamIndex(idx);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer border ${
                        isStarting
                          ? 'bg-indigo-500 border-indigo-400 text-white'
                          : 'bg-zinc-900 border-zinc-850 text-zinc-600 hover:text-zinc-400'
                      }`}
                    >
                      {isStarting ? 'Starts 🚀' : 'Set as Start'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-zinc-900">
          <button
            onClick={onClose}
            className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
          >
            Apply Settings
          </button>
        </div>
      </div>
    </div>
  );
};