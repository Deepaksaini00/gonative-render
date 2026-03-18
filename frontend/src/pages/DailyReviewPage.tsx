import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, CheckCircle2, XCircle, ChevronRight,
  Sun, Loader2, RotateCcw, Zap, Star
} from 'lucide-react'
import api from '@/lib/api'

interface ReviewQuestion {
  question_text: string
  question_hindi: string
  question_type: string
  options: string[]
  correct_answer: string
  explanation: string
  explanation_hindi: string
}

type Phase = 'loading' | 'quiz' | 'feedback' | 'done'

export default function DailyReviewPage() {
  const navigate = useNavigate()
  const [questions, setQuestions] = useState<ReviewQuestion[]>([])
  const [phase, setPhase] = useState<Phase>('loading')
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [score, setScore] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/quiz/daily-review/full')
      .then(r => { setQuestions(r.data.questions); setPhase('quiz') })
      .catch(err => {
        setError(err.response?.data?.detail || 'No completed lessons found yet. Complete at least one lesson first!')
        setPhase('done')
      })
  }, [])

  const q = questions[current]
  const isCorrect = selected === q?.correct_answer

  const handleSelect = (opt: string) => {
    if (showFeedback) return
    setSelected(opt)
    setShowFeedback(true)
    if (opt === q.correct_answer) setScore(s => s + 1)
  }

  const handleNext = () => {
    setShowFeedback(false)
    setSelected(null)
    if (current + 1 >= questions.length) { setPhase('done'); return }
    setCurrent(c => c + 1)
  }

  if (phase === 'loading') return (
    <div className="min-h-screen mesh-bg flex items-center justify-center flex-col gap-4">
      <Loader2 className="w-10 h-10 text-saffron-400 animate-spin" />
      <p className="text-slate-400 font-hindi">Today's questions are being prepared...</p>
    </div>
  )

  if (phase === 'done') return (
    <div className="min-h-screen mesh-bg flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md text-center">
        {error ? (
          <div className="card p-8">
            <Sun className="w-14 h-14 text-saffron-400 mx-auto mb-4" />
            <h2 className="text-xl font-display font-bold text-white mb-2">No lessons completed yet</h2>
            <p className="text-slate-400 text-sm mb-6">{error}</p>
            <button onClick={() => navigate('/dashboard')} className="btn-primary w-full">Go to Lessons</button>
          </div>
        ) : (
          <div className="card p-8">
            <div className="w-20 h-20 rounded-full bg-saffron-500/15 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-display font-bold text-saffron-400">{score}/{questions.length}</span>
            </div>
            <h2 className="text-2xl font-display font-bold text-white mb-1">
              {score === questions.length ? 'Perfect! 🎉' : score >= questions.length * 0.6 ? 'Well done! 👏' : 'Keep going! 💪'}
            </h2>
            <p className="text-slate-400 text-sm mb-2">Daily review complete</p>
            {score > 0 && (
              <div className="flex items-center justify-center gap-1.5 text-brand-400 text-sm mb-6">
                <Star className="w-4 h-4" />+{score * 10} XP
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => { setCurrent(0); setScore(0); setSelected(null); setShowFeedback(false); setPhase('loading');
                api.get('/quiz/daily-review/full').then(r => { setQuestions(r.data.questions); setPhase('quiz') }) }}
                className="btn-secondary flex-1 flex items-center justify-center gap-2">
                <RotateCcw className="w-4 h-4" /> Again
              </button>
              <button onClick={() => navigate('/dashboard')} className="btn-primary flex-1 flex items-center justify-center gap-2">
                Dashboard <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )

  if (!q) return null
  const progress = (current / questions.length) * 100

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/dashboard')}
            className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <div className="flex items-center gap-1.5 text-saffron-400 font-semibold">
                <Sun className="w-3.5 h-3.5" /> Daily Review
              </div>
              <span>{current + 1} / {questions.length}</span>
            </div>
            <div className="progress-bar">
              <motion.div className="progress-fill bg-gradient-to-r from-saffron-500 to-saffron-400"
                animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={current}
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}>

            <div className="card p-6 mb-4">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-saffron-500/10 text-saffron-400 text-xs font-semibold mb-4">
                🌅 Revision Question
              </div>
              <h2 className="text-lg font-display font-semibold text-white mb-1">{q.question_text}</h2>
              {q.question_hindi && q.question_hindi !== q.question_text && (
                <p className="text-slate-400 text-sm font-hindi">{q.question_hindi}</p>
              )}
            </div>

            <div className="space-y-2.5 mb-4">
              {q.options?.map((opt, i) => {
                const label = ['A', 'B', 'C', 'D'][i]
                const isSelected = selected === opt
                const isRight = showFeedback && opt === q.correct_answer
                const isWrong = showFeedback && isSelected && !isCorrect
                return (
                  <motion.button key={opt} onClick={() => handleSelect(opt)}
                    whileTap={!showFeedback ? { scale: 0.98 } : {}}
                    className={`w-full p-4 rounded-xl border text-left transition-all duration-200 flex items-center gap-3
                      ${isRight ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                        : isWrong ? 'bg-red-500/10 border-red-500/30 text-white'
                        : isSelected ? 'bg-saffron-500/10 border-saffron-500/30 text-white'
                        : 'bg-white/[0.04] border-white/[0.08] text-slate-300 hover:bg-white/[0.07] hover:text-white'
                      } ${showFeedback ? 'cursor-default' : 'cursor-pointer'}`}>
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0
                      ${isRight ? 'bg-emerald-500 text-white'
                        : isWrong ? 'bg-red-500 text-white'
                        : isSelected ? 'bg-saffron-500 text-white'
                        : 'bg-white/[0.06] text-slate-500'}`}>{label}</span>
                    <span className="text-sm font-medium">{opt}</span>
                    <span className="ml-auto">
                      {isRight && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      {isWrong && <XCircle className="w-4 h-4 text-red-400" />}
                    </span>
                  </motion.button>
                )
              })}
            </div>

            {/* Feedback */}
            <AnimatePresence>
              {showFeedback && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl border mb-4 ${isCorrect ? 'bg-emerald-500/8 border-emerald-500/20' : 'bg-red-500/8 border-red-500/20'}`}>
                  <div className="flex items-start gap-2 mb-2">
                    {isCorrect
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />}
                    <span className={`text-sm font-semibold ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isCorrect ? 'Right answer! ✓' : `Wrong answer - right: ${q.correct_answer}`}
                    </span>
                  </div>
                  <p className="text-slate-300 text-sm ml-6">{q.explanation}</p>
                  {q.explanation_hindi && (
                    <p className="text-slate-400 text-xs font-hindi ml-6 mt-1">{q.explanation_hindi}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {showFeedback && (
              <button onClick={handleNext} className="btn-primary w-full flex items-center justify-center gap-2 py-4">
                {current + 1 >= questions.length
                  ? <><Zap className="w-4 h-4" /> See Results</>
                  : <>Next Question <ChevronRight className="w-4 h-4" /></>}
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
