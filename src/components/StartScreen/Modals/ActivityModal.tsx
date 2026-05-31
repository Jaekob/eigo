import React, { useState } from 'react';
import { useGame } from '../../../context/GameContext';
import { contentService } from '../../../services/contentService';
import { audioService } from '../../../services/audioService';
import { ActivityType } from '../../../types';
import { ClipboardList, Shuffle, RefreshCw, X, Check } from 'lucide-react';

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (id: ActivityType) => void;
}

export const ActivityModal: React.FC<ActivityModalProps> = ({ isOpen, onClose, onSelect }) => {
  const { 
    state, 
    setRandomizeQuestions, 
    toggleBackFirst, 
    setSequenceLength, 
    setUniqueQuestionsInSequence, 
    setRollCallMinCount, 
    setRollCallMaxCount, 
    setRollCallDistractorCount,
    setActiveQuestionnaireId
  } = useGame();
  
  // Local state for complex settings before confirmation
  const [tempSeqLen, setTempSeqLen] = useState(state.sequenceLength);
  const [tempUniq, setTempUniq] = useState(state.uniqueQuestionsInSequence);

  if (!isOpen) return null;

  const handleConfirm = () => {
    audioService.sounds.navSelect();
    setSequenceLength(tempSeqLen);
    setUniqueQuestionsInSequence(tempUniq);
    onClose();
  };

  const lessonsList = contentService.getLessons();
  const sampleQ = state.activeLesson?.questions[0] || lessonsList[0]?.questions[0];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-[fadeIn_0.3s_ease-out]">
      <div className="w-full max-w-[95vw] bg-zinc-900/20 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col animate-[scaleUp_0.3s_ease-out]">
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <ClipboardList className="text-yellow-400" size={24} />
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Activity Configuration</h3>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setRandomizeQuestions(!state.randomizeQuestions)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase transition-all cursor-pointer ${state.randomizeQuestions ? 'border-purple-500 bg-purple-500/10 text-white' : 'border-white/10 text-zinc-500'}`}
            >
              <Shuffle size={14} /> {state.randomizeQuestions ? 'Random' : 'Fixed'}
            </button>
            <button
              onClick={() => {
                audioService.sounds.navSelect();
                toggleBackFirst(!state.showBackFirst);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase transition-all cursor-pointer ${state.showBackFirst ? 'border-indigo-500 bg-indigo-500/10 text-white' : 'border-white/10 text-zinc-500'}`}
            >
              <RefreshCw size={14} /> {state.showBackFirst ? 'Back First' : 'Front First'}
            </button>
            <button 
              onClick={onClose} 
              className="p-2 text-zinc-500 hover:text-white cursor-pointer hover:bg-white/5 rounded-full transition-colors"
            ><X size={20} /></button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-10 overflow-y-auto max-h-[65vh] pr-2">
          {/* Selection List */}
          <div className="flex-1 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 h-fit">
              {[
                { id: 'flashcard', name: 'Flashcard Quiz', desc: 'Standard oral vocab drill.' },
                { id: 'multiple-choice', name: 'Multiple Choice', desc: '4-choice interactive game.' },
                { id: 'word-scramble', name: 'Word Scramble', desc: 'Click/drag letters to spell.' },
                { id: 'sequence', name: 'Memory Match', desc: 'Recall a flashed sequence.' },
                { id: 'hot-seat', name: 'Hot Seat Countdown', desc: 'Rapid 10-second timer.' },
                { id: 'bingo', name: 'Vocabulary Bingo', desc: 'Randomly call cards for class grids.' },
                { id: 'roll-call', name: 'Roll Call Counting', desc: '💫 Count cosmic stars and travelers.' }
              ].map(act => (
              <button
                key={act.id}
                onClick={() => {
                  audioService.sounds.navHover();
                  onSelect(act.id as ActivityType);
                }}
                className={`p-4 border rounded-2xl text-left cursor-pointer transition-all flex flex-col justify-between min-h-[100px] ${state.activeQuestionnaireId === act.id ? 'border-yellow-500 bg-yellow-500/10' : 'border-white/5 bg-white/5 hover:border-white/20'}`}
              >
                <span className={`font-black text-md ${state.activeQuestionnaireId === act.id ? 'text-yellow-400' : 'text-zinc-200'}`}>{act.name}</span>
                <span className="text-[10px] text-zinc-500 mt-1">{act.desc}</span>
              </button>
            ))}
            </div>
          </div>
          
          {/* Preview & Contextual Settings Column */}
          <div className="w-full lg:w-[540px] space-y-6">
            <div className="space-y-3">
              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest block">Live Activity Preview</span>
              <div className="aspect-video bg-black/40 border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
                
                {/* Simulation Logic */}
                {(() => {
                  const p_Prompt = state.showBackFirst ? (sampleQ?.back || sampleQ?.front) : sampleQ?.front;
                  const p_Answer = state.showBackFirst 
                    ? sampleQ?.front 
                    : (sampleQ?.back || (sampleQ?.type === 'MultipleChoice' && sampleQ.choices ? sampleQ.choices[sampleQ.correct || 'A'] : 'Correct Answer'));
                  
                  switch(state.activeQuestionnaireId) {
                    case 'multiple-choice':
                      const cleanAnswer = p_Answer.replace(/<[^>]*>/g, '');
                      return (
                        <div className="w-full space-y-4 scale-90 animate-[fadeIn_0.3s_forwards]">
                           <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-center text-lg font-black [&>div]:scale-[0.4] [&>div]:origin-center" dangerouslySetInnerHTML={{ __html: p_Prompt }} />
                           <div className="grid grid-cols-2 gap-2">
                             {['A', 'B', 'C', 'D'].map((letter, idx) => (
                               <div key={letter} className={`px-3 py-2 rounded-xl border border-white/10 bg-white/5 flex items-center gap-2 opacity-50`}>
                                 <span className="font-mono font-black text-[9px]">{letter}</span>
                                 <span className="text-[10px] font-bold truncate">{idx === 0 ? cleanAnswer : `Choice ${letter}`}</span>
                               </div>
                             ))}
                           </div>
                        </div>
                      );
                    case 'word-scramble':
                      return (
                        <div className="w-full space-y-4 text-center scale-90">
                          <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-2xl font-black [&>div]:scale-[0.4] [&>div]:origin-center" dangerouslySetInnerHTML={{ __html: p_Prompt }} />
                          <div className="flex gap-1.5 justify-center">
                            {[1,2,3,4].map(i => <div key={i} className="w-8 h-8 rounded bg-zinc-800 border border-white/5" />)}
                          </div>
                        </div>
                      );
                    case 'sequence':
                      return (
                        <div className="flex flex-col items-center gap-3 w-full px-2 scale-90">
                          <div className="flex gap-2 w-full justify-center flex-wrap">
                            {Array.from({ length: Math.min(4, tempSeqLen) }).map((_, i) => (
                              <div key={i} className="w-16 aspect-[3/4] bg-zinc-950 border-2 border-indigo-500 rounded-xl flex flex-col items-center justify-center p-2 shadow-xl overflow-hidden">
                                <div 
                                  className="text-[10px] font-black text-white text-center [&>div]:scale-[0.2] line-clamp-3"
                                  dangerouslySetInnerHTML={{ __html: p_Prompt || '?' }}
                                />
                              </div>
                            ))}
                          </div>
                          <div className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.1em] mt-2 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                            {tempSeqLen} Cards • {tempUniq} Unique Types
                          </div>
                        </div>
                      );
                    case 'hot-seat':
                      return (
                        <div className="flex flex-col items-center gap-4 scale-90">
                          <div className="w-16 h-16 rounded-full border-4 border-orange-500/30 flex items-center justify-center font-mono font-black text-orange-500 text-xl">10s</div>
                          <div className="text-center font-black text-2xl [&>div]:scale-[0.4] [&>div]:origin-center" dangerouslySetInnerHTML={{ __html: p_Prompt }} />
                        </div>
                      );
                    case 'roll-call':
                      return (
                        <div className="text-center space-y-3 animate-pulse">
                          <div className="flex gap-2 justify-center">
                            <span className="text-3xl">✨</span><span className="text-2xl opacity-40">✨</span><span className="text-3xl">✨</span>
                          </div>
                          <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Procedural Arena Active</div>
                        </div>
                      );
                    case 'bingo':
                      return (
                        <div className="text-center space-y-3 animate-bounce">
                          <div className="w-16 h-16 bg-yellow-500/20 border border-yellow-500/40 rounded-full flex items-center justify-center mx-auto">
                            <span className="text-2xl font-black text-yellow-500">B</span>
                          </div>
                          <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Class Bingo Caller</div>
                        </div>
                      );
                    default:
                      return (
                        <div className="w-full p-6 bg-zinc-900/50 border border-white/5 rounded-2xl text-center shadow-xl scale-90">
                          <div className="text-[10px] text-zinc-600 font-mono mb-2 uppercase">Flashcard Mode</div>
                          <div className="text-3xl font-black leading-tight [&>div]:scale-[0.4] [&>div]:origin-center" dangerouslySetInnerHTML={{ __html: p_Prompt }} />
                        </div>
                      );
                  }
                })()}

                <div className="absolute bottom-3 left-0 right-0 text-center">
                  <span className="text-[7px] text-zinc-700 font-black uppercase tracking-[0.4em]">Simulation Node Active</span>
                </div>
              </div>
            </div>

            {/* Conditional Settings Panels */}
            <div className="space-y-4">
              {state.activeQuestionnaireId === 'roll-call' && (
                <div className="p-5 bg-black/40 rounded-[2rem] border border-white/5 space-y-4 animate-[fadeIn_0.3s_ease-out]">
                  <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest block">Roll Call Difficulty</span>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 mb-2 uppercase">Min: {state.rollCallMinCount}</label>
                      <input 
                        type="range" min="1" max="10" value={state.rollCallMinCount} 
                        onChange={(e) => setRollCallMinCount(Math.min(state.rollCallMaxCount, parseInt(e.target.value)))}
                        className="w-full h-1 bg-zinc-800 accent-yellow-500 appearance-none rounded-full" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 mb-2 uppercase">Max: {state.rollCallMaxCount}</label>
                      <input 
                        type="range" min="5" max="20" value={state.rollCallMaxCount} 
                        onChange={(e) => setRollCallMaxCount(Math.max(state.rollCallMinCount, parseInt(e.target.value)))}
                        className="w-full h-1 bg-zinc-800 accent-yellow-500 appearance-none rounded-full" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 mb-2 uppercase">Distractors: {state.rollCallDistractorCount}</label>
                    <input 
                      type="range" min="0" max="15" value={state.rollCallDistractorCount} 
                      onChange={(e) => setRollCallDistractorCount(parseInt(e.target.value))}
                      className="w-full h-1 bg-zinc-800 accent-zinc-500 appearance-none rounded-full" 
                    />
                  </div>
                </div>
              )}

              {state.activeQuestionnaireId === 'sequence' && (
                <div className="p-5 bg-black/40 rounded-[2rem] border border-white/5 space-y-4 animate-[fadeIn_0.3s_ease-out]">
                  <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest block">Memory Sequence Config</span>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 mb-2 uppercase">Sequence Length: {tempSeqLen} cards</label>
                      <input 
                        type="range" min="2" max="8" value={tempSeqLen} 
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setTempSeqLen(val);
                          if (tempUniq > val) setTempUniq(val);
                        }}
                        className="w-full h-1 bg-zinc-800 accent-indigo-500 appearance-none rounded-full" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 mb-2 uppercase">Unique Cards: {tempUniq} types</label>
                      <input 
                        type="range" min="1" max={Math.min(tempSeqLen, state.activeLesson?.questions.length || 10)} value={tempUniq} 
                        onChange={(e) => setTempUniq(parseInt(e.target.value))}
                        className="w-full h-1 bg-zinc-800 accent-indigo-500 appearance-none rounded-full" 
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
          <button onClick={handleConfirm} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest cursor-pointer">
            Confirm Selection
          </button>
        </div>
      </div>
    </div>
  );
};