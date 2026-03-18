import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, LayoutDashboard, User, LogOut,
  Menu, X, Flame, Star, RefreshCw
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: RefreshCw, label: 'Daily Review', path: '/daily-review' },
  { icon: User, label: 'Profile', path: '/profile' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="min-h-screen flex bg-[var(--bg)]">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)} />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 h-screen w-64 z-30
        bg-[#0d1424] border-r border-white/[0.06]
        flex flex-col transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <div className="font-display font-bold text-white text-lg leading-none">LangLearn</div>
              <div className="text-xs text-slate-500 font-hindi mt-0.5">हिंदी → English</div>
            </div>
          </div>
        </div>

        {/* User info */}
        {user && (
          <div className="p-4 mx-3 mt-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-saffron-500 flex items-center justify-center text-white font-bold font-display text-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold text-sm truncate">{user.name}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex items-center gap-1 text-saffron-400 text-xs">
                    <Flame className="w-3 h-3" />{user.current_streak}d
                  </div>
                  <div className="flex items-center gap-1 text-brand-400 text-xs">
                    <Star className="w-3 h-3" />{user.total_xp} XP
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 p-3 mt-2 space-y-1">
          {navItems.map(({ icon: Icon, label, path }) => {
            const active = location.pathname === path
            return (
              <Link key={path} to={path} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${active
                    ? 'bg-brand-500/15 text-brand-300 border border-brand-500/20'
                    : 'text-slate-400 hover:bg-white/[0.05] hover:text-white'
                  }`}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
                {path === '/daily-review' && (
                  <span className="ml-auto bg-saffron-500/20 text-saffron-400 text-xs px-1.5 py-0.5 rounded-md font-semibold">Daily</span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/[0.06]">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200">
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-3 p-4 border-b border-white/[0.06] sticky top-0 bg-[var(--bg)] z-10">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-400 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-400" />
            <span className="font-display font-bold text-white">LangLearn</span>
          </div>
        </div>

        <div className="p-6 lg:p-8 max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
