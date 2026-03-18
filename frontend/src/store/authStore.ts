import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'
import api from '@/lib/api'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const { data } = await api.post('/auth/login', { email, password })
          localStorage.setItem('token', data.access_token)
          set({ user: data.user, token: data.access_token, isLoading: false })
        } catch (err) {
          set({ isLoading: false })
          throw err
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true })
        try {
          const { data } = await api.post('/auth/register', {
            name, email, password,
            native_language: 'hindi',
            target_language: 'english',
          })
          localStorage.setItem('token', data.access_token)
          set({ user: data.user, token: data.access_token, isLoading: false })
        } catch (err) {
          set({ isLoading: false })
          throw err
        }
      },

      logout: () => {
        localStorage.removeItem('token')
        set({ user: null, token: null })
      },

      refreshUser: async () => {
        try {
          const { data } = await api.get('/auth/me')
          set({ user: data })
        } catch {
          get().logout()
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
)
