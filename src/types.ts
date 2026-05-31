/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type QuestionType = 'Flashcard' | 'MultipleChoice';

export interface Question {
  id: string;
  type: QuestionType;
  front: string; // Can represent text or light HTML (like inline styling for colors)
  back?: string;
  choices?: {
    A?: string;
    B?: string;
    C?: string;
    D?: string;
    [key: string]: string | undefined;
  };
  correct?: string;
  imageRef?: string;
  audioRef?: string;
  note?: string;
}

export interface Lesson {
  id: string;
  name: string;
  disabled?: boolean;
  tags?: string[];
  questions: Question[];
  preset?: {
    questionnaire?: QuestionnaireType;
    game?: GameType;
    sequenceLength?: number;
    uniqueQuestionsInSequence?: number;
    jumpTo?: string;
  };
}

export interface Team {
  index: number;
  name: string;
  score: number;
  color: string;
}

export type QuestionnaireType = 'flashcard' | 'multiple-choice' | 'sequence' | 'hot-seat' | 'word-scramble' | 'bingo';
export type ActivityType = QuestionnaireType | 'roll-call'; // New type for activities including roll-call
export type GameType = 
  | 'roulette-base' 
  | 'roulette-rachel' 
  | 'star-grid' 
  | 'space-exploration' 
  | 'pachinko' 
  | 'roll-call' 
  | 'galaxy-race'
  | 'debug';

export interface AppState {
  teams: Team[];
  activeIndex: number;
  pot: number;
  roundActive: boolean;
  spinLocked: boolean;
  bombChance: number;
  pendingBombTargets: { [teamIndex: number]: boolean };
  shielded: { [teamIndex: number]: boolean };
  lastQuestionCorrect: boolean;
  showBackFirst: boolean;
  randomizeQuestions: boolean;
  isStudyMode: boolean;
  gameEnded: boolean;
  activeLesson: Lesson | null;
  activeQuestionnaireId: ActivityType; // Use new ActivityType
  activeGameId: GameType | null; 
  sequenceLength: number; // For memory sequence game
  uniqueQuestionsInSequence: number; // For memory sequence game
  rollCallMinCount: number;
  rollCallMaxCount: number;
  rollCallDistractorCount: number;
}
