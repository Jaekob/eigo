import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { FlashcardActivity } from './FlashcardActivity';
import { MultipleChoiceActivity } from './MultipleChoiceActivity';
import { WordScrambleActivity } from './WordScrambleActivity';
import { SequenceActivity } from './SequenceActivity';
import { HotSeatActivity } from './HotSeatActivity';
import { RollCallActivity } from './RollCallActivity';
import { BingoActivity } from './BingoActivity';
import { Question } from '../../types';

interface ActivitiesArenaProps {
  onQuestionResolved: (correct: boolean) => void;
}

/**
 * Manager component for all Activity Types.
 * Mirrors the GamesArena pattern.
 */
export const ActivitiesArena: React.FC<ActivitiesArenaProps> = ({ onQuestionResolved }) => {
  const { state, advanceTurn } = useGame();

  // Local queue tracking logic moved from QuestionnaireArena
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionsQueue, setQuestionsQueue] = useState<Question[]>([]);
  const [answeredCount, setAnsweredCount] = useState(0);

  useEffect(() => {
    if (!state.activeLesson || state.activeLesson.questions.length === 0) return;
    
    const baseQuestions = [...state.activeLesson.questions];
    const queue = state.randomizeQuestions 
      ? baseQuestions.sort(() => Math.random() - 0.5) 
      : baseQuestions;
    
    setQuestionsQueue(queue.slice(1));
    setCurrentQuestion(queue[0]);
    setAnsweredCount(1);
  }, [state.activeLesson, state.activeQuestionnaireId]);

  const handleNextQuestion = () => {
    if (questionsQueue.length === 0) {
      const baseQuestions = [...(state.activeLesson?.questions || [])];
      const refilled = state.randomizeQuestions 
        ? baseQuestions.sort(() => Math.random() - 0.5) 
        : baseQuestions;
      setQuestionsQueue(refilled.slice(1));
      setCurrentQuestion(refilled[0]);
    } else {
      setCurrentQuestion(questionsQueue[0]);
      setQuestionsQueue(questionsQueue.slice(1));
    }
    setAnsweredCount(prev => prev + 1);
  };

  const handleResolved = (correct: boolean) => {
    onQuestionResolved(correct);
    // Automated progression for simple types
    if (state.activeQuestionnaireId !== 'sequence' && state.activeQuestionnaireId !== 'roll-call') {
      setTimeout(handleNextQuestion, 1200);
    }
  };

  if (!currentQuestion) return null;

  // Map ActivityType to specific implementation
  const renderActivity = () => {
    switch (state.activeQuestionnaireId) {
      case 'flashcard':
        return <FlashcardActivity question={currentQuestion} count={answeredCount} />;
      case 'multiple-choice':
        return <MultipleChoiceActivity question={currentQuestion} onResolved={handleResolved} />;
      case 'word-scramble':
        return <WordScrambleActivity question={currentQuestion} onResolved={handleResolved} />;
      case 'sequence':
        return <SequenceActivity onResolved={handleResolved} onNext={handleNextQuestion} />;
      case 'hot-seat':
        return <HotSeatActivity question={currentQuestion} onResolved={handleResolved} />;
      case 'bingo':
        return <BingoActivity onResolved={handleResolved} />;
      case 'roll-call':
        return <RollCallActivity onQuestionResolved={handleResolved} />;
      default:
        return (
          <div className="text-zinc-500 font-bold uppercase animate-pulse">
            Unknown Activity Mode...
          </div>
        );
    }
  };

  // Grading buttons for oral activities (Flashcard, Hot Seat, Sequence)
  const showManualGrading = !['multiple-choice', 'word-scramble', 'roll-call', 'bingo'].includes(state.activeQuestionnaireId);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center min-h-0">
      <div className="flex-1 w-full flex items-center justify-center min-h-0">
        {renderActivity()}
      </div>

      {showManualGrading && (
        <div className="w-full border-t border-zinc-900/50 pt-5 mt-6 flex justify-between gap-4">
          <div className="flex gap-2">
            <button onClick={handleNextQuestion} className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 text-xs font-bold rounded-xl cursor-pointer">
              Skip Card
            </button>
            <button onClick={() => advanceTurn()} className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 text-xs font-bold rounded-xl cursor-pointer">
              Skip Team
            </button>
          </div>
          <div className="flex gap-3">
            <button onClick={() => handleResolved(false)} className="px-8 py-3 bg-red-650 hover:bg-red-550 text-white rounded-xl font-bold uppercase cursor-pointer">
              ✗ WRONG
            </button>
            <button onClick={() => handleResolved(true)} className="px-8 py-3 bg-emerald-650 hover:bg-emerald-550 text-white rounded-xl font-bold uppercase cursor-pointer">
              ✓ CORRECT
            </button>
          </div>
        </div>
      )}

      {!showManualGrading && !['roll-call', 'bingo'].includes(state.activeQuestionnaireId) && (
        <div className="w-full border-t border-zinc-900/30 pt-4 mt-6 flex justify-start gap-2">
          <button onClick={handleNextQuestion} className="px-4 py-2 bg-zinc-950 border border-zinc-900 text-zinc-500 text-[10px] font-bold rounded-lg cursor-pointer">Skip Card</button>
        </div>
      )}
    </div>
  );
};

export default ActivitiesArena;