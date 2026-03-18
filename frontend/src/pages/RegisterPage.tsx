import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const { register, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    try {
      await register(name, email, password)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-saffron-500/20 border border-saffron-500/30 mb-4">
            <BookOpen className="w-8 h-8 text-saffron-400" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white">GoNative</h1>
        </div>

        <div className="card p-8">
          <h2 className="text-xl font-display font-semibold text-white mb-2">Create your account</h2>
          <p className="text-slate-400 text-sm mb-6">Start learning English through Hindi — free forever.</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-5 text-red-400 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Your Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  className="input-field pl-10" placeholder="Your name" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="input-field pl-10" placeholder="you@example.com" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  className="input-field pl-10 pr-10" placeholder="At least 6 characters" required />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-sm text-slate-400">
              <span className="text-saffron-400 font-medium">Learning path:</span>{' '}
              <span className="font-hindi">हिंदी</span> → English
            </div>

            <button type="submit" className="btn-saffron w-full flex items-center justify-center gap-2" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? 'Creating account...' : 'Start Learning Free'}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
