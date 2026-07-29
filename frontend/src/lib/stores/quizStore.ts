import { create } from 'zustand';
import { PracticeSession, PastQuestionSession, QuizQuestion } from '../types/quiz';

interface QuizState {
  currentSession: any | null;
  questions: any[];
  currentIndex: number;
  answers: Map<string, string>; // questionId -> selected_answer
  timeRemaining: number;
  
  // Practice session extensions
  practiceSession: PracticeSession | null;
  practiceQuestions: QuizQuestion[];
  
  // Past questions extensions
  pastSession: PastQuestionSession | null;
  pastQuestions: QuizQuestion[];
  pastCurrentIndex: number;
  pastAnswers: Map<string, string>;
  
  startSession: (session: any, questions: any[]) => void;
  startPractice: (session: PracticeSession, questions: QuizQuestion[]) => void;
  startPastQuiz: (session: PastQuestionSession, questions: QuizQuestion[]) => void;
  setPracticeStageQuestions: (questions: QuizQuestion[]) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  setAnswer: (questionId: string, answer: string) => void;
  setPastAnswer: (questionId: string, answer: string) => void;
  setPastCurrentIndex: (index: number) => void;
  decrementTime: () => void;
  resetQuiz: () => void;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  currentSession: null,
  questions: [],
  currentIndex: 0,
  answers: new Map(),
  timeRemaining: 0,

  practiceSession: null,
  practiceQuestions: [],

  pastSession: null,
  pastQuestions: [],
  pastCurrentIndex: 0,
  pastAnswers: new Map(),

  startSession: (session, questions) => {
    set({
      currentSession: session,
      questions,
      currentIndex: 0,
      answers: new Map(),
      timeRemaining: session.time_limit_seconds,
    });
  },

  startPractice: (session, questions) => {
    set({
      practiceSession: session,
      practiceQuestions: questions,
      currentIndex: 0,
      answers: new Map(),
    });
  },

  startPastQuiz: (session, questions) => {
    set({
      pastSession: session,
      pastQuestions: questions,
      pastCurrentIndex: 0,
      pastAnswers: new Map(),
    });
  },

  setPracticeStageQuestions: (questions) => {
    set({
      practiceQuestions: questions,
      currentIndex: 0,
    });
  },

  nextQuestion: () => {
    const { currentIndex, practiceQuestions, questions, practiceSession, pastSession, pastCurrentIndex, pastQuestions } = get();
    if (pastSession) {
      if (pastCurrentIndex < pastQuestions.length - 1) {
        set({ pastCurrentIndex: pastCurrentIndex + 1 });
      }
      return;
    }
    const len = practiceSession ? practiceQuestions.length : questions.length;
    if (currentIndex < len - 1) {
      set({ currentIndex: currentIndex + 1 });
    }
  },

  prevQuestion: () => {
    const { currentIndex, pastSession, pastCurrentIndex } = get();
    if (pastSession) {
      if (pastCurrentIndex > 0) {
        set({ pastCurrentIndex: pastCurrentIndex - 1 });
      }
      return;
    }
    if (currentIndex > 0) {
      set({ currentIndex: currentIndex - 1 });
    }
  },

  setAnswer: (questionId, answer) => {
    const { answers } = get();
    const newAnswers = new Map(answers);
    newAnswers.set(questionId, answer);
    set({ answers: newAnswers });
  },

  setPastAnswer: (questionId, answer) => {
    const { pastAnswers } = get();
    const newAnswers = new Map(pastAnswers);
    newAnswers.set(questionId, answer);
    set({ pastAnswers: newAnswers });
  },

  setPastCurrentIndex: (index: number) => {
    set({ pastCurrentIndex: index });
  },

  decrementTime: () => {
    const { timeRemaining } = get();
    if (timeRemaining > 0) {
      set({ timeRemaining: timeRemaining - 1 });
    }
  },

  resetQuiz: () => {
    set({
      currentSession: null,
      questions: [],
      currentIndex: 0,
      answers: new Map(),
      timeRemaining: 0,
      practiceSession: null,
      practiceQuestions: [],
      pastSession: null,
      pastQuestions: [],
      pastCurrentIndex: 0,
      pastAnswers: new Map(),
    });
  },
}));
