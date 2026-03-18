import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BookOpen, ChevronRight, Flame, Star, Trophy,
  Loader2, Sparkles, Lock, CheckCircle2, Clock, RefreshCw
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'
import type { Lesson, Stats } from '@/types'
import { getLevelLabel, getLevelColor, getStatusColor, getStatusLabel, xpToLevel } from '@/lib/utils'

export default function DashboardPage() {
  const { user, refreshUser } = useAuthStore()
  const navigate = useNavigate()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [activeLevel, setActiveLevel] = useState(1)

  const loadData = useCallback(async () => {
    try {
      const [lessonsRes, statsRes] = await Promise.all([
        api.get('/lessons'),
        api.get('/progress/stats'),
      ])
      setLessons(lessonsRes.data)
      setStats(statsRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleSeed = async () => {
    setSeeding(true)
    try {
      await api.post('/lessons/seed')
      await loadData()
      await refreshUser()
    } catch (err) { console.error(err) }
    finally { setSeeding(false) }
  }

  const { level: userLevel, progress: xpProgress, nextLevelXp } = xpToLevel(user?.total_xp || 0)
  const leveledLessons = lessons.filter(l => l.level === activeLevel)
  const levels = [...new Set(lessons.map(l => l.level))].sort()

  const isLessonUnlocked = (lesson: Lesson, idx: number) => {
    if (idx === 0) return true
    const prev = leveledLessons[idx - 1]
    return prev?.status === 'completed' || prev?.status === 'mastered'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">
            Hello, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            {stats?.completed_lessons ? `${stats.completed_lessons} lessons completed — keep going!` : 'Your learning journey starts here.'}
          </p>
        </div>
        <button onClick={() => navigate('/daily-review')}
          className="flex items-center gap-2 btn-secondary text-sm py-2 px-4 whitespace-nowrap">
          <RefreshCw className="w-4 h-4" />
          <span className="hidden sm:inline">Daily Review</span>
        </button>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Flame, label: 'Streak', value: `${user?.current_streak || 0}d`, color: 'text-saffron-400', bg: 'bg-saffron-400/10' },
            { icon: Star, label: 'Total XP', value: user?.total_xp?.toLocaleString() || '0', color: 'text-brand-400', bg: 'bg-brand-400/10' },
            { icon: CheckCircle2, label: 'Completed', value: `${stats.completed_lessons}/${stats.total_lessons}`, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
            { icon: Trophy, label: 'Avg Score', value: `${stats.avg_score}%`, color: 'text-purple-400', bg: 'bg-purple-400/10' },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="card p-4">
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-2`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div className="text-white font-display font-bold text-lg leading-none">{value}</div>
              <div className="text-slate-500 text-xs mt-1">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* XP Level bar */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-500/20 flex items-center justify-center">
              <Star className="w-3.5 h-3.5 text-brand-400" />
            </div>
            <span className="text-white font-display font-semibold text-sm">Level {userLevel} Learner</span>
          </div>
          <span className="text-slate-400 text-xs">{nextLevelXp} XP to next level</span>
        </div>
        <div className="progress-bar">
          <motion.div className="progress-fill bg-gradient-to-r from-brand-500 to-brand-400"
            initial={{ width: 0 }} animate={{ width: `${xpProgress}%` }} transition={{ duration: 1, delay: 0.3 }} />
        </div>
      </div>

      {/* Lessons */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display font-semibold text-white">Lessons</h2>
          {lessons.length === 0 && (
            <button onClick={handleSeed} disabled={seeding}
              className="flex items-center gap-2 btn-saffron text-sm py-2 px-4">
              {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {seeding ? 'Generating...' : 'Generate Lessons'}
            </button>
          )}
        </div>

        {lessons.length === 0 ? (
          <div className="card p-10 text-center">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-300 font-semibold mb-2">No lessons yet</p>
            <p className="text-slate-500 text-sm font-hindi">Press "Generate Lessons" to start the lesson.</p>
          </div>
        ) : (
          <>
            {/* Level tabs */}
            {levels.length > 1 && (
              <div className="flex gap-2 mb-4">
                {levels.map(lvl => (
                  <button key={lvl} onClick={() => setActiveLevel(lvl)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200
                      ${activeLevel === lvl ? 'bg-brand-500 text-white' : 'bg-white/[0.05] text-slate-400 hover:text-white'}`}>
                    {getLevelLabel(lvl)}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-3">
              {leveledLessons.map((lesson, idx) => {
                const unlocked = isLessonUnlocked(lesson, idx)
                return (
                  <motion.div key={lesson.id}
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}>
                    <button
                      onClick={() => unlocked && navigate(`/lesson/${lesson.id}`)}
                      disabled={!unlocked}
                      className={`w-full text-left card p-4 transition-all duration-200 group
                        ${unlocked ? 'hover:bg-[var(--bg-card-hover)] hover:border-white/[0.12] cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Status icon */}
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0
                          ${lesson.status === 'completed' || lesson.status === 'mastered'
                            ? 'bg-emerald-500/15 border border-emerald-500/25'
                            : lesson.status === 'in_progress'
                            ? 'bg-saffron-500/15 border border-saffron-500/25'
                            : unlocked ? 'bg-brand-500/15 border border-brand-500/25' : 'bg-white/[0.05] border border-white/[0.08]'}`}>
                          {!unlocked
                            ? <Lock className="w-4 h-4 text-slate-600" />
                            : lesson.status === 'completed' || lesson.status === 'mastered'
                            ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            : lesson.status === 'in_progress'
                            ? <Clock className="w-4 h-4 text-saffron-400" />
                            : <span className="text-brand-400 font-display font-bold text-sm">{idx + 1}</span>}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-white font-semibold text-sm group-hover:text-brand-300 transition-colors">{lesson.title}</span>
                            <span className={`badge text-xs ${getLevelColor(lesson.level)}`}>{getLevelLabel(lesson.level)}</span>
                          </div>
                          {lesson.title_hindi && (
                            <div className="text-slate-500 text-xs font-hindi mt-0.5">{lesson.title_hindi}</div>
                          )}
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className={`badge text-xs ${getStatusColor(lesson.status)}`}>{getStatusLabel(lesson.status)}</span>
                            {lesson.score > 0 && (
                              <span className="text-xs text-slate-500">Best: {lesson.score.toFixed(0)}%</span>
                            )}
                            {lesson.xp_earned > 0 && (
                              <span className="text-xs text-brand-400 flex items-center gap-1">
                                <Star className="w-3 h-3" />{lesson.xp_earned} XP
                              </span>
                            )}
                          </div>
                        </div>

                        {unlocked && (
                          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-brand-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                        )}
                      </div>

                      {/* Score bar */}
                      {lesson.score > 0 && (
                        <div className="mt-3 ml-15 progress-bar" style={{ marginLeft: '60px' }}>
                          <div className="progress-fill bg-gradient-to-r from-emerald-500 to-emerald-400"
                            style={{ width: `${lesson.score}%` }} />
                        </div>
                      )}
                    </button>
                  </motion.div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
