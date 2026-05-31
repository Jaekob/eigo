import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { useEffects } from '../EffectsOverlay';
import { audioService } from '../../services/audioService';
import { triggerWarp } from '../StarfieldBackground';

export const DebugGame: React.FC<{ onTurnEnd: () => void }> = ({ onTurnEnd }) => {
  const { state, addScore, setScore } = useGame();
  const { floatText, particles } = useEffects();

  const [activeTab, setActiveTab] = useState<'diagnostics' | 'audio' | 'shaders' | 'db'>('diagnostics');

  const activeTeam = state.teams[state.activeIndex] || { name: 'None', score: 0 };

  const playHover = () => {
    audioService.sounds.navHover();
  };

  const handleSimulateResult = (isWin: boolean) => {
    audioService.sounds.navSelect();

    if (isWin) {
      addScore(state.activeIndex, 10);
      audioService.sounds.correct();
      floatText("MOCK WIN (+10)!", "#2ecc71");
      triggerWarp(15, 200, 1);
    } else {
      audioService.sounds.wrong();
      floatText("MOCK FAILURE!", "#ef4444");
      triggerWarp(10, 150, -1);
    }

    setTimeout(() => {
      onTurnEnd();
    }, 1200);
  };

  return (
    <div className="w-full max-w-3xl bg-zinc-950/80 border border-zinc-900 rounded-[2.5rem] p-6 shadow-2xl relative select-none animate-[fadeIn_0.5s_forwards]">
      
      {/* 1. Header diagnostics status line */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-4 mb-6">
        <div>
          <span className="text-[10px] bg-indigo-900/30 text-indigo-400 font-bold px-2.5 py-0.5 rounded border border-indigo-900/50 font-mono tracking-widest uppercase">
            Diag Suite
          </span>
          <h3 className="text-xl font-bold mt-1 font-['Outfit']">Diagnostic Sandbox Terminal</h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
          <span>CORE ENGINE OK</span>
        </div>
      </div>

      {/* 2. Tabs selection row */}
      <div className="flex gap-2 border-b border-zinc-900 pb-4 mb-6">
        {[
          { id: 'diagnostics', label: 'SYSTEM SCAN' },
          { id: 'audio', label: 'WAVE SYNTH' },
          { id: 'shaders', label: 'WARP VECT' },
          { id: 'db', label: 'SCORE MATRIX' }
        ].map(tab => (
          <button
            key={tab.id}
            onMouseEnter={playHover}
            onClick={() => {
              audioService.sounds.navSelect();
              setActiveTab(tab.id as any);
            }}
            className={`px-4 py-2 border rounded-xl text-xs font-bold font-['Outfit'] cursor-pointer transition-all ${
              activeTab === tab.id
                ? 'border-indigo-500 bg-indigo-500/15 text-indigo-400 shadow-md'
                : 'border-zinc-900 bg-zinc-950 hover:border-zinc-800 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Panel Bodies switching */}
      <div className="min-h-[250px] max-h-[350px] overflow-y-auto no-scrollbar mb-6">

        {/* Tab 1: Diagnostics */}
        {activeTab === 'diagnostics' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 bg-zinc-900/30 border border-zinc-900 p-4 rounded-2xl text-xs text-zinc-400">
              <div>
                <span className="text-zinc-600 block mb-1">Active Team Instance:</span>
                <span className="text-sm font-bold text-zinc-200" style={{ color: activeTeam.color }}>
                  {activeTeam.name}
                </span>
              </div>
              <div>
                <span className="text-zinc-600 block mb-1">Active Team Score:</span>
                <span className="text-sm font-bold text-zinc-200 font-mono">
                  {activeTeam.score} pts
                </span>
              </div>
              <div>
                <span className="text-zinc-600 block mb-1">Active Lesson:</span>
                <span className="text-sm font-bold text-zinc-200 truncate block">
                  {state.activeLesson?.name || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-zinc-600 block mb-1">Active Activity Type:</span>
                <span className="text-sm font-bold text-zinc-200 uppercase tracking-widest truncate">
                  {state.activeQuestionnaireId}
                </span>
              </div>
            </div>

            <div className="border border-zinc-900 rounded-2xl p-4 space-y-3">
              <span className="text-zinc-500 text-xs block font-bold uppercase tracking-wider font-['Outfit']">Handshake Simulators:</span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleSimulateResult(true)}
                  className="py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm cursor-pointer active:scale-95 transition-all text-center uppercase tracking-wider"
                >
                  🏆 Simulate Correct Answer (+10 Points)
                </button>
                <button
                  onClick={() => handleSimulateResult(false)}
                  className="py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm cursor-pointer active:scale-95 transition-all text-center uppercase tracking-wider"
                >
                  💥 Simulate Mistake (No points)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Audio Waves Synth testing */}
        {activeTab === 'audio' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: '🔔 Ping Success', fn: () => audioService.sounds.correct() },
              { label: '📯 Buzz Wrong', fn: () => audioService.sounds.wrong() },
              { label: '⚙️ Latch Click', fn: () => audioService.sounds.tick() },
              { label: '💰 Score Bank', fn: () => audioService.sounds.bank() },
              { label: '🌟 Rare Shimmer', fn: () => audioService.sounds.rare() },
              { label: '⭐ Coin Collect', fn: () => audioService.sounds.point() },
              { label: '💣 Megaton Bomb', fn: () => audioService.sounds.bomb() },
              { label: '🛸 Alien Arming', fn: () => audioService.sounds.bombPlant() },
              { label: '🏆 Anthem Victory', fn: () => audioService.sounds.victory() }
            ].map((snd, index) => (
              <button
                key={index}
                onClick={snd.fn}
                className="p-3 bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-semibold rounded-xl text-center cursor-pointer hover:border-zinc-700 active:bg-zinc-950 transition-all font-mono"
              >
                {snd.label}
              </button>
            ))}
          </div>
        )}

        {/* Tab 3: Shaders Vector Speed test */}
        {activeTab === 'shaders' && (
          <div className="space-y-4 text-xs font-mono text-zinc-500 leading-relaxed">
            <p>Alter the velocity coordinate matrices of the WebGL background starfield in real-time:</p>
            <div className="grid grid-cols-2 gap-3.5 pt-2">
              <button
                onMouseEnter={playHover}
                onClick={() => {
                  audioService.sounds.navSelect();
                  triggerWarp(15, 300, 1);
                  floatText("COSMIC WARP FORWARD!");
                }}
                className="p-4 bg-zinc-900 border border-zinc-850 hover:border-zinc-700 text-zinc-300 rounded-xl font-bold uppercase transition-all tracking-wider text-center cursor-pointer"
              >
                🌌 WARP FORWARD (+1 px/f)
              </button>

              <button
                onMouseEnter={playHover}
                onClick={() => {
                  audioService.sounds.navSelect();
                  triggerWarp(15, 300, -1);
                  floatText("COSMIC WARP REVERSE!");
                }}
                className="p-4 bg-zinc-900 border border-zinc-850 hover:border-zinc-700 text-zinc-300 rounded-xl font-bold uppercase transition-all tracking-wider text-center cursor-pointer"
              >
                🚀 WARP REVERSE (-1 px/f)
              </button>
            </div>
            <p className="text-zinc-600">Note: Warping alters values for travel parameters which translates of expanding pixel coordinate structures.</p>
          </div>
        )}

        {/* Tab 4: Scores Modifier Grid */}
        {activeTab === 'db' && (
          <div className="border border-zinc-900 rounded-2xl p-4">
            <span className="text-zinc-500 text-xs block font-bold mb-3 font-['Outfit']">MANUAL SCORE MODIFICATION OVERRIDE:</span>
            <div className="space-y-2.5">
              {state.teams.map((team) => (
                <div key={team.index} className="flex items-center justify-between bg-zinc-900/30 p-2.5 rounded-xl border border-zinc-900/50">
                  <span className="font-bold text-sm" style={{ color: team.color }}>{team.name}</span>
                  <div className="flex items-center gap-1.5 font-mono">
                    <button
                      onClick={() => setScore(team.index, Math.max(0, team.score - 5))}
                      className="w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-red-500 font-bold border border-zinc-800 text-sm cursor-pointer"
                    >
                      -5
                    </button>
                    <button
                      onClick={() => setScore(team.index, Math.max(0, team.score - 1))}
                      className="w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-red-400 font-bold border border-zinc-800 text-sm cursor-pointer"
                    >
                      -1
                    </button>
                    <span className="w-12 text-center text-sm font-bold text-white bg-zinc-950 border border-zinc-850 py-1.5 rounded-lg">
                      {team.score}
                    </span>
                    <button
                      onClick={() => addScore(team.index, 1)}
                      className="w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-emerald-400 font-bold border border-zinc-800 text-sm cursor-pointer"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => addScore(team.index, 5)}
                      className="w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-emerald-500 font-bold border border-zinc-800 text-sm cursor-pointer"
                    >
                      +5
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
export default DebugGame;
