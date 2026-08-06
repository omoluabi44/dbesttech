export interface Subject {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string | null;
  applicable_levels: string[];
  unlocked_difficulties?: string[];
}

export interface Topic {
  id: number;
  name: string;
  level: string;
  description: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface QuizQuestion {
  id: string;
  questionText: string;
  questionType: string;
  correct_answer: string;
  incorrect_answers: string[];
  explanation: string;
}

export interface PracticeSession {
  id: number;
  subject_name: string;
  level: string;
  current_stage: number;
  status: string;
  stage_1_score: number | null;
  stage_2_score: number | null;
  stage_3_score: number | null;
  stage_4_score: number | null;
  stage_5_score: number | null;
  score_percentage: number;
}

export interface PracticeStartResponse {
  session: PracticeSession;
  questions: QuizQuestion[];
}

export interface PracticeStageSubmitResponse {
  session: PracticeSession;
  stage_score: number;
  next_questions?: QuizQuestion[];
  requires_upgrade?: boolean;
}

export interface PastQuestionSession {
  id: number;
  subject_name: string;
  exam_body_display: string;
  year: string;
  status: string;
  score_percentage: number;
  total_questions: number;
  correct_answers: number;
}

export interface PastQuestionFilters {
  exam_bodies: string[];
  years: string[];
}

export interface PastQuestionStartResponse {
  session: PastQuestionSession;
  questions: QuizQuestion[];
}

export interface PastQuestionAnswerReview {
  id: number;
  question: QuizQuestion;
  selected_answer: string;
  is_correct: boolean;
}

