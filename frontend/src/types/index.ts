import type { components } from '@/generated/api'

export type User = components['schemas']['UserOut']
export type AuthResponse = components['schemas']['TokenResponse']

type LessonStatus = 'not_started' | 'in_progress' | 'completed' | 'mastered'

type LessonFromApi = components['schemas']['LessonWithProgress']
export type Lesson = Omit<LessonFromApi, 'content' | 'status'> & {
  content: LessonContent | null
  status: LessonStatus
}
export type QuizQuestion = components['schemas']['QuizQuestionOut']
export type QuizResult = components['schemas']['QuizResult']
export type AnswerFeedback = components['schemas']['AnswerFeedback']
export type ChatMessage = components['schemas']['ChatMessage']

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
