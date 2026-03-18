import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getLevelLabel(level: number) {
  const map: Record<number, string> = { 1: 'Beginner', 2: 'Elementary', 3: 'Intermediate' }
  return map[level] || 'Beginner'
}

export function getLevelColor(level: number) {
  const map: Record<number, string> = {
    1: 'text-emerald-400 bg-emerald-400/10',
    2: 'text-brand-400 bg-brand-400/10',
    3: 'text-purple-400 bg-purple-400/10',
  }
  return map[level] || map[1]
}

export function getStatusColor(status: string) {
  const map: Record<string, string> = {
    not_started: 'text-slate-400 bg-slate-400/10',
    in_progress: 'text-saffron-400 bg-saffron-400/10',
    completed: 'text-emerald-400 bg-emerald-400/10',
    mastered: 'text-purple-400 bg-purple-400/10',
  }
  return map[status] || map.not_started
}

export function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    not_started: 'शुरू नहीं',
    in_progress: 'जारी है',
    completed: 'पूरा हुआ',
    mastered: 'माहिर',
  }
  return map[status] || 'शुरू नहीं'
}

export function xpToLevel(xp: number): { level: number; progress: number; nextLevelXp: number } {
  const thresholds = [0, 200, 500, 1000, 2000, 3500, 5500, 8000, 11000, 15000]
  let level = 1
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (xp >= thresholds[i]) { level = i + 1; break }
  }
  const current = thresholds[Math.min(level - 1, thresholds.length - 1)]
  const next = thresholds[Math.min(level, thresholds.length - 1)]
  const progress = next === current ? 100 : ((xp - current) / (next - current)) * 100
  return { level, progress: Math.min(100, Math.round(progress)), nextLevelXp: next - xp }
}
