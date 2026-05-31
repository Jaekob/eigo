import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { contentService, compatibilityService, CompatibilityResult, rollCallPresetLessonId, ACTIVITY_FIXED_LESSONS } from '../../services/contentService';
import { useEffects } from '../EffectsOverlay';
import { audioService } from '../../services/audioService';
import { Lesson, QuestionnaireType, GameType } from '../../types';
import { LessonEditorModal } from './Modals/LessonEditorModal';
import { ActivityType } from '../../types'; // Import ActivityType
import { ActivityModal } from './Modals/ActivityModal';
import { GameModal } from './Modals/GameModal';
import { TeamModal } from './Modals/TeamModal';
import { PresetModal } from './Modals/PresetModal';
import { SettingsModal } from '../Modals/SettingsModal';
import {
  Search, FolderDown, Upload, Sparkles, BookOpen, 
  Settings, ArrowRight, ArrowLeft, Plus, Edit, Trash2, 
  Check, AlertTriangle, Users, Play, ShieldAlert, BadgeAlert, RefreshCw, X, RotateCcw,
  ClipboardList, Dices, Shuffle
} from 'lucide-react';
import { triggerWarp } from '../StarfieldBackground';

interface DashboardHubProps {
  onStartSession: () => void;
  onExit: () => void;
  onCredits: () => void;
}

