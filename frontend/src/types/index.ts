export interface User {
  id: number
  name: string
  email: string
  native_language: string
  target_language: string
  current_streak: number
  total_xp: number
  created_at: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

export interface Lesson {
  id: number
  title: string
  title_hindi: string | null
  description: string | null
  level: number
  order_index: number
  category: string
  content: LessonContent | null
  is_generated: boolean
  status: 'not_started' | 'in_progress' | 'completed' | 'mastered'
  score: number
  xp_earned: number
}

export interface LessonContent {
  title: string
  title_native: string
  description: string
  learning_objectives: string[]
  vocabulary: VocabItem[]
  grammar_points: GrammarPoint[]
  dialogue: DialogueLine[]
  summary: string
  tips: string[]
}

export interface VocabItem {
  word: string
  translation: string
  pronunciation: string
  example_sentence: string
  example_translation: string
}

export interface GrammarPoint {
  rule: string
  explanation_native: string
  examples: { english: string; native: string }[]
}

export interface DialogueLine {
  speaker: string
  english: string
  native: string
  note?: string
}

export interface QuizQuestion {
  id: number
  question_text: string
  question_hindi: string | null
  question_type: 'mcq' | 'translate' | 'fill_blank'
  options: string[] | null
}

export interface AnswerFeedback {
  question_id: number
  is_correct: boolean
  correct_answer: string
  explanation: string
  explanation_hindi: string
  user_answer: string
  ai_correction: string | null
}

export interface QuizResult {
  score: number
  correct_answers: number
  total_questions: number
  passed: boolean
  xp_earned: number
  ai_feedback: string
  detailed_answers: AnswerFeedback[]
}

export interface Stats {
  total_xp: number
  current_streak: number
  completed_lessons: number
  total_lessons: number
  avg_score: number
  recent_attempts: {
    lesson_id: number
    score: number
    correct: number
    total: number
    date: string
  }[]
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}
