import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Star, Flame, Trophy, CheckCircle2, Clock, TrendingUp, BookOpen } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'
import type { Stats } from '@/types'
import { xpToLevel } from '@/lib/utils'

export default function ProfilePage() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    api.get('/progress/stats').then(r => setStats(r.data)).catch(console.error)
  }, [])

  const { level, progress, nextLevelXp } = xpToLevel(user?.total_xp || 0)

  const levelTitles: Record<number, string> = {
    1: 'Beginner', 2: 'Learner', 3: 'Student', 4: 'Scholar',
    5: 'Practitioner', 6: 'Advanced', 7: 'Expert', 8: 'Master', 9: 'Guru', 10: 'Legend'
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-display font-bold text-white">Profile</h1>

      {/* User card */}
      <div className="card p-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-saffron-500 flex items-center justify-center text-white font-display font-bold text-2xl">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-white">{user?.name}</h2>
            <p className="text-slate-400 text-sm">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="badge bg-brand-500/15 text-brand-400 border border-brand-500/20">
                Level {level} · {levelTitles[level] || 'Learner'}
              </span>
              <span className="badge bg-saffron-500/15 text-saffron-400 border border-saffron-500/20 font-hindi">
                हिंदी → English
              </span>
            </div>
          </div>
        </div>

        {/* XP Progress */}
        <div className="mt-5">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400 flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-brand-400" />{user?.total_xp?.toLocaleString()} XP</span>
            <span className="text-slate-500">{nextLevelXp} XP to Level {level + 1}</span>
          </div>
          <div className="progress-bar h-3 rounded-full">
            <motion.div className="progress-fill bg-gradient-to-r from-brand-500 to-brand-400"
              initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1, delay: 0.2 }} />
          </div>
        </div>
      </div>

      {/* Stats grid */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { icon: Flame, label: 'Day Streak', value: `${user?.current_streak || 0} days`, color: 'text-saffron-400', bg: 'bg-saffron-500/10' },
            { icon: CheckCircle2, label: 'Lessons Done', value: `${stats.completed_lessons}/${stats.total_lessons}`, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { icon: TrendingUp, label: 'Avg Score', value: `${stats.avg_score}%`, color: 'text-purple-400', bg: 'bg-purple-500/10' },
            { icon: Trophy, label: 'Total XP', value: user?.total_xp?.toLocaleString() || '0', color: 'text-brand-400', bg: 'bg-brand-500/10' },
            { icon: BookOpen, label: 'Level', value: `${level} — ${levelTitles[level] || ''}`, color: 'text-rose-400', bg: 'bg-rose-500/10' },
            { icon: Clock, label: 'Member Since', value: new Date(user?.created_at || '').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }), color: 'text-slate-400', bg: 'bg-slate-500/10' },
          ].map(({ icon: Icon, label, value, color, bg }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="card p-4">
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-2`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div className="text-white font-display font-bold text-base leading-tight">{value}</div>
              <div className="text-slate-500 text-xs mt-0.5">{label}</div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Recent activity */}
      {stats?.recent_attempts && stats.recent_attempts.length > 0 && (
        <div className="card p-5">
          <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-400" /> Recent Activity
          </h3>
          <div className="space-y-2">
            {stats.recent_attempts.map((attempt, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-display
                  ${attempt.score >= 80 ? 'bg-emerald-500/15 text-emerald-400' : attempt.score >= 60 ? 'bg-saffron-500/15 text-saffron-400' : 'bg-red-500/15 text-red-400'}`}>
                  {attempt.score.toFixed(0)}%
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium">Lesson Quiz</div>
                  <div className="text-slate-500 text-xs">{attempt.correct}/{attempt.total} correct · {new Date(attempt.date).toLocaleDateString('en-IN')}</div>
                </div>
                <div className={`w-2 h-2 rounded-full ${attempt.score >= 70 ? 'bg-emerald-400' : 'bg-red-400'}`} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
