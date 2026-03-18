import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, CheckCircle2, XCircle, ChevronRight,
  Trophy, Star, Loader2, RotateCcw, BookOpen, Zap
} from 'lucide-react'
import api from '@/lib/api'
import type { QuizQuestion, QuizResult } from '@/types'

type Phase = 'loading' | 'quiz' | 'review' | 'results'

export default function QuizPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [phase, setPhase] = useState<Phase>('loading')
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [answers, setAnswers] = useState<{ question_id: number; answer: string }[]>([])
  const [result, setResult] = useState<QuizResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [lessonTitle, setLessonTitle] = useState('')
  const startTime = useRef(Date.now())

  useEffect(() => {
    Promise.all([
      api.get(`/lessons/${id}/questions`),
      api.get(`/lessons/${id}`)
    ]).then(([qRes, lRes]) => {
      setQuestions(qRes.data)
      setLessonTitle(lRes.data.title)
      setPhase('quiz')
    }).catch(() => navigate('/dashboard'))
  }, [id, navigate])

  const handleSelect = (opt: string) => {
    if (selected !== null) return
    setSelected(opt)
  }

  const handleNext = () => {
    if (!selected) return
    const newAnswers = [...answers, { question_id: questions[current].id, answer: selected }]
    setAnswers(newAnswers)
    setSelected(null)

    if (current + 1 < questions.length) {
      setCurrent(current + 1)
    } else {
      submitQuiz(newAnswers)
    }
  }

  const submitQuiz = async (finalAnswers: typeof answers) => {
    setSubmitting(true)
    try {
      const timeTaken = Math.round((Date.now() - startTime.current) / 1000)
      const { data } = await api.post('/quiz/submit', {
        lesson_id: Number(id),
        attempt_type: 'lesson',
        answers: finalAnswers,
        time_taken_seconds: timeTaken,
      })
      setResult(data)
      setPhase('results')
    } catch (err) {
      console.error(err)
      navigate('/dashboard')
    } finally {
      setSubmitting(false)
    }
  }

  const restart = () => {
    setCurrent(0)
    setSelected(null)
    setAnswers([])
    setResult(null)
    startTime.current = Date.now()
    setPhase('quiz')
  }

  if (phase === 'loading' || submitting) {
    return (
      <div className="min-h-screen mesh-bg flex items-center justify-center flex-col gap-4">
        <Loader2 className="w-10 h-10 text-brand-400 animate-spin" />
        <p className="text-slate-400 font-hindi">{submitting ? 'Checking ...' : 'Loading questions ...'}</p>
      </div>
    )
  }

  if (phase === 'results' && result) {
    const pct = result.score
    const passed = result.passed
    return (
      <div className="min-h-screen mesh-bg flex items-center justify-center px-4 py-8">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg">
          {/* Score card */}
          <div className={`card p-8 text-center mb-4 ${passed ? 'border-emerald-500/20' : 'border-saffron-500/20'}`}>
            <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-display font-bold
              ${passed ? 'bg-emerald-500/15 text-emerald-400' : 'bg-saffron-500/15 text-saffron-400'}`}>
              {pct.toFixed(0)}%
            </div>
            <h2 className="text-2xl font-display font-bold text-white mb-1">
              {pct >= 90 ? 'Excellent! 🎉' : pct >= 70 ? 'Great! 👏' : 'Keep trying! 💪'}
            </h2>
            <p className="text-slate-400 text-sm">{result.correct_answers}/{result.total_questions} correct</p>

            {passed && (
              <div className="flex items-center justify-center gap-2 mt-3 text-brand-400">
                <Star className="w-4 h-4" />
                <span className="font-semibold text-sm">+{result.xp_earned} XP earned!</span>
              </div>
            )}

            <div className="mt-5 p-4 bg-white/[0.03] rounded-xl text-sm text-slate-300 text-left">
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-saffron-400 flex-shrink-0 mt-0.5" />
                <p>{result.ai_feedback}</p>
              </div>
            </div>
          </div>

          {/* Detailed answers */}
          <div className="card p-5 mb-4">
            <h3 className="font-display font-semibold text-white mb-4">Answer Review</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {result.detailed_answers.map((ans, i) => (
                <div key={i} className={`p-3 rounded-xl border text-sm
                  ${ans.is_correct ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                  <div className="flex items-start gap-2">
                    {ans.is_correct
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />}
                    <div className="flex-1">
                      <div className="text-white font-medium">{questions.find(q => q.id === ans.question_id)?.question_text}</div>
                      <div className="mt-1 text-xs text-slate-400">
                        Your answer: <span className={ans.is_correct ? 'text-emerald-400' : 'text-red-400'}>{ans.user_answer || '(none)'}</span>
                        {!ans.is_correct && <> · Correct: <span className="text-emerald-400">{ans.correct_answer}</span></>}
                      </div>
                      {!ans.is_correct && ans.ai_correction && (
                        <div className="mt-2 p-2 bg-white/[0.04] rounded-lg text-xs text-slate-300">
                          💡 {ans.ai_correction}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={restart} className="btn-secondary flex-1 flex items-center justify-center gap-2">
              <RotateCcw className="w-4 h-4" /> Retry
            </button>
            <button onClick={() => navigate(`/lesson/${id}`)} className="btn-secondary flex-1 flex items-center justify-center gap-2">
              <BookOpen className="w-4 h-4" /> Review Lesson
            </button>
            <button onClick={() => navigate('/dashboard')} className="btn-primary flex-1 flex items-center justify-center gap-2">
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  const q = questions[current]
  if (!q) return null
  const progress = ((current) / questions.length) * 100

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-xl">
        {/* Top bar */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(`/lesson/${id}`)}
            className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>Question {current + 1} of {questions.length}</span>
              <span>{lessonTitle}</span>
            </div>
            <div className="progress-bar">
              <motion.div className="progress-fill bg-gradient-to-r from-brand-500 to-brand-400"
                animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={current}
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}>
            <div className="card p-6 mb-4">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-500/10 text-brand-400 text-xs font-semibold mb-4">
                {q.question_type === 'translate' ? '🔄 Translate' : q.question_type === 'fill_blank' ? '✏️ Fill in the blank' : '❓ Choose the correct answer'}
              </div>
              <h2 className="text-lg font-display font-semibold text-white mb-1">{q.question_text}</h2>
              {q.question_hindi && q.question_hindi !== q.question_text && (
                <p className="text-slate-400 text-sm font-hindi">{q.question_hindi}</p>
              )}
            </div>

            {/* Options */}
            <div className="space-y-2.5 mb-6">
              {q.options?.map((opt, i) => {
                const isSelected = selected === opt
                const label = ['A', 'B', 'C', 'D'][i]
                return (
                  <motion.button key={opt} onClick={() => handleSelect(opt)}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full p-4 rounded-xl border text-left transition-all duration-200 flex items-center gap-3
                      ${isSelected
                        ? 'bg-brand-500/15 border-brand-500/40 text-white'
                        : 'bg-white/[0.04] border-white/[0.08] text-slate-300 hover:bg-white/[0.07] hover:border-white/[0.15] hover:text-white'
                      }`}>
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-display flex-shrink-0
                      ${isSelected ? 'bg-brand-500 text-white' : 'bg-white/[0.06] text-slate-500'}`}>
                      {label}
                    </span>
                    <span className="text-sm font-medium">{opt}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-brand-400 ml-auto flex-shrink-0" />}
                  </motion.button>
                )
              })}
            </div>

            <button onClick={handleNext} disabled={!selected}
              className="btn-primary w-full flex items-center justify-center gap-2 py-4">
              {current + 1 === questions.length ? (
                <><Trophy className="w-4 h-4" /> Submit Quiz</>
              ) : (
                <>Next <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