export const DashboardHub: React.FC<DashboardHubProps> = ({ onStartSession, onExit, onCredits }) => {
  const { 
    state, 
    setActiveLesson, 
    setActiveQuestionnaireId, 
    setActiveGameId, // GameType
    setSequenceLength,
    setUniqueQuestionsInSequence,
    setRandomizeQuestions,
    toggleBackFirst, 
    toggleStudyMode, 
    setRollCallMinCount,
    setRollCallMaxCount,
    setRollCallDistractorCount,
    initTeams 
  } = useGame();
  
  const { floatText } = useEffects();

  // Lessons list refresh state
  const [lessonsList, setLessonsList] = useState<Lesson[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'All' | 'Grade 3' | 'Grade 4' | 'Grade 5' | 'Grade 6' | 'JHS' | 'Custom'>('All');
  
  // Lesson creator modal states
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  // Teams configuration
  const [teamCount, setTeamCount] = useState<number>(3);
  const [teamNames, setTeamNames] = useState<string[]>(['Team 1', 'Team 2', 'Team 3', 'Team 4', 'Team 5', 'Team 6', 'Team 7', 'Team 8']);
  const [startingTeamIndex, setStartingTeamIndex] = useState<number>(0);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);
  const [tempSequenceLength, setTempSequenceLength] = useState(state.sequenceLength);
  const [tempUniqueQuestionsInSequence, setTempUniqueQuestionsInSequence] = useState(state.uniqueQuestionsInSequence);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Compatibility checks
  const [compResult, setCompResult] = useState<CompatibilityResult>({ compatible: true });

  const loadLessons = () => {
    setLessonsList(contentService.getLessons());
  };

  useEffect(() => {
    loadLessons();
  }, []);

  // Update compatibility state in real-time
  useEffect(() => {
    const res = compatibilityService.checkCompatibility(
      state.activeLesson,
      state.activeQuestionnaireId,
      state.activeGameId,
      teamCount,
      state.isStudyMode
    );
    setCompResult(res);
  }, [state.activeLesson, state.activeQuestionnaireId, state.activeGameId, teamCount, state.isStudyMode]);

  // --- Smart Reconciliation Logic ---

  const handleActivitySelect = (id: ActivityType) => {
    audioService.sounds.navHover();
    setActiveQuestionnaireId(id);

    // Generalized Fixed Lesson Auto-selection
    const fixedLessonId = ACTIVITY_FIXED_LESSONS[id];
    if (fixedLessonId) {
      const targetLesson = lessonsList.find(l => l.id === fixedLessonId);
      if (targetLesson) {
        setActiveLesson(targetLesson);
      }
    }

    // Reconciliation: If Roll Call is the activity, ensure Study Mode is OFF so a game follows.
    // We transition to a default game (like Galaxy Race) instead of forcing Roll Call as the game too.
    if (id === 'roll-call') {
      toggleStudyMode(false);
      if (!state.activeGameId) {
        setActiveGameId('galaxy-race');
      }
    }

    // Reconciliation: Bingo is its own game loop, so it forces Study Mode
    if (id === 'bingo') {
      toggleStudyMode(true);
      setActiveGameId(null);
    }
  };

  const handleGameSelect = (id: GameType | null) => {
    audioService.sounds.navSelect();
    
    if (id === null) {
      toggleStudyMode(true);
      setActiveGameId(null);
      return;
    }

    toggleStudyMode(false);
    setActiveGameId(id);

    // If the game is Galaxy Race, it works best with Word Scramble
    if (id === 'galaxy-race' && state.activeQuestionnaireId === 'flashcard') {
      setActiveQuestionnaireId('word-scramble');
    }
  };

  const handleCreateLesson = () => {
    audioService.sounds.navSelect();
    setEditingLesson(null);
    setIsEditorOpen(true);
  };

  const handleEditLesson = (lesson: Lesson, e: React.MouseEvent) => {
    e.stopPropagation();
    audioService.sounds.navSelect();
    setEditingLesson(lesson);
    setIsEditorOpen(true);
  };

  const handleDeleteLesson = (lessonId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this custom lesson?')) {
      audioService.sounds.wrong();
      contentService.deleteCustomLesson(lessonId);
      loadLessons();
      if (state.activeLesson?.id === lessonId) {
        setActiveLesson(lessonsList.find(l => l.id !== lessonId) || null);
      }
      floatText('Custom lesson deleted!');
    }
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result as string;
        const questions = contentService.parseCSV(text);
        if (questions.length === 0) {
          throw new Error('No valid questions parsed from sheet.');
        }

        const newLesson: Lesson = {
          id: `custom-imported-${Date.now()}`,
          name: `Imported: ${file.name.replace('.csv', '')}`,
          tags: ['Custom', 'Imported'],
          questions
        };

        contentService.saveCustomLesson(newLesson);
        loadLessons();
        setActiveLesson(newLesson);
        floatText('CSV Lesson Imported!');
        audioService.sounds.rare();
      } catch (err: any) {
        alert(`Validation Fail: ${err?.message || 'Check CSV column structure.'}`);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  // Launching the game session
  const handleLaunch = () => {
    if (!state.activeLesson || state.activeLesson.questions.length === 0) {
      alert('Please select a lesson containing valid questions first.');
      return;
    }

    if (!compResult.compatible && !compResult.isWarning) {
      alert(`Cannot launch: ${compResult.reason}`);
      return;
    }

    audioService.sounds.bank();
    triggerWarp(18, 250, 1);
    floatText('LAUNCHING LESSON!', '#a29bfe');

    if (state.isStudyMode) {
      initTeams(1, 0); // Study mode runs with 1 player
    } else {
      initTeams(teamCount, startingTeamIndex, teamNames.slice(0, teamCount));
    }

    setTimeout(() => {
      onStartSession();
    }, 450);
  };

  // Quick Preset Loader
  const loadPreset = (preset: {
    lessonId: string;
    activityId: ActivityType; // Use ActivityType
    gameId: GameType | null;
    studyMode: boolean;
    teams: number;
    sequenceLength?: number;
    uniqueQuestionsInSequence?: number;
  }) => {
    audioService.sounds.rare();
    floatText('Preset Loaded!', '#fdcb6e');

    const targetLesson = lessonsList.find(l => l.id === preset.lessonId);
    if (targetLesson) {
      setActiveLesson(targetLesson);
    }
    setActiveQuestionnaireId(preset.activityId); // Ensure this is ActivityType
    setActiveGameId(preset.gameId);
    toggleStudyMode(preset.studyMode);

    const sLen = preset.sequenceLength || 5;
    const uLen = preset.uniqueQuestionsInSequence || 3;
    setSequenceLength(sLen);
    setUniqueQuestionsInSequence(uLen);
    setTempSequenceLength(sLen);
    setTempUniqueQuestionsInSequence(uLen);

    setIsPresetModalOpen(false);
    setTeamCount(preset.teams);
  };

  // Filtering lessons
  const filteredLessons = lessonsList.filter(l => {
    // 1. Search Query
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = query === '' || 
      l.name.toLowerCase().includes(query) ||
      l.tags?.some(tag => tag.toLowerCase().includes(query));

    if (!matchesSearch) return false;

    // 2. Category Filter
    if (activeCategory === 'All') return true;
    if (activeCategory === 'Custom') return l.id.startsWith('custom') || l.tags?.includes('Custom') || l.tags?.includes('Imported');
    if (activeCategory === 'Grade 3') return l.tags?.includes('3rd Grade');
    if (activeCategory === 'Grade 4') return l.tags?.includes('4th Grade');
    if (activeCategory === 'Grade 5') return l.tags?.includes('5th Grade');
    if (activeCategory === 'Grade 6') return l.tags?.includes('6th Grade');
    if (activeCategory === 'JHS') return l.tags?.includes('JHS') || l.tags?.some(t => t.toLowerCase().includes('grade') && parseInt(t) >= 7);

    return true;
  });

  return (
    <div className="w-full max-w-[98vw] mx-auto px-4 py-8 flex flex-col min-h-screen text-white select-none animate-[fadeIn_0.5s_ease-out]">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-center justify-between border-b border-zinc-900 pb-2 mb-5 gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500">
            E.I.G.O. HUB
          </h1>
          <p className="text-zinc-500 text-xs tracking-wider uppercase mt-1">
            Teacher Activity Control & Customization Center
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              audioService.sounds.navSelect();
              setIsSettingsOpen(true);
            }}
            className="px-4 py-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-800 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors text-zinc-400"
          >
            <Settings size={16} /> Settings
          </button>
          
          <button
            onClick={() => {
              audioService.sounds.navSelect();
              onCredits();
            }}
            className="px-4 py-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-800 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors text-zinc-400"
          >
            <Sparkles size={16} /> Credits
          </button>

          <button
            onClick={() => {
              audioService.sounds.navSelect();
              onExit();
            }}
            className="px-5 py-2.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-800 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
          >
            <ArrowLeft size={16} /> Back to Splash
          </button>
        </div>
      </div>

      {/* Main Grid: 3 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
        
        {/* Column 1: Lesson Catalog (4/12) */}
        <div className="lg:col-span-4 bg-zinc-900/20 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 shadow-2xl flex flex-col h-[720px]">
          <h3 className="text-sm font-extrabold text-indigo-400 uppercase tracking-widest border-b border-zinc-900 pb-3 mb-4 flex items-center justify-between">
            <span>1. Lesson Library</span>
            <span className="text-[10px] text-zinc-500 font-mono font-normal">
              {filteredLessons.length} sets
            </span>
          </h3>

          {/* Search bar */}
          <div className="flex gap-2 bg-zinc-900/50 border border-zinc-850 rounded-xl px-3 py-2 items-center mb-4">
            <Search className="text-zinc-500" size={16} />
            <input
              type="text"
              placeholder="Search lessons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none flex-1 text-xs text-zinc-200 placeholder-zinc-500"
            />
          </div>

          {/* Textbook tabs/categories */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 no-scrollbar">
            {(['All', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'JHS', 'Custom'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => {
                  audioService.sounds.navHover();
                  setActiveCategory(cat);
                }}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase border transition-all cursor-pointer flex-shrink-0 ${
                  activeCategory === cat
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-zinc-900 border-zinc-850 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Lessons list */}
          <div className="flex-1 overflow-y-auto space-y-2.5 mb-4 pr-2 scrollbar-thin scrollbar-thumb-zinc-500 scrollbar-track-white/5 hover:scrollbar-thumb-zinc-400">
            {filteredLessons.map(lesson => {
              const isSelected = state.activeLesson?.id === lesson.id;
              const isCustom = lesson.id.startsWith('custom') || lesson.tags?.includes('Custom');
              
              // logic for disabling lessons when a special activity has a fixed lesson
              const fixedLessonId = ACTIVITY_FIXED_LESSONS[state.activeQuestionnaireId];
              const isDisabledByActivity = !!fixedLessonId && lesson.id !== fixedLessonId;

              return (
                <div
                  key={lesson.id}
                  onClick={() => {
                    if (isDisabledByActivity) {
                      audioService.sounds.wrong(); // Play a sound indicating it's disabled
                      floatText(`Lesson fixed for ${state.activeQuestionnaireId.replace('-', ' ')} activity.`, "#ef4444"); // Provide feedback
                      return;
                    }
                    audioService.sounds.navSelect();
                    setActiveLesson(lesson);
                    // Load preset if available
                    if (lesson.preset) {
                      if (lesson.preset.questionnaire) setActiveQuestionnaireId(lesson.preset.questionnaire as QuestionnaireType);
                      if (lesson.preset.game) setActiveGameId(lesson.preset.game as GameType);
                    }
                  }}
                  className={`p-4 border rounded-2xl transition-all duration-150 relative group ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-900/10 shadow-lg shadow-indigo-500/5'
                      : 'border-zinc-900 bg-zinc-950/40 hover:border-zinc-800'
                  } ${isDisabledByActivity ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} // Add disabled styling
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="font-bold text-sm text-zinc-100 group-hover:text-white transition-colors">
                      {lesson.name}
                    </div>
                    {isCustom && (
                      <div className="flex gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleEditLesson(lesson, e)}
                          className="p-1 hover:bg-zinc-900 text-zinc-400 hover:text-indigo-400 rounded transition-colors"
                          title="Edit Custom Lesson"
                        >
                          <Edit size={13} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteLesson(lesson.id, e)}
                          className="p-1 hover:bg-red-950/20 text-zinc-400 hover:text-red-400 rounded transition-colors"
                          title="Delete Custom Lesson"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {lesson.tags?.slice(0, 3).map(tag => (
                      <span key={tag} className="text-[9px] bg-zinc-900 text-zinc-400 px-1.5 py-0.5 rounded font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-zinc-900/40 text-[10px] text-zinc-500 font-bold">
                    <span>{lesson.questions.length} CARDS</span>
                    {lesson.preset && (
                      <span className="text-pink-400 bg-pink-950/30 border border-pink-900/50 px-1.5 py-0.5 rounded">
                        🚀 SPECIAL PRESET
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            
            {filteredLessons.length === 0 && (
              <div className="text-center text-zinc-600 text-xs font-semibold py-8 uppercase tracking-widest border border-dashed border-zinc-900 rounded-2xl">
                No lessons found
              </div>
            )}
          </div>

          {/* Action buttons at bottom */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-900">
            <button
              onClick={handleCreateLesson}
              className="py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-750 text-indigo-400 hover:text-indigo-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Plus size={14} /> NEW LESSON
            </button>
            
            <label className="py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-750 text-indigo-400 hover:text-indigo-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors text-center">
              <Upload size={14} /> IMPORT CSV
              <input
                type="file"
                accept=".csv"
                onChange={handleImportCSV}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Column 2: Session Configuration Stage (8/12) */}
        <div className="lg:col-span-8 h-[720px] flex flex-col gap-6">
          <div className="bg-zinc-900/20 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl flex-1 flex flex-col">
            <h3 className="text-xl font-black text-indigo-400 uppercase tracking-tighter border-b border-zinc-900 pb-5 mb-8 flex items-center gap-3">
              <Sparkles size={24} className="text-yellow-400" />
              Session Configuration Stage
            </h3>

            {/* Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-500">
              
              {/* Activity Card */}
              <div
                onClick={() => {
                  audioService.sounds.navSelect();
                  setIsActivityModalOpen(true);
                }}
                className="group relative p-8 bg-white/5 hover:bg-white/10 border border-white/10 rounded-3xl transition-all cursor-pointer shadow-xl overflow-hidden"
              >
                <div className="absolute top-4 right-6 text-[10px] text-zinc-600 font-black tracking-widest font-mono">STEP 2</div>
                <div className="flex items-center gap-5 mb-4">
                  <div className="w-14 h-14 bg-yellow-500/10 rounded-2xl flex items-center justify-center text-yellow-400 border border-yellow-500/20 group-hover:scale-110 transition-transform">
                    <ClipboardList size={28} />
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 font-black uppercase tracking-widest mb-1">Activity Mode</div>
                    <div className="text-2xl font-black text-white group-hover:text-yellow-400 transition-colors uppercase tracking-tight">
                      {state.activeQuestionnaireId.replace('-', ' ')}
                    </div> 
                  </div>
                </div>
                <div className="text-xs text-zinc-400 leading-relaxed font-medium">Click to change how questions are presented to the class.</div>
              </div>

              {/* Game Card */}
              <div
                onClick={() => {
                  audioService.sounds.navSelect();
                  setIsGameModalOpen(true);
                }}
                className="group relative p-8 bg-white/5 hover:bg-white/10 border border-white/10 rounded-3xl transition-all cursor-pointer shadow-xl overflow-hidden"
              >
                <div className="absolute top-4 right-6 text-[10px] text-zinc-600 font-black tracking-widest font-mono">STEP 3</div>
                <div className="flex items-center gap-5 mb-4">
                  <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 border border-purple-500/20 group-hover:scale-110 transition-transform">
                    <Dices size={28} />
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 font-black uppercase tracking-widest mb-1">Game Mode</div>
                    <div className="text-2xl font-black text-white group-hover:text-purple-400 transition-colors uppercase tracking-tight">
                      {state.isStudyMode ? 'STUDY MODE' : (state.activeGameId?.replace('-', ' ') || 'NONE')}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-zinc-400 leading-relaxed font-medium">Configure the reward system or interactive mini-game mechanics.</div>
              </div>

              {/* Team Card */}
              <div
                onClick={() => {
                  if (state.isStudyMode) return;
                  audioService.sounds.navSelect();
                  setIsTeamModalOpen(true);
                }}
                className={`group relative p-8 bg-white/5 border border-white/10 rounded-3xl transition-all shadow-xl overflow-hidden ${
                  state.isStudyMode ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/10 cursor-pointer'
                }`}
              >
                <div className="absolute top-4 right-6 text-[10px] text-zinc-600 font-black tracking-widest font-mono">STEP 4</div>
                <div className="flex items-center gap-5 mb-4">
                  <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition-transform">
                    <Users size={28} />
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 font-black uppercase tracking-widest mb-1">Team Roster</div>
                    <div className="text-2xl font-black text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">
                      {state.isStudyMode ? '1 PLAYER' : `${teamCount} TEAMS`}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-zinc-400 leading-relaxed font-medium">
                  {state.isStudyMode ? 'Disabled in Study Mode' : <span>Starts with: <span className="text-white">{teamNames[startingTeamIndex]}</span></span>}
                </div>
              </div>

              {/* Presets Card */}
              <div
                onClick={() => {
                  audioService.sounds.navSelect();
                  setIsPresetModalOpen(true);
                }}
                className="group relative p-8 bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/20 rounded-3xl transition-all cursor-pointer shadow-xl overflow-hidden"
              >
                <div className="absolute top-4 right-6 text-[10px] text-indigo-600 font-black tracking-widest font-mono">EXPRESS</div>
                <div className="flex items-center gap-5 mb-4">
                  <div className="w-14 h-14 bg-pink-500/10 rounded-2xl flex items-center justify-center text-pink-400 border border-pink-500/20 group-hover:scale-110 transition-transform">
                    <Sparkles size={28} />
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 font-black uppercase tracking-widest mb-1">Quick Presets</div>
                    <div className="text-2xl font-black text-white group-hover:text-pink-400 transition-colors uppercase tracking-tight">
                      LOAD SETUP
                    </div>
                  </div>
                </div>
                <div className="text-xs text-zinc-400 leading-relaxed font-medium">Instantly apply a curated activity and game combination.</div>
              </div>
            </div>

            <div className="mt-auto space-y-6">
              {/* Compatibility Banner */}
              <div className="pt-6 border-t border-white/5">
                {compResult.compatible && !compResult.isWarning ? (
                  <div className="p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-start gap-4 text-emerald-400">
                    <Check size={20} className="mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-black text-sm uppercase tracking-wider">✓ Configuration Ready</div>
                      <div className="text-[11px] text-emerald-500/80 font-bold mt-0.5 uppercase tracking-widest">Selected lesson and game logic match perfectly!</div>
                    </div>
                  </div>
                ) : compResult.isWarning ? (
                  <div className="p-5 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl flex items-start gap-4 text-yellow-400 animate-pulse">
                    <AlertTriangle size={20} className="mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-black text-sm uppercase tracking-wider">⚠️ Compatibility Warning</div>
                      <div className="text-[11px] text-yellow-500/80 font-bold mt-0.5 uppercase tracking-widest">{compResult.reason}</div>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 bg-red-500/5 border border-red-500/20 rounded-2xl flex items-start gap-4 text-red-400">
                    <ShieldAlert size={20} className="mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-black text-sm uppercase tracking-wider">✗ Configuration Error</div>
                      <div className="text-[11px] text-red-500/80 font-bold mt-0.5 uppercase tracking-widest">{compResult.reason}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Launch Panel */}
              <div className="pt-2">
                <button
                  onClick={handleLaunch}
                  disabled={!state.activeLesson || (!compResult.compatible && !compResult.isWarning)}
                  className="w-full py-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-650 hover:scale-[1.01] disabled:opacity-40 disabled:hover:scale-100 text-white rounded-[1.5rem] text-xl font-black tracking-[0.2em] flex items-center justify-center gap-4 shadow-2xl shadow-indigo-600/20 cursor-pointer active:scale-[0.99] transition-all uppercase"
                >
                  <Play size={24} fill="currentColor" /> Launch Session
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lesson Editor Modal overlay */}
      <LessonEditorModal
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingLesson(null);
        }}
        onSaved={loadLessons}
        editingLesson={editingLesson}
      />

      <ActivityModal 
        isOpen={isActivityModalOpen} 
        onClose={() => setIsActivityModalOpen(false)} 
        onSelect={handleActivitySelect} 
      />

      <GameModal 
        isOpen={isGameModalOpen} 
        onClose={() => setIsGameModalOpen(false)} 
        onSelect={(id) => {
          handleGameSelect(id);
          setIsGameModalOpen(false);
        }} 
      />

      <TeamModal 
        isOpen={isTeamModalOpen} 
        onClose={() => setIsTeamModalOpen(false)}
        teamCount={teamCount}
        setTeamCount={setTeamCount}
        teamNames={teamNames}
        setTeamNames={setTeamNames}
        startingTeamIndex={startingTeamIndex}
        setStartingTeamIndex={setStartingTeamIndex}
      />

      <PresetModal 
        isOpen={isPresetModalOpen} 
        onClose={() => setIsPresetModalOpen(false)} 
        onLoadPreset={loadPreset} 
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

    </div>
  );
};
