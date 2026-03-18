import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import DashboardPage from '@/pages/DashboardPage'
import LessonPage from '@/pages/LessonPage'
import QuizPage from '@/pages/QuizPage'
import DailyReviewPage from '@/pages/DailyReviewPage'
import ProfilePage from '@/pages/ProfilePage'
import Layout from '@/components/dashboard/Layout'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  return token ? <Navigate to="/dashboard" replace /> : <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route
          path="/dashboard"
          element={<PrivateRoute><Layout><DashboardPage /></Layout></PrivateRoute>}
        />
        <Route
          path="/lesson/:id"
          element={<PrivateRoute><Layout><LessonPage /></Layout></PrivateRoute>}
        />
        <Route
          path="/quiz/:id"
          element={<PrivateRoute><QuizPage /></PrivateRoute>}
        />
        <Route
          path="/daily-review"
          element={<PrivateRoute><DailyReviewPage /></PrivateRoute>}
        />
        <Route
          path="/profile"
          element={<PrivateRoute><Layout><ProfilePage /></Layout></PrivateRoute>}
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
