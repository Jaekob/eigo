import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppState, Team, Lesson, QuestionnaireType, GameType, ActivityType } from '../types';
import { contentService, staticLessons } from '../services/contentService';
import { triggerWarp } from '../components/StarfieldBackground';

interface GameContextType {
  state: AppState;
  initTeams: (count: number, startIndex?: number, customNames?: string[]) => void;
  advanceTurn: () => void;
  addScore: (teamIndex: number, points: number) => void;
  setScore: (teamIndex: number, score: number) => void;
  swapScores: (idxA: number, idxB: number) => void;
  setSequenceLength: (length: number) => void;
  setUniqueQuestionsInSequence: (count: number) => void;
  setRandomizeQuestions: (enabled: boolean) => void;
  toggleBackFirst: (enabled?: boolean) => void;
  toggleStudyMode: (enabled: boolean) => void;
  setRollCallMinCount: (count: number) => void;
  setRollCallMaxCount: (count: number) => void;
  setRollCallDistractorCount: (count: number) => void;
  setActiveLesson: (lesson: Lesson | null) => void; // Changed type to ActivityType
  setActiveQuestionnaireId: (id: ActivityType) => void; // Changed type to ActivityType
  setActiveGameId: (id: GameType | null) => void;
  setLastQuestionCorrect: (correct: boolean) => void;
  setBombChance: (chance: number) => void;
  plantBomb: (teamIndex: number) => void;
  clearBomb: (teamIndex: number) => void;
  setShield: (teamIndex: number) => void;
  clearShield: (teamIndex: number) => void;
  addToPot: (points: number) => void;
  resetPot: () => void;
  lockSpin: () => void;
  unlockSpin: () => void;
  startRound: () => void;
  endGame: () => void;
  resetGame: () => void;
}

