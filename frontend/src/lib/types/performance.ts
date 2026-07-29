export interface PerformanceSummary {
  id: number;
  subject_name: string;
  level: string;
  level_display: string;
  total_quizzes_taken: number;
  total_questions_attempted: number;
  total_correct_answers: number;
  average_score: number;
  best_score: number;
  accuracy_rate: number;
  total_time_spent_seconds: number;
  last_quiz_date: string | null;
}

export interface WeeklyProgress {
  id: number;
  week_start: string;
  quizzes_taken: number;
  total_questions: number;
  correct_answers: number;
  average_score: number;
  accuracy_rate: number;
  subjects_practiced: any;
}

export interface StrengthWeakness {
  id: number;
  topic_name: string;
  subject_name: string;
  total_attempts: number;
  correct_attempts: number;
  mastery_percentage: number;
  status: string;
}

export interface OverallPerformance {
  total_quizzes: number;
  total_questions: number;
  total_correct: number;
  overall_accuracy: number;
  overall_average_score: number;
  total_time_spent_seconds: number;
  subjects_count: number;
  strongest_subject: string | null;
  weakest_subject: string | null;
}