const defaultState: AppState = {
  teams: [],
  activeIndex: 0,
  pot: 0,
  roundActive: false,
  spinLocked: false,
  bombChance: 0,
  pendingBombTargets: {},
  shielded: {},
  lastQuestionCorrect: true,
  showBackFirst: false,
  randomizeQuestions: false,
  isStudyMode: true,
  gameEnded: false,
  activeLesson: staticLessons[0], // Default to the first static lesson
  activeQuestionnaireId: 'flashcard',
  activeGameId: null,
  sequenceLength: 5, // Default sequence length for memory sequence
  uniqueQuestionsInSequence: 3, // Default number of unique questions in sequence
  rollCallMinCount: 3,
  rollCallMaxCount: 10,
  rollCallDistractorCount: 0
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(defaultState);

  // Ensure a lesson is always active, default to the first static lesson if none is set
  useEffect(() => {
    if (!state.activeLesson) {
      setState(prev => ({ ...prev, activeLesson: staticLessons[0] }));
    }
  }, []);

  const initTeams = (count: number, startIndex = 0, customNames?: string[]) => {
    const newTeams: Team[] = Array.from({ length: count }, (_, i) => ({
      index: i,
      name: customNames && customNames[i] ? customNames[i] : `Team ${i + 1}`,
      score: 0,
      color: `hsl(${(i * 360) / count}, 85%, 60%)` // vibrant distinct team colors
    }));

    setState(prev => ({
      ...prev,
      teams: newTeams,
      activeIndex: startIndex % count,
      pot: 0,
      roundActive: false,
      spinLocked: false,
      gameEnded: false
    }));
  };

  const advanceTurn = () => {
    setState(prev => {
      if (prev.teams.length === 0) return prev;
      const nextIndex = (prev.activeIndex + 1) % prev.teams.length;
      return {
        ...prev,
        activeIndex: nextIndex,
        pot: 0,
        roundActive: false,
        spinLocked: false
      };
    });
    // Visual warp indicating forward scene slide
    triggerWarp(12, 160, -1);
  };

  const addScore = (teamIndex: number, points: number) => {
    setState(prev => {
      const updatedTeams = prev.teams.map((t, idx) =>
        idx === teamIndex ? { ...t, score: Math.max(0, t.score + points) } : t
      );
      return {
        ...prev,
        teams: updatedTeams
      };
    });
  };

  const setScore = (teamIndex: number, score: number) => {
    setState(prev => {
      const updatedTeams = prev.teams.map((t, idx) =>
        idx === teamIndex ? { ...t, score: Math.max(0, score) } : t
      );
      return {
        ...prev,
        teams: updatedTeams
      };
    });
  };

  const swapScores = (idxA: number, idxB: number) => {
    setState(prev => {
      if (!prev.teams[idxA] || !prev.teams[idxB]) return prev;
      const scoreA = prev.teams[idxA].score;
      const scoreB = prev.teams[idxB].score;

      const updatedTeams = prev.teams.map((t, idx) => {
        if (idx === idxA) return { ...t, score: scoreB };
        if (idx === idxB) return { ...t, score: scoreA };
        return t;
      });

      return {
        ...prev,
        teams: updatedTeams
      };
    });
  };

  const setSequenceLength = (length: number) => {
    setState(prev => ({ ...prev, sequenceLength: length }));
  };

  const setUniqueQuestionsInSequence = (count: number) => {
    setState(prev => ({ ...prev, uniqueQuestionsInSequence: count }));
  };

  const setRandomizeQuestions = (enabled: boolean) => {
    setState(prev => ({ ...prev, randomizeQuestions: enabled }));
  };

  const toggleBackFirst = (enabled?: boolean) => {
    setState(prev => ({ ...prev, showBackFirst: enabled !== undefined ? enabled : !prev.showBackFirst }));
  };

  const toggleStudyMode = (enabled: boolean) => {
    setState(prev => ({ ...prev, isStudyMode: enabled }));
  };

  const setRollCallMinCount = (count: number) => {
    setState(prev => ({ ...prev, rollCallMinCount: isNaN(count) ? 3 : count }));
  };

  const setRollCallMaxCount = (count: number) => {
    setState(prev => ({ ...prev, rollCallMaxCount: isNaN(count) ? 10 : count }));
  };

  const setRollCallDistractorCount = (count: number) => {
    setState(prev => ({ ...prev, rollCallDistractorCount: isNaN(count) ? 0 : count }));
  };

  const setActiveLesson = (lesson: Lesson | null) => {
    setState(prev => ({ ...prev, activeLesson: lesson }));
  };

  const setActiveQuestionnaireId = (id: ActivityType) => {
    setState(prev => ({ ...prev, activeQuestionnaireId: id }));
  };

  const setActiveGameId = (id: GameType | null) => {
    setState(prev => ({ ...prev, activeGameId: id }));
  };

  const setLastQuestionCorrect = (correct: boolean) => {
    setState(prev => ({ ...prev, lastQuestionCorrect: correct }));
  };

  const setBombChance = (chance: number) => {
    setState(prev => ({ ...prev, bombChance: Math.min(90, Math.max(0, chance)) }));
  };

  const plantBomb = (teamIndex: number) => {
    setState(prev => ({
      ...prev,
      pendingBombTargets: { ...prev.pendingBombTargets, [teamIndex]: true }
    }));
  };

  const clearBomb = (teamIndex: number) => {
    setState(prev => {
      const updated = { ...prev.pendingBombTargets };
      delete updated[teamIndex];
      return {
        ...prev,
        pendingBombTargets: updated
      };
    });
  };

  const setShield = (teamIndex: number) => {
    setState(prev => ({
      ...prev,
      shielded: { ...prev.shielded, [teamIndex]: true }
    }));
  };

  const clearShield = (teamIndex: number) => {
    setState(prev => {
      const updated = { ...prev.shielded };
      delete updated[teamIndex];
      return {
        ...prev,
        shielded: updated
      };
    });
  };

  const addToPot = (points: number) => {
    setState(prev => ({ ...prev, pot: prev.pot + points }));
  };

  const resetPot = () => {
    setState(prev => ({ ...prev, pot: 0 }));
  };

  const lockSpin = () => {
    setState(prev => ({ ...prev, spinLocked: true }));
  };

  const unlockSpin = () => {
    setState(prev => ({ ...prev, spinLocked: false }));
  };

  const startRound = () => {
    setState(prev => ({
      ...prev,
      roundActive: true,
      spinLocked: false,
      pot: 0
    }));
  };

  const endGame = () => {
    // Clear persistent game states when the session is finalized
    const suffix = state.teams.map(t => t.name).join('_');
    localStorage.removeItem(`apollo_star_grid_board_${suffix}`);
    localStorage.removeItem(`apollo_galaxy_race_pos_${suffix}`);
    
    setState(prev => {
      if (prev.isStudyMode) {
        // In study mode, instead of showing standings, reset the game to go back to the dashboard
        return {
          ...defaultState,
          showBackFirst: prev.showBackFirst,
          randomizeQuestions: prev.randomizeQuestions,
          isStudyMode: prev.isStudyMode,
          activeLesson: prev.activeLesson,
          activeQuestionnaireId: prev.activeQuestionnaireId,
          activeGameId: prev.activeGameId,
          rollCallMinCount: prev.rollCallMinCount,
          rollCallMaxCount: prev.rollCallMaxCount,
          rollCallDistractorCount: prev.rollCallDistractorCount
        };
      } else {
        return { ...prev, gameEnded: true };
      }
    });
  };

  const resetGame = () => {
    // Ensure any existing progress for the current team set is wiped on reset
    const suffix = state.teams.map(t => t.name).join('_');
    localStorage.removeItem(`apollo_star_grid_board_${suffix}`);
    localStorage.removeItem(`apollo_galaxy_race_pos_${suffix}`);

    setState(prev => ({
      ...defaultState,
      showBackFirst: prev.showBackFirst,
      randomizeQuestions: prev.randomizeQuestions,
      isStudyMode: prev.isStudyMode,
      activeLesson: prev.activeLesson,
      activeQuestionnaireId: prev.activeQuestionnaireId,
      activeGameId: prev.activeGameId,
      rollCallMinCount: prev.rollCallMinCount,
      rollCallMaxCount: prev.rollCallMaxCount,
      rollCallDistractorCount: prev.rollCallDistractorCount
    }));
  };

  return (
    <GameContext.Provider value={{
      state,
      initTeams,
      advanceTurn,
      addScore,
      setScore,
      swapScores,
      setSequenceLength,
      setUniqueQuestionsInSequence,
      setRandomizeQuestions,
      toggleBackFirst,
      toggleStudyMode,
      setRollCallMinCount,
      setRollCallMaxCount,
      setRollCallDistractorCount,
      setActiveLesson,
      setActiveQuestionnaireId,
      setActiveGameId,
      setLastQuestionCorrect,
      setBombChance,
      plantBomb,
      clearBomb,
      setShield,
      clearShield,
      addToPot,
      resetPot,
      lockSpin,
      unlockSpin,
      startRound,
      endGame,
      resetGame
    }}>
      {children}
    </GameContext.Provider>
  );
};
